import threading
import logging
from django.conf import settings
from .models import BlockchainTransaction
from web3 import Web3
from web3.exceptions import Web3Exception
import os

logger = logging.getLogger(__name__)

# Basic ABI for the single anchorHash function
MEDCHAIN_LEDGER_ABI = [
    {
        "inputs": [{"internalType": "bytes32", "name": "_hash", "type": "bytes32"}],
        "name": "anchorHash",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]

def anchor_hash_on_chain(tx_id):
    try:
        tx = BlockchainTransaction.objects.get(id=tx_id)
    except BlockchainTransaction.DoesNotExist:
        return

    try:
        # Load config
        contract_address = os.environ.get('MEDCHAIN_CONTRACT_ADDRESS')
        private_key = os.environ.get('MEDCHAIN_WALLET_PRIVATE_KEY')
        rpc_url = 'http://127.0.0.1:8545'

        if not contract_address or not private_key:
            raise ValueError("Blockchain config missing from environment")

        w3 = Web3(Web3.HTTPProvider(rpc_url))
        if not w3.is_connected():
            raise ConnectionError("Devnet is unreachable")

        # Set up account
        account = w3.eth.account.from_key(private_key)

        contract = w3.eth.contract(address=w3.to_checksum_address(contract_address), abi=MEDCHAIN_LEDGER_ABI)

        # file_hash is 64 hex chars. Add '0x' if needed and pad to bytes32.
        # Actually it's already a 64 char hex string from sha256 (hexdigest).
        hash_hex = tx.record.file_hash
        if not hash_hex.startswith('0x'):
            hash_hex = '0x' + hash_hex
        hash_bytes32 = Web3.to_bytes(hexstr=hash_hex)

        # Build transaction
        nonce = w3.eth.get_transaction_count(account.address)
        
        # We can just call anchorHash
        transaction = contract.functions.anchorHash(hash_bytes32).build_transaction({
            'chainId': w3.eth.chain_id,
            'gas': 2000000,
            'maxFeePerGas': w3.to_wei('2', 'gwei'),
            'maxPriorityFeePerGas': w3.to_wei('1', 'gwei'),
            'nonce': nonce,
        })

        # Sign
        signed_txn = w3.eth.account.sign_transaction(transaction, private_key=private_key)
        
        # Send
        tx_hash_bytes = w3.eth.send_raw_transaction(signed_txn.raw_transaction)
        
        # Wait for receipt
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash_bytes, timeout=120)

        if receipt.status == 1:
            tx.tx_hash = tx_hash_bytes.hex()
            tx.status = 'CONFIRMED'
            tx.save()
        else:
            tx.status = 'FAILED'
            tx.save()

    except Exception as e:
        logger.error(f"Blockchain submission failed for {tx_id}: {str(e)}", exc_info=True)
        try:
            tx.status = 'FAILED'
            tx.save()
        except:
            pass

def trigger_blockchain_transaction(tx_id):
    """
    Spawns a background thread that executes anchor_hash_on_chain without blocking API.
    """
    thread = threading.Thread(target=anchor_hash_on_chain, args=(tx_id,))
    thread.daemon = True
    thread.start()
