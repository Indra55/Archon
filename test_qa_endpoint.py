
import requests
import json

url = "http://localhost:8000/api/v1/knowledge/ask"
payload = {"question": "is there any auth implemented"}
headers = {"Content-Type": "application/json"}

try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"QA Status: {response.status_code}")
    # print("QA Response Data:")
    # print(json.dumps(response.json(), indent=2))
    
    scenarios_url = "http://localhost:8000/api/v1/knowledge/impact/scenarios"
    response = requests.get(scenarios_url)
    print(f"Scenarios Status: {response.status_code}")
    print("Scenarios Data:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Request failed: {e}")
