#!/bin/bash

# Function to kill all background processes on exit
cleanup() {
    echo "Stopping all services..."
    kill $(jobs -p)
    exit
}

trap cleanup SIGINT SIGTERM

# Start Orchestrator
echo "Starting Orchestrator on port 8000..."
(
    if [ -d "orchestrator/venv" ]; then source orchestrator/venv/bin/activate; fi
    uvicorn orchestrator.main:app --host 0.0.0.0 --port 8000
) &

# Start Mock MCP
echo "Starting Mock MCP on port 9000..."
(
    if [ -d "mcp-servers/venv" ]; then source mcp-servers/venv/bin/activate; 
    elif [ -d "orchestrator/venv" ]; then source orchestrator/venv/bin/activate; fi
    uvicorn mcp-servers.mock_mcp:app --host 0.0.0.0 --port 9000
) &

# Start Agents (assuming they use the root or orchestrator venv)
# You might need to adjust venv activation for each if they are different
echo "Starting Agents..."
(
    if [ -d "orchestrator/venv" ]; then source orchestrator/venv/bin/activate; fi
    uvicorn dev_agent:app --host 0.0.0.0 --port 7001 &
    uvicorn web_search_agent:app --host 0.0.0.0 --port 7002 &
    uvicorn summarise_agent:app --host 0.0.0.0 --port 7003 &
    uvicorn email_agent:app --host 0.0.0.0 --port 7004 &
    uvicorn rag_agent:app --host 0.0.0.0 --port 7005 &
    wait
) &

echo "All services started. Press Ctrl+C to stop."
wait
