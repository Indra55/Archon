import requests
import json
import time

BASE_URL = "http://localhost:8000/api/v1/webhook/github"

def test_push_event():
    print("🚀 Testing Push Event Webhook...")
    
    # Mock payload for a push event that matches what GitHub sends
    # We use indra55/aegis because that's the repository configured in agent/.env
    payload = {
        "ref": "refs/heads/main",
        "repository": {
            "full_name": "indra55/aegis",
            "name": "aegis"
        },
        "commits": [
            {
                "id": "1234567890abcdef",
                "message": "Update README and some code",
                "added": [
                    # A dummy file we know exists or just a generic test name
                    "server/server.js"
                ],
                "modified": [
                    "README.md"
                ],
                "removed": []
            }
        ]
    }

    headers = {
        "X-GitHub-Event": "push",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(BASE_URL, json=payload, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error sending push webhook: {e}")

def test_pr_event():
    print("\n🚀 Testing Pull Request Event Webhook...")
    
    payload = {
        "action": "opened",
        "number": 1,
        "pull_request": {
            "title": "Test PR Request"
        },
        "repository": {
            "full_name": "indra55/aegis"
        }
    }

    headers = {
        "X-GitHub-Event": "pull_request",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(BASE_URL, json=payload, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error sending PR webhook: {e}")

if __name__ == "__main__":
    print("Testing KA-CHOW Webhook Endpoints...")
    print("Make sure 'python server.py' is running locally on port 8000!\n")
    
    test_push_event()
    time.sleep(1)
    # PR test would require an actual PR number on indra55/aegis to fetch
    # test_pr_event() 
    
    print("\n✅ Done.")
