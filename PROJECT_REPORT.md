# PROJECT REPORT: Nexus (MCP Agent Hub)

**Project Name:** Nexus (MCP Agent Hub)
**Date:** November 28, 2025
**Version:** 1.0.0

---

## Executive Summary

Nexus (MCP Agent Hub) is a decentralized orchestration platform designed to bridge the gap between Large Language Models (LLMs) and specialized tools (Agents). By leveraging the Model Context Protocol (MCP) and the Internet Computer (ICP) blockchain, Nexus provides a secure, scalable, and verifiable environment for discovering, registering, and executing AI agents.

The platform solves the "siloed intelligence" problem where AI agents exist in isolation. Nexus acts as a central nervous system, allowing an Orchestrator to dynamically plan and execute complex workflows by chaining together independent agents—ranging from web searchers and code executors to vector database retrievers and email automation tools.

This report details the architectural design, technical implementation, workflow logic, and future roadmap of the Nexus project. It serves as a comprehensive guide for developers, stakeholders, and researchers interested in the convergence of Agentic AI and Blockchain technology.

---

## Table of Contents

1.  [Chapter 1: Introduction & Fundamentals](#chapter-1-introduction--fundamentals)
2.  [Chapter 2: System Architecture](#chapter-2-system-architecture)
3.  [Chapter 3: Workflow & Logic](#chapter-3-workflow--logic)
4.  [Chapter 4: Frontend & User Interface](#chapter-4-frontend--user-interface)
5.  [Chapter 5: Technology Stack & Environment](#chapter-5-technology-stack--environment)
6.  [Chapter 6: Setup & Installation](#chapter-6-setup--installation)
7.  [Chapter 7: Future Scope](#chapter-7-future-scope)
8.  [Chapter 8: Conclusion & References](#chapter-8-conclusion--references)

---

## Chapter 1: Introduction & Fundamentals

### 1.1 The Rise of Agentic AI

Artificial Intelligence has evolved from static request-response models (chatbots) to agentic systems capable of autonomous action. Agentic AI refers to systems that can perceive their environment, reason about how to achieve a goal, and execute actions to fulfill that goal.

Unlike a standard LLM which only outputs text, an **AI Agent** has access to "tools"—functions that allow it to interact with the outside world (e.g., search the web, query a database, send an email).

**Key Characteristics of Agentic AI:**
*   **Autonomy:** Operates with minimal human intervention after the initial prompt.
*   **Tool Use:** Can invoke external APIs and software functions.
*   **Planning:** Can break down complex goals into a sequence of steps.
*   **Memory:** Retains context across interactions to inform future decisions.

### 1.2 The Model Context Protocol (MCP)

The **Model Context Protocol (MCP)** is an emerging standard designed to unify how AI models interact with external context and tools. Before MCP, every AI application had to invent its own way of defining tools (e.g., OpenAI Functions, LangChain Tools, Semantic Kernel Plugins). This led to fragmentation and vendor lock-in.

MCP provides a standardized JSON-RPC based protocol for:
1.  **Exposing Resources:** Allowing models to read data (files, database rows) in a structured way.
2.  **Defining Prompts:** Standardizing templates for common tasks.
3.  **Invoking Tools:** A uniform interface for calling functions (`tools/call`) and receiving results.

Nexus adopts MCP as its core communication layer, ensuring that any agent built to the MCP standard can be instantly integrated into the ecosystem without custom adapters.

### 1.3 Decentralized AI & The Internet Computer (ICP)

Centralized AI platforms control the discovery and execution of agents, creating single points of failure and censorship risks. **The Internet Computer (ICP)** offers a solution by hosting the **Agent Registry** on a blockchain.

**Why ICP?**
*   **Tamper-proof Registry:** Agent manifests (metadata, endpoints, public keys) stored on ICP cannot be maliciously altered.
*   **Verifiable Identity:** Agents can be cryptographically signed, ensuring users know exactly who is running the code.
*   **Smart Contracts (Canisters):** The registry logic runs as a "canister"—a compiled WebAssembly module that executes with the security guarantees of the blockchain.

### 1.4 The Role of the Orchestrator

In a multi-agent system, an **Orchestrator** is essential. It acts as the "brain" that coordinates the "limbs" (agents).

The Nexus Orchestrator is responsible for:
1.  **Intent Understanding:** Parsing the user's natural language request.
2.  **Discovery:** Querying the ICP Registry to find relevant agents.
3.  **Planning:** Using an LLM to generate a step-by-step execution plan.
4.  **Execution:** Calling the agents in the correct order, passing outputs from one as inputs to the next.
5.  **Synthesis:** Combining the results into a final answer for the user.

---

## Chapter 2: System Architecture

### 2.1 High-Level Overview

The Nexus architecture follows a microservices pattern, centered around a Python-based Orchestrator that bridges the frontend user experience with a distributed network of MCP agents.

**Core Components:**
1.  **Frontend (React/Vite):** The user interface.
2.  **Orchestrator (FastAPI):** The central logic engine.
3.  **Registry (ICP Canister):** The decentralized directory of agents.
4.  **MCP Agents (Microservices):** Independent tools (Search, RAG, Email, etc.).
5.  **External Services:** LLM Providers (OpenAI/Groq), Vector Databases (Weaviate).

### 2.2 Component Breakdown

#### 2.2.1 The Orchestrator (`orchestrator/`)
*   **Technology:** Python, FastAPI, Uvicorn.
*   **Function:** Handles HTTP requests from the frontend. It maintains the session state and coordinates the lifecycle of a user request.
*   **Key Modules:**
    *   `main.py`: Entry point and API routes (`/plan`, `/execute`).
    *   `llm_adapter.py`: Interfaces with LLM providers to generate plans.
    *   `runner.py`: The execution engine that iterates through the plan and calls tools.
    *   `registry_client.py`: Communicates with the ICP canister.

#### 2.2.2 The Agent Registry (`canisters/registry`)
*   **Technology:** Motoko (ICP Smart Contract Language).
*   **Function:** Stores the "Yellow Pages" of agents.
*   **Data Structure:**
    *   `AgentManifest`: Contains `id`, `name`, `description`, `endpoint_url`, and `tool_definitions`.
*   **Methods:**
    *   `register_agent(manifest)`: Adds a new agent.
    *   `list_agents()`: Returns all available agents.
    *   `get_agent(id)`: Retrieves details for a specific agent.

#### 2.2.3 MCP Agents (`*_agent.py`)
Nexus includes several reference implementations of MCP agents:
*   **Web Search Agent (Port 7002):** Uses external APIs (e.g., DuckDuckGo, Google) to fetch real-time information.
*   **RAG Agent (Port 7005):** "Retrieval Augmented Generation". Connects to a Weaviate vector database to search through uploaded documentation.
*   **Dev Agent (Port 7001):** Capable of executing code snippets or interacting with GitHub.
*   **Email Agent (Port 7004):** A mock agent demonstrating how to send emails via SMTP/API.
*   **Summarise Agent (Port 7003):** A specialized utility agent for condensing large text blocks.

#### 2.2.4 The Frontend (`frontend/`)
*   **Technology:** React, TypeScript, Tailwind CSS, Framer Motion.
*   **Function:** Provides a chat interface for users and a dashboard for developers to register agents.
*   **Communication:** Connects to the Orchestrator via REST API.

### 2.3 Data Flow Diagram

*(Space reserved for Architecture Diagram)*
[The diagram would depict the User connecting to the Frontend, which talks to the Orchestrator. The Orchestrator connects to the LLM for planning, the ICP Registry for discovery, and then fans out requests to the various MCP Agents.]

---

## Chapter 3: Workflow & Logic

### 3.1 The Orchestration Loop

The core value of Nexus is its ability to turn a vague request into concrete actions. This follows a "Plan-Execute-Verify" loop.

**Step 1: User Request**
> User: "Find the latest news on Quantum Computing and email a summary to boss@company.com"

**Step 2: Discovery & Planning**
The Orchestrator receives this prompt. It queries the Registry: "What tools do I have?"
*   Registry returns: `[WebSearch, EmailSender, Summarizer, RAG]`
The Orchestrator sends the Prompt + Tool Definitions to the LLM.

**Step 3: Plan Generation**
The LLM generates a JSON plan:
```json
{
  "steps": [
    { "tool": "WebSearch", "args": { "query": "latest news Quantum Computing" }, "id": "step1" },
    { "tool": "Summarizer", "args": { "text": "$step1.result" }, "id": "step2" },
    { "tool": "EmailSender", "args": { "to": "boss@company.com", "body": "$step2.result" }, "id": "step3" }
  ]
}
```

**Step 4: Execution**
The `runner.py` module iterates through the steps:
1.  Calls `WebSearch` agent. Receives search results.
2.  Calls `Summarizer` agent, injecting the search results. Receives summary.
3.  Calls `EmailSender` agent, injecting the summary. Sends email.

**Step 5: Response**
The Orchestrator reports back to the Frontend: "Task completed. Email sent."

### 3.2 Agent Registration Process

1.  **Developer** starts their agent service (e.g., on AWS or localhost).
2.  Developer goes to the Nexus **Dashboard**.
3.  Developer enters the **Agent URL** and **Manifest** (JSON).
4.  Frontend sends this to the Orchestrator.
5.  Orchestrator validates the manifest (checks if the endpoint is reachable).
6.  Orchestrator calls the **ICP Registry Canister** to permanently store the record.

### 3.3 Inter-Agent Communication

Nexus uses HTTP/JSON-RPC for all inter-agent communication.
*   **Request:** `POST /mcp` with body `{"method": "tools/call", "params": {...}}`
*   **Response:** `{"result": {...}}` or `{"error": {...}}`

This standardization means the Orchestrator doesn't need to know *how* an agent is implemented (Python, Node.js, Go), only that it speaks MCP.

---

## Chapter 4: Frontend & User Interface

### 4.1 Design Philosophy

The Nexus UI is built with a **"Cyber-Futuristic"** aesthetic to reflect the cutting-edge nature of the technology.
*   **Theme:** Dark mode by default (`bg-slate-950`).
*   **Accents:** High-contrast neon colors (Cyan, Purple, Emerald) to distinguish different agent types.
*   **Materials:** Glassmorphism (translucent blurs) used for cards and overlays to create depth.
*   **Motion:** `Framer Motion` is used for smooth page transitions and micro-interactions (hover states, loading spinners).

### 4.2 Component Hierarchy

*   `App.tsx`: Main router and layout wrapper.
*   `Layout.tsx`: Contains the persistent `Navbar` and background effects.
*   `pages/`:
    *   `Home.tsx`: Landing page with hero section and feature grid.
    *   `Dashboard.tsx`: Form for registering new agents.
    *   `Chat.tsx`: The main interface for interacting with the Orchestrator.
    *   `Agents.tsx`: A catalog view of all registered agents.
    *   `Docs.tsx`: Documentation for developers.
*   `components/`:
    *   `AgentCard.tsx`: Reusable component to display agent info.
    *   `ChatMessage.tsx`: Renders user and system messages.

### 4.3 State Management

*   **React Query:** Used for fetching asynchronous data (list of agents, chat responses). It handles caching, loading states, and error handling automatically.
*   **Context API (`AuthContext`):** Manages the user's login state (mocked for this version, but designed for Web3 identity integration).

---

## Chapter 5: Technology Stack & Environment

### 5.1 Backend Stack

*   **Language:** Python 3.10+
*   **Framework:** FastAPI (High performance, easy async support).
*   **Server:** Uvicorn (ASGI server).
*   **HTTP Client:** `httpx` (Async HTTP requests).
*   **Cryptography:** `pynacl` (For verifying signatures, if enabled).

### 5.2 Frontend Stack

*   **Framework:** React 18
*   **Build Tool:** Vite (Fast HMR and bundling).
*   **Styling:** Tailwind CSS (Utility-first CSS).
*   **Icons:** Lucide React.
*   **Animations:** Framer Motion.
*   **HTTP Client:** Axios / Fetch API.

### 5.3 Database & Storage

*   **Vector Database:** Weaviate (Dockerized). Used by the RAG agent to store and retrieve semantic embeddings.
*   **Registry Storage:** Internet Computer Blockchain (Canister).
*   **Local Storage:** Browser `localStorage` for simple user preferences.

### 5.4 Infrastructure

*   **Docker:** All services are containerized.
*   **Docker Compose:** Orchestrates the multi-container setup (Orchestrator, Frontend, Mock MCP, Agents, Weaviate).
*   **Environment Variables:** `.env` files manage configuration (API keys, endpoints) securely.

---

## Chapter 6: Setup & Installation

### 6.1 Prerequisites

*   **Docker & Docker Compose:** Essential for running the stack.
*   **Node.js (v18+):** For frontend development.
*   **Python (v3.10+):** For backend development.
*   **Git:** For version control.

### 6.2 Local Development Guide

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/nexus/agent-hub.git
    cd agent-hub
    ```

2.  **Environment Configuration:**
    Create a `.env` file in the `orchestrator/` directory:
    ```env
    OPENAI_API_KEY=sk-...
    IC_HOST=http://127.0.0.1:4943
    ```

3.  **Start Services (Docker):**
    ```bash
    docker-compose up --build
    ```
    This command builds the images and starts:
    *   Frontend at `http://localhost:3000`
    *   Orchestrator at `http://localhost:8000`
    *   Agents at ports `7001-7005`

4.  **Access the Application:**
    Open your browser to `http://localhost:3000`.

### 6.3 Troubleshooting

*   **Port Conflicts:** Ensure ports 3000, 8000, and 7001-7005 are free.
*   **LLM Errors:** Verify your API key in the `.env` file.
*   **Connection Refused:** Ensure Docker containers are running (`docker ps`).

---

## Chapter 7: Future Scope

### 7.1 Real-time Collaboration
Future versions of Nexus could support multi-user sessions, where teams can collaborate in the same chat room, invoking agents together to solve shared problems.

### 7.2 Enhanced Security
*   **Canister Signing:** Implementing full cryptographic verification where agents sign their responses, and the Orchestrator verifies them against the public key in the Registry.
*   **Sandboxing:** Running untrusted agent code in secure, isolated environments (e.g., Firecracker microVMs) to prevent malicious actions.

### 7.3 Agent Marketplace
Turning the Registry into a full marketplace where developers can monetize their agents. Users could pay micro-transactions (in ICP or Bitcoin) to use premium agents (e.g., a specialized legal analysis agent or a high-end image generator).

### 7.4 Voice Interface
Integrating Voice-to-Text (Whisper) and Text-to-Speech (ElevenLabs) to allow users to talk to Nexus, making it a true ambient computing assistant.

---

## Chapter 8: Conclusion & References

### 8.1 Conclusion

Nexus represents a significant step forward in the democratization of Agentic AI. By combining the flexibility of the Model Context Protocol with the security and decentralization of the Internet Computer, it creates a robust ecosystem where agents can be easily discovered, trusted, and composed into powerful workflows.

The project successfully demonstrates that complex AI orchestration is possible today, paving the way for a future where AI agents act as reliable, autonomous extensions of human intent.

### 8.2 References

1.  **Model Context Protocol (MCP):** https://modelcontextprotocol.io
2.  **Internet Computer (ICP):** https://internetcomputer.org
3.  **FastAPI Documentation:** https://fastapi.tiangolo.com
4.  **React Documentation:** https://react.dev
5.  **Weaviate Vector Database:** https://weaviate.io
6.  **LangChain (Concept Reference):** https://langchain.com

---
*End of Report*
