import requests
import json
import time

BASE_URL = "http://localhost:8000/api/v1/knowledge"

def test_qa():
    print("1. Testing Ingestion Endpoint...")
    sample_code = """
import logging
from utils.db import get_connection

def process_order(order_id: int):
    # This processes a user order and saves to DB
    logger = logging.getLogger('orders')
    conn = get_connection()
    conn.execute("UPDATE orders SET status='processed' WHERE id=?", (order_id,))
    logger.info(f"Order {order_id} processed.")
"""
    payload = {
        "repo": "test_repo",
        "file_path": "src/orders/processor.py",
        "content": sample_code
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/ingest", json=payload)
        print(f"Ingest Status: {resp.status_code}")
        print(f"Ingest Response: {resp.json()}")
    except Exception as e:
        print(f"Error calling ingest API: {e}")
        return

    print("\nWaiting a few seconds for graph indexing...")
    time.sleep(3)

    print("\n2. Testing QA Endpoint...")
    qa_payload = {
        "question": "What happens when process_order is called, and what database dependency does it use? Also provide me with the code as well"
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/ask", json=qa_payload)
        print(f"Ask Status: {resp.status_code}")
        res_json = resp.json()
        print("\n=== ANSWER ===")
        print(res_json.get("answer", "No answer found"))
        print("\n=== REFERENCES ===")
        for ref in res_json.get("references", []):
            print(f"- {ref.get('name')} in {ref.get('file_path')} (Score: {ref.get('score')})")
    except Exception as e:
        print(f"Error calling QA API: {e}")

if __name__ == "__main__":
    test_qa()
