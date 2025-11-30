import requests
import time

AGENT = {
    "id": "orchestrator_v2",
    "name": "System Orchestrator V2",
    "description": "The main orchestrator agent capable of calling other agents and answering users directly.",
    "developer": "2vxsx-fae",
    "endpoint": None, 
    "allowed_tools": ["call_agent", "answer_user", "no_agent_found"]
}

def register():
    print(f"Registering {AGENT['name']}...")
    try:
        resp = requests.post("http://localhost:8000/register", json=AGENT)
        if resp.status_code == 200:
            print(f"Success: {resp.json()}")
        else:
            print(f"Failed: {resp.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    register()
