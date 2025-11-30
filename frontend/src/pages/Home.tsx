import { Link } from 'react-router-dom';
import { ArrowRight, Search, Mail, FileText, Zap, Shield, Globe } from 'lucide-react';

export function Home() {
    return (
        <div className="flex flex-col gap-12 pb-20">
            {/* Hero Section */}
            <section className="relative pt-10 pb-20 px-4 text-center overflow-hidden">
                <div className="max-w-4xl mx-auto relative z-10">
                    <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-white/50 backdrop-blur-md border border-white/40 text-sm font-medium text-indigo-600 shadow-sm animate-float">
                        ✨ The Future of Multi-Agent Orchestration
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-6">
                        Orchestrate AI Agents <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                            with One Prompt
                        </span>
                    </h1>
                    <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Discover, chain, and execute specialized AI agents securely on the Internet Computer.
                        The intelligent hub that turns your intent into action.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link
                            to="/chat"
                            className="px-8 py-4 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center gap-2"
                        >
                            Start Orchestrating <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link
                            to="/agents"
                            className="px-8 py-4 rounded-full bg-white/80 backdrop-blur-sm text-gray-900 font-semibold border border-white/40 hover:bg-white transition-all shadow-md hover:shadow-lg"
                        >
                            Explore Registry
                        </Link>
                    </div>
                </div>

                {/* 3D Constellation Background */}

            </section>

            {/* Features Grid */}
            <section className="max-w-6xl mx-auto px-4 w-full relative z-10">
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="p-8 rounded-2xl bg-white/40 backdrop-blur-md border border-white/50 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                        <div className="w-12 h-12 rounded-xl bg-pastel-blue flex items-center justify-center mb-6 text-indigo-600">
                            <Zap className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-gray-900">Intelligent Planning</h3>
                        <p className="text-gray-600 leading-relaxed">
                            Our LLM orchestrator breaks down complex requests into executable steps, selecting the right agents for the job.
                        </p>
                    </div>
                    <div className="p-8 rounded-2xl bg-white/40 backdrop-blur-md border border-white/50 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                        <div className="w-12 h-12 rounded-xl bg-pastel-purple flex items-center justify-center mb-6 text-purple-600">
                            <Globe className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-gray-900">Decentralized Registry</h3>
                        <p className="text-gray-600 leading-relaxed">
                            Agents are registered on the Internet Computer, ensuring transparency, security, and verifiable identity.
                        </p>
                    </div>
                    <div className="p-8 rounded-2xl bg-white/40 backdrop-blur-md border border-white/50 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                        <div className="w-12 h-12 rounded-xl bg-pastel-peach flex items-center justify-center mb-6 text-orange-600">
                            <Shield className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-gray-900">Secure Execution</h3>
                        <p className="text-gray-600 leading-relaxed">
                            Standardized MCP protocol ensures safe and predictable interactions between the orchestrator and agents.
                        </p>
                    </div>
                </div>
            </section>

            {/* Featured Agents Preview */}
            <section className="max-w-6xl mx-auto px-4 w-full py-10">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Agents</h2>
                        <p className="text-gray-600">Powerful tools ready to be orchestrated.</p>
                    </div>
                    <Link to="/agents" className="text-indigo-600 font-medium hover:text-indigo-800 flex items-center gap-1">
                        View all <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Mock Cards for visual demo */}
                    {[
                        { name: "Web Search", icon: Search, color: "bg-blue-100 text-blue-600", desc: "Real-time internet search capabilities." },
                        { name: "Email Sender", icon: Mail, color: "bg-orange-100 text-orange-600", desc: "Compose and send emails via SMTP." },
                        { name: "Summarizer", icon: FileText, color: "bg-purple-100 text-purple-600", desc: "Condense long text into concise summaries." },
                    ].map((agent, i) => (
                        <div key={i} className="group p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/60 shadow-sm hover:shadow-md transition-all cursor-pointer">
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`p - 3 rounded - lg ${agent.color} group - hover: scale - 110 transition - transform`}>
                                    <agent.icon className="w-5 h-5" />
                                </div>
                                <h4 className="font-bold text-lg text-gray-800">{agent.name}</h4>
                            </div>
                            <p className="text-gray-600 text-sm">{agent.desc}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
