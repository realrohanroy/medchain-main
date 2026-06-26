from django.test import TestCase
from unittest.mock import patch, MagicMock
from blockchain.services import anchor_hash_on_chain
from blockchain.models import BlockchainTransaction
from records.models import Record
from django.contrib.auth import get_user_model
from web3.exceptions import Web3Exception
from rest_framework.test import APIClient
from django.core.files.uploadedfile import SimpleUploadedFile
import hashlib
import os

User = get_user_model()

class BlockchainServiceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="test@example.com", password="password")
        self.record = Record.objects.create(
            user=self.user,
            record_type="LAB_RESULT",
            file_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" # empty sha256
        )
        self.tx = BlockchainTransaction.objects.create(
            record=self.record,
            status='PENDING'
        )

    @patch('blockchain.services.Web3')
    @patch('blockchain.services.os.environ.get')
    def test_devnet_unreachable_sets_failed(self, mock_env, mock_web3_class):
        mock_env.side_effect = lambda k: "mock" if k in ['MEDCHAIN_CONTRACT_ADDRESS', 'MEDCHAIN_WALLET_PRIVATE_KEY'] else None
        
        mock_w3_instance = MagicMock()
        mock_w3_instance.is_connected.return_value = False
        mock_web3_class.return_value = mock_w3_instance

        # Run service
        anchor_hash_on_chain(self.tx.id)

        # Assert status is FAILED, no crash
        self.tx.refresh_from_db()
        self.assertEqual(self.tx.status, 'FAILED')

    @patch('blockchain.services.Web3')
    @patch('blockchain.services.os.environ.get')
    def test_reanchoring_already_anchored_hash_success(self, mock_env, mock_web3_class):
        mock_env.side_effect = lambda k: "mock_key" if k == 'MEDCHAIN_WALLET_PRIVATE_KEY' else "0xmockcontract"
        
        mock_w3_instance = MagicMock()
        mock_w3_instance.is_connected.return_value = True
        mock_web3_class.return_value = mock_w3_instance

        # Mock contract function call succeeding (simulating already anchored, our contract handles idempotency)
        # The Solidity anchorHash() method contains `if (anchoredHashes[_hash] == 0) { ... }` which makes duplicate hashes a successful no-op.
        # This test ensures we treat that successful transaction receipt (status = 1) correctly.
        mock_contract = MagicMock()
        mock_w3_instance.eth.contract.return_value = mock_contract
        
        mock_tx_builder = MagicMock()
        mock_contract.functions.anchorHash.return_value.build_transaction = mock_tx_builder

        mock_signed = MagicMock()
        mock_signed.raw_transaction = b'mock_raw'
        mock_w3_instance.eth.account.sign_transaction.return_value = mock_signed

        mock_hexbytes = MagicMock()
        mock_hexbytes.hex.return_value = "0xmockreceipt"
        mock_w3_instance.eth.send_raw_transaction.return_value = mock_hexbytes

        mock_receipt = MagicMock()
        mock_receipt.status = 1
        mock_receipt.transactionHash.hex.return_value = "0xmockreceipt"
        mock_w3_instance.eth.wait_for_transaction_receipt.return_value = mock_receipt

        # Run service
        anchor_hash_on_chain(self.tx.id)

        # Assert status is CONFIRMED
        self.tx.refresh_from_db()
        self.assertEqual(self.tx.status, 'CONFIRMED')
        self.assertEqual(self.tx.tx_hash, "0xmockreceipt")


class VerifyHashViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email="patient@example.com", password="password")
        self.client.force_authenticate(user=self.user)
        
        # Create record with a real test file
        self.file_content = b"Original Medical Data 123"
        self.uploaded_file = SimpleUploadedFile("test_record.pdf", self.file_content, content_type="application/pdf")
        
        h = hashlib.sha256()
        h.update(self.file_content)
        self.file_hash = h.hexdigest()
        
        self.record = Record.objects.create(
            user=self.user,
            record_type="LAB_RESULT",
            file_url=self.uploaded_file,
            file_hash=self.file_hash
        )

    @patch('blockchain.views.Web3')
    @patch('blockchain.views.os.environ.get')
    def test_verify_hash_happy_and_tampered_paths(self, mock_env, mock_web3_class):
        mock_env.return_value = "0xmockcontract"
        
        mock_w3_instance = MagicMock()
        mock_w3_instance.is_connected.return_value = True
        mock_web3_class.return_value = mock_w3_instance

        mock_contract = MagicMock()
        mock_w3_instance.eth.contract.return_value = mock_contract
        
        # 1. Happy path: verifyHash returns True
        mock_contract.functions.verifyHash.return_value.call.return_value = (True, 123456)
        
        response = self.client.get(f'/api/v1/blockchain/verify/{self.record.id}/')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['is_anchored'])
        self.assertTrue(response.data['db_hash_match'])
        self.assertFalse(response.data['chain_check_error'])
        
        # 2. Tamper path: Alter the actual file bytes on disk, then call again
        file_path = self.record.file_url.path
        with open(file_path, 'wb') as f:
            f.write(b"Tampered Medical Data 999")
            
        # The contract verifyHash will now return False because the new byte hash won't match what is anchored
        mock_contract.functions.verifyHash.return_value.call.return_value = (False, 0)
        
        response = self.client.get(f'/api/v1/blockchain/verify/{self.record.id}/')
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data['is_anchored'])
        self.assertFalse(response.data['db_hash_match']) # Since file bytes changed, hash recomputation will mismatch DB
        self.assertFalse(response.data['chain_check_error'])
