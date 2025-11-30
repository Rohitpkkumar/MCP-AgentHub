# Nexus: MCP Agent Hub

Nexus is a decentralized multi-agent system built on the **Model Context Protocol (MCP)** and the **Internet Computer (ICP)**. It orchestrates specialized AI agents to perform complex tasks through dynamic planning and execution.

## 🚀 Features

- **Decentralized Registry**: Agents are registered on the Internet Computer blockchain.
- **Dynamic Planning**: The Orchestrator uses LLMs (Groq/OpenAI) to break down user requests into executable steps.
- **Multi-Agent Architecture**: Modular agents for Web Search, RAG (Knowledge Base), Email, and Summarization.
- **MCP Compliance**: Built on the Model Context Protocol standard.

## 🛠️ Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **DFX SDK** (for local Internet Computer replica)
- **API Keys**: Groq (recommended) or OpenAI.

## 📦 Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/rohitpkkumar/MCP_Agent_Hub.git
    cd MCP_Agent_Hub
    ```

2.  **Set up the Python environment:**
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    ```

3.  **Set up the Frontend:**
    ```bash
    cd frontend
    npm install
    cd ..
    ```

4.  **Configure Environment Variables:**
    *   Copy the example file:
        ```bash
        cp orchestrator/.env.example orchestrator/.env
        ```
    *   Open `orchestrator/.env` and add your API keys (e.g., `GROQ_API_KEY`).

## 🏃‍♂️ Running the Project

You need to run several services in separate terminal windows.

### 1. Start the Internet Computer (Local Replica)
```bash
dfx start --clean --background
dfx deploy
```

### 2. Start the Agents
Run each command in a separate terminal (ensure `venv` is activated):

*   **Web Search Agent**: `uvicorn web_search_agent:app --port 7002`
*   **Summarise Agent**: `uvicorn summarise_agent:app --port 7003`
*   **Email Agent**: `uvicorn email_agent:app --port 7004`
*   **RAG Agent**: `uvicorn rag_agent:app --host 0.0.0.0 --port 7005 --reload`
*   **Dev Agent**: `uvicorn dev_agent:app --port 7001`

### 3. Start the Orchestrator
```bash
uvicorn orchestrator.main:app --reload --port 8000
```

### 4. Register Agents
Once all services are running, register the agents with the local blockchain registry:
```bash
python register_demo_agents.py
```

### 5. Start the Frontend
```bash
cd frontend
npm run dev
```
Access the UI at `http://localhost:5173`.

## 📚 Documentation

*   **[Workflow & Architecture](WORKFLOW.md)**: Detailed diagrams of how the system works.

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

[MIT](https://choosealicense.com/licenses/mit/)
