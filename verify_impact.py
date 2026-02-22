import requests
import json
import time

def test_impact_analysis():
    url = "http://localhost:8000/api/v1/knowledge/impact/analyze"
    scenario = "What if we change the secret key in jwt_manager.py?"
    
    print(f"Testing Impact Analysis for scenario: '{scenario}'")
    
    try:
        start_time = time.time()
        response = requests.post(url, json={"scenario": scenario})
        end_time = time.time()
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Time: {end_time - start_time:.2f}s")
        
        if response.status_code == 200:
            data = response.json()
            if "error" in data:
                print(f"ERROR: {data['error']}")
            else:
                print("SUCCESS: Analysis completed.")
                print(f"Focal Node: {data.get('focal_node', {}).get('name')}")
                print(f"Graph Nodes: {len(data.get('graph', {}).get('nodes', []))}")
                print(f"Report Title: {data.get('report', {}).get('title')}")
                # print(json.dumps(data, indent=2))
        else:
            print(f"FAILED: {response.text}")
            
    except Exception as e:
        print(f"EXCEPTION: {e}")

if __name__ == "__main__":
    test_impact_analysis()
