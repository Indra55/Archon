
import json
import os

def check_json(filepath):
    try:
        with open(filepath, 'rb') as f:
            content = f.read()
            print(f"Checking {filepath}: {len(content)} bytes")
            print(f"First 10 bytes: {content[:10]}")
            # Try to decode
            decoded = content.decode('utf-8')
            json.loads(decoded)
            print(f"JSON in {filepath} is VALID")
    except Exception as e:
        print(f"ERROR in {filepath}: {e}")

check_json('package.json')
check_json('tsconfig.json')
check_json('components.json')
