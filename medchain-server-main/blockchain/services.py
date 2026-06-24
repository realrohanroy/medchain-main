import time
import threading
from .models import BlockchainTransaction
import logging
logger = logging.getLogger(__name__)

def simulate_blockchain_submission(tx_id):
    time.sleep(3)
    
    try:
        tx = BlockchainTransaction.objects.get(id=tx_id)
        
        tx.tx_hash = f"0xmock{tx.id.hex}"
        tx.status = 'CONFIRMED'
        tx.save()
        
    except BlockchainTransaction.DoesNotExist:
        return
    except Exception as e:
        try:
            tx.status = 'FAILED'
            tx.save()
        except:
            pass

        logger.error("Blockchain submission failed", exc_info=True)
def trigger_blockchain_transaction(tx_id):
    """
    Spawns a background thread that executes simulate_blockchain_submission without blocking API.
    """
    thread = threading.Thread(target=simulate_blockchain_submission, args=(tx_id,))
    thread.daemon = True
    thread.start()
