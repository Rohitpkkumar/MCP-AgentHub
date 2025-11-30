# Nexus Workflow Documentation

**Version:** 1.0.0
**Last Updated:** November 28, 2025

This document outlines the core workflows of the Nexus platform using visual diagrams. It covers how users interact with the system, how developers register agents, and the internal logic of the orchestrator.

---

## 1. User Interaction Workflow

This flow describes the lifecycle of a user's chat request, from the initial prompt to the final response.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Frontend as Chat Interface
    participant Orch as Orchestrator
    participant LLM as AI Model
    participant Agent as MCP Tool

    Note over User, Frontend: User initiates a request
    User->>Frontend: Sends prompt (e.g., "Research X")
    Frontend->>Orch: Forwards request via API

    Note over Orch, LLM: Planning Phase
    Orch->>Orch: Retrieves available tools
    Orch->>LLM: Sends Prompt + Tool Definitions
    LLM-->>Orch: Returns Execution Plan

    Note over Orch, Agent: Execution Phase
    loop For each step in Plan
        Orch->>Agent: Calls Tool (e.g., Search)
        Agent-->>Orch: Returns Result
        Orch->>Orch: Updates Context
    end

    Note over Orch, User: Response Phase
    Orch->>LLM: Synthesizes final answer
    LLM-->>Orch: Returns natural language summary
    Orch-->>Frontend: Sends final response
    Frontend-->>User: Displays answer
```

---

## 2. Agent Registration Workflow

This flow illustrates how a developer adds a new agent to the decentralized registry.

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer
    participant Dashboard as Developer Dashboard
    participant Orch as Orchestrator
    participant Registry as Decentralized Registry

    Note over Dev, Dashboard: Registration Initiation
    Dev->>Dashboard: Enters Agent URL & Metadata
    Dashboard->>Orch: Submits Registration Request

    Note over Orch: Validation
    Orch->>Orch: Pings Agent Endpoint
    alt Agent Unreachable
        Orch-->>Dashboard: Error: Agent Offline
        Dashboard-->>Dev: Shows Error
    else Agent Online
        Note over Orch, Registry: Persistance
        Orch->>Registry: Stores Agent Manifest
        Registry-->>Orch: Confirms Registration
        Orch-->>Dashboard: Success
        Dashboard-->>Dev: Shows "Agent Registered"
    end
```

---

## 3. Orchestration Logic

This flowchart details the internal decision-making process of the Orchestrator.

```mermaid
flowchart TD
    Start([Start]) --> Input{Receive User Prompt}
    Input --> Discovery[Discover Agents]
    Discovery --> Planning[Generate Plan via LLM]
    
    Planning --> Validation{Is Plan Valid?}
    Validation -- No --> Error([Return Error])
    Validation -- Yes --> ExecutionLoop

    subgraph ExecutionLoop [Execution Phase]
        Step[Get Next Step] --> ToolCall[Call MCP Tool]
        ToolCall --> Result[Receive Output]
        Result --> Context[Update Memory]
        Context --> MoreSteps{More Steps?}
        MoreSteps -- Yes --> Step
    end

    MoreSteps -- No --> Synthesis[Synthesize Final Answer]
    Synthesis --> End([Send Response to User])
```

---

## 4. Key Concepts

### Planning
The system does not use hard-coded logic. Instead, it uses a Large Language Model (LLM) to dynamically generate a plan based on the user's intent and the tools currently available in the registry.

### Execution
Tools are executed sequentially. The output of one tool (e.g., a search result) is fed back into the context, allowing subsequent tools (e.g., a summarizer) to use that information.

### Decentralization
The registry is hosted on a blockchain network, ensuring that no single entity can censor or remove agents. This creates a permissionless ecosystem where any developer can contribute.

---

## 5. Restoring Agents

If you restart the local Internet Computer replica (`dfx start --clean`) or move to a new device, the agent registry will be empty. To restore the default agents:

1.  **Ensure all services are running:**
    *   Orchestrator (`uvicorn orchestrator.main:app ...`)
    *   Agent services (Web Search, Email, etc.)

2.  **Run the registration script:**
    ```bash
    python register_demo_agents.py
    ```

This script will:
*   Register the Web Search, Summarise, Email, and RAG agents.
*   Register the Orchestrator itself.
*   Use `localhost` endpoints for local development.
