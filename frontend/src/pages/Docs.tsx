import { Book, Code, Server, Zap, Database, Container } from 'lucide-react';

export function Docs() {
    return (
        <div className="container mx-auto max-w-6xl px-4 py-12 pb-24">
            <div className="text-center mb-16">
                <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                    Nexus Documentation
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    The complete guide to building, registering, and orchestrating decentralized AI agents on the Internet Computer.
                </p>
            </div>

            <div className="grid md:grid-cols-12 gap-8">
                {/* Sidebar Navigation (Sticky) */}
                <div className="md:col-span-3">
                    <div className="sticky top-24 space-y-2">
                        <h3 className="font-bold text-gray-900 mb-4 px-3">Contents</h3>
                        <a href="#overview" className="block px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md">Overview</a>

                        <a href="#getting-started" className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md">Getting Started</a>
                        <a href="#mcp-protocol" className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md">MCP Protocol</a>
                        <a href="#rag-agent" className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md">RAG & Vector DB</a>
                        <a href="#deployment" className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md">Deployment</a>
                    </div>
                </div>

                {/* Main Content */}
                <div className="md:col-span-9 space-y-16">

                    {/* Overview */}
                    <section id="overview" className="scroll-mt-24">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                                <Book className="w-6 h-6" />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900">Overview</h2>
                        </div>
                        <div className="prose prose-lg text-gray-600 max-w-none">
                            <p>
                                <strong>Nexus</strong> is a decentralized orchestration layer for AI agents. It allows developers to register specialized agents (tools) on the Internet Computer blockchain and enables users to chain them together using natural language prompts.
                            </p>
                            <p>
                                Unlike traditional chatbot aggregators, Nexus uses an intelligent <strong>LLM Orchestrator</strong> that dynamically plans and executes multi-step workflows across different agents, ensuring secure and verifiable execution.
                            </p>
                        </div>
                    </section>



                    {/* Getting Started */}
                    <section id="getting-started" className="scroll-mt-24">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-green-100 text-green-600">
                                <Zap className="w-6 h-6" />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900">Getting Started</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-slate-900 rounded-xl p-4 text-slate-200 font-mono text-sm overflow-x-auto">
                                <p className="text-slate-500"># 1. Clone the repository</p>
                                <p>git clone https://github.com/nexus/agent-hub.git</p>
                                <p>cd agent-hub</p>
                                <br />
                                <p className="text-slate-500"># 2. Start all services with Docker</p>
                                <p>docker-compose up --build</p>
                                <br />
                                <p className="text-slate-500"># 3. Access the application</p>
                                <p>open http://localhost:3000</p>
                            </div>
                            <p className="text-gray-600">
                                Once running, you can navigate to the <strong>Dashboard</strong> to register your own agents or use the <strong>Chat</strong> to start orchestrating existing ones.
                            </p>
                        </div>
                    </section>

                    {/* MCP Protocol */}
                    <section id="mcp-protocol" className="scroll-mt-24">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                                <Code className="w-6 h-6" />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900">Model Context Protocol (MCP)</h2>
                        </div>
                        <div className="prose prose-lg text-gray-600 max-w-none mb-6">
                            <p>
                                Nexus agents communicate using the <strong>Model Context Protocol</strong>. We support both a legacy REST format and the standard JSON-RPC 2.0 format.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 font-medium text-sm text-gray-700">
                                    Standard JSON-RPC (Recommended)
                                </div>
                                <div className="p-4 bg-white">
                                    <pre className="text-sm text-gray-800 overflow-x-auto">
                                        {`POST /mcp
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "tool_name",
    "arguments": { "arg1": "value" }
  },
  "id": 1
}`}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* RAG Agent */}
                    <section id="rag-agent" className="scroll-mt-24">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                                <Database className="w-6 h-6" />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900">RAG & Vector Database</h2>
                        </div>
                        <div className="prose prose-lg text-gray-600 max-w-none">
                            <p>
                                Nexus includes a built-in <strong>Knowledge Base Agent</strong> powered by ChromaDB and Sentence Transformers. This allows the orchestrator to "remember" facts and query documentation.
                            </p>
                            <ul className="list-disc pl-5 space-y-2 mt-4">
                                <li><strong>Add Document:</strong> <code>ADD: The secret code is 12345.</code></li>
                                <li><strong>Query:</strong> <code>What is the secret code?</code></li>
                            </ul>
                        </div>
                    </section>

                    {/* Deployment */}
                    <section id="deployment" className="scroll-mt-24">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-pink-100 text-pink-600">
                                <Container className="w-6 h-6" />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900">Deployment</h2>
                        </div>
                        <div className="prose prose-lg text-gray-600 max-w-none">
                            <p>
                                Nexus is fully containerized. The <code>docker-compose.yml</code> file orchestrates:
                            </p>
                            <ul className="grid grid-cols-2 gap-2 mt-4 text-sm font-mono text-gray-700">
                                <li className="bg-white p-2 rounded border">orchestrator (8000)</li>
                                <li className="bg-white p-2 rounded border">frontend (3000)</li>
                                <li className="bg-white p-2 rounded border">mock_mcp (9000)</li>
                                <li className="bg-white p-2 rounded border">rag_agent (7005)</li>
                                <li className="bg-white p-2 rounded border">web_search_agent (7002)</li>
                                <li className="bg-white p-2 rounded border">email_agent (7004)</li>
                            </ul>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}
