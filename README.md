<h1 align="center">
  <img src="src/mcp_agenthub_frontend/public/MCPAgentHubLogo.svg" alt="MCP-AgentHub Logo" height="100"><br>
  <strong>MCP-AGENTHUB</strong>
</h1>

<p align="center">
  <a href="https://<your-deployed-link>.icp0.io/" target="_blank">
    <img src="https://img.shields.io/badge/Live%20Demo-MCP--AGENTHUB-blueviolet?style=for-the-badge&logo=chrome&logoColor=white" alt="Live Demo">
  </a>
  <p align = "center">
  <img src="https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge&logo=semver&logoColor=white" alt="Version">
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge&logo=open-source-initiative&logoColor=white" alt="License">
  </p>
</p>

<p align="center">
  <em><strong>Decentralized AI Agent Network on ICP</strong></em><br><br>
  A platform to register, discover, and interact with AI agents,<br>
  built using the Model Context Protocol (MCP) and Internet Computer.<br>
  <br>
  <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Brain.png" alt="Brain" width=auto height="15" /> <strong>AI-Powered</strong> &nbsp;|&nbsp; 
  <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Balance%20Scale.png" alt="Balance Scale" width=auto height="15" /> <strong>Decentralized</strong> &nbsp;|&nbsp; 
  <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Satellite.png" alt="Satellite" width=auto height="15" /> <strong>Composable</strong>
</p>

---

# Overview
**MCP-AgentHub** is a **decentralized AI agent platform** that allows developers to register their AI microservices (agents), and users to invoke these agents through a **unified interface**.  
It leverages ICP's **on-chain storage, HTTP outcalls, and identity** to ensure **trustless agent orchestration** and **monetization**.

---

# Features
- **Decentralized MCP Server:** AI agent registry stored on ICP canister.
- **Agent Marketplace:** Developers register and monetize their AI tools.
- **ChatGPT-like UI:** Users interact with agents through a single interface.
- **Sample Agents Included:** Text summarizer (GPT-powered), Image captioning, Translator.
- **On-Chain Logs & Memory:** Persistent and verifiable execution history.

---

# Getting Started

To explore or build on `mcp_agenthub`, check the official ICP developer resources:

- <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Books.png" alt="Books" width=auto height="15" /> [Quick Start](https://internetcomputer.org/docs/current/developer-docs/setup/deploy-locally)  
- <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Hammer%20and%20Wrench.png" alt="Hammer and Wrench" width=auto height="15" /> [SDK Developer Tools](https://internetcomputer.org/docs/current/developer-docs/setup/install)  
- <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Food/Crab.png" alt="Crab" width=auto height="15" /> [Rust Canister Development Guide](https://internetcomputer.org/docs/current/developer-docs/backend/rust/)  
- <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/DNA.png" alt="DNA" width=auto height="15" /> [ic-cdk](https://docs.rs/ic-cdk)  

---

# Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/mcp-agenthub.git
cd mcp-agenthub
```
# Start local replica
```bash
dfx start --background
```
# Deploy backend canisters
```bash
dfx deploy
```

#Frontend Development:
```bash
npm install
npm start
```