import requests
import time

AGENTS = [
    {
        "id": "web_search_agent",
        "name": "Web Search Agent",
        "description": "Searches the web for information given a query.",
        "developer": "2vxsx-fae",
        "endpoint": "http://localhost:7002",
        "allowed_tools": ["call_agent"]
    },
    {
        "id": "summarise_agent",
        "name": "Summarise Agent",
        "description": "Summarizes text content into concise points.",
        "developer": "2vxsx-fae",
        "endpoint": "http://localhost:7003",
        "allowed_tools": ["call_agent"]
    },
    {
        "id": "email_agent",
        "name": "Email Agent",
        "description": "Sends emails to specified recipients.",
        "developer": "2vxsx-fae",
        "endpoint": "http://localhost:7004",
        "allowed_tools": ["call_agent"]
    },
    # RAG Agent
    {
        "id": "rag_agent",
        "name": "Knowledge Base Agent",
        "description": "Stores and retrieves information using vector search (RAG). Use for 'remembering' facts or querying documentation.",
        "endpoint": "http://localhost:7005",
        "allowed_tools": ["execute"],
        "developer": "2vxsx-fae"
    }
]

async def register_all():
    for agent in AGENTS:
        print(f"Registering {agent['name']}...")
        try:
            resp = requests.post("http://localhost:8000/register", json=agent)
            if resp.status_code == 200:
                print(f"Success: {resp.json()}")
            else:
                print(f"Failed: {resp.text}")
        except Exception as e:
            print(f"Error: {e}")
        time.sleep(1)

    # Register Orchestrator Agent (virtual agent for planning/execution)
    print("Registering Orchestrator Agent...")
    orchestrator_manifest = {
        "id": "orchestrator_v2",
        "name": "Orchestrator",
        "description": "Main orchestrator agent that plans and executes tasks using other agents.",
        "developer": "2vxsx-fae",
        "version": "0.2.0",
        "allowed_tools": ["call_agent", "answer_user"],
        "endpoint": None  # No endpoint means it runs on the orchestrator itself
    }
    try:
        resp = requests.post("http://localhost:8000/register", json=orchestrator_manifest)
        if resp.status_code == 200:
            print(f"Success: {resp.json()}")
        else:
            print(f"Failed: {resp.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(register_all())
