import hashlib
import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from web3 import Web3
from records.models import Record
from sharing.access_control import has_active_grant, get_accessible_record_ids

# ABI for verifyHash
MEDCHAIN_LEDGER_ABI = [
    {
        "inputs": [{"internalType": "bytes32", "name": "_hash", "type": "bytes32"}],
        "name": "verifyHash",
        "outputs": [
            {"internalType": "bool", "name": "", "type": "bool"},
            {"internalType": "uint256", "name": "", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
    }
]

class VerifyHashView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, record_id):
        try:
            record = Record.objects.get(id=record_id)
        except Record.DoesNotExist:
            return Response({"error": "Record not found"}, status=status.HTTP_404_NOT_FOUND)

        # Access Check: Patient self-access OR Doctor access
        has_access = False
        if request.user == record.user:
            has_access = True
        else:
            # Check if doctor has access
            accessible_ids = get_accessible_record_ids(request.user, record.user.id)
            if record.id in accessible_ids:
                has_access = True

        if not has_access:
            return Response({"error": "You do not have access to this record."}, status=status.HTTP_403_FORBIDDEN)

        # Recompute SHA-256 from live file content
        file_hash = hashlib.sha256()
        try:
            with record.file_url.open('rb') as f:
                while chunk := f.read(8192):
                    file_hash.update(chunk)
            recomputed_hash_hex = file_hash.hexdigest()
        except Exception as e:
            return Response({"error": f"Could not read file: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        db_hash_match = (recomputed_hash_hex == record.file_hash)

        # Check blockchain
        contract_address = os.environ.get('MEDCHAIN_CONTRACT_ADDRESS')
        rpc_url = 'http://127.0.0.1:8545'

        is_anchored = False
        anchored_timestamp = 0
        chain_check_error = False

        if contract_address:
            try:
                w3 = Web3(Web3.HTTPProvider(rpc_url))
                if w3.is_connected():
                    contract = w3.eth.contract(address=w3.to_checksum_address(contract_address), abi=MEDCHAIN_LEDGER_ABI)
                    
                    hash_hex = '0x' + recomputed_hash_hex
                    hash_bytes32 = Web3.to_bytes(hexstr=hash_hex)
                    
                    result = contract.functions.verifyHash(hash_bytes32).call()
                    is_anchored = result[0]
                    anchored_timestamp = result[1]
                else:
                    chain_check_error = True
            except Exception as e:
                chain_check_error = True
        else:
            chain_check_error = True

        return Response({
            "record_id": record.id,
            "recomputed_hash": recomputed_hash_hex,
            "db_hash_match": db_hash_match,
            "is_anchored": is_anchored,
            "anchored_timestamp": anchored_timestamp,
            "chain_check_error": chain_check_error
        })
