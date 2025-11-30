import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAgentById } from '../api/agents';
import type { Agent } from '../types/agent';
import { ArrowLeft, BadgeCheck, Box, Calendar, Code, Globe, Shield, User } from 'lucide-react';

export function AgentDetail() {
    const { id } = useParams<{ id: string }>();
    const [agent, setAgent] = useState<Agent | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (id) {
            fetchAgent(id);
        }
    }, [id]);

    const fetchAgent = async (agentId: string) => {
        setIsLoading(true);
        try {
            const data = await getAgentById(agentId);
            if (data) {
                setAgent(data);
            } else {
                setError('Agent not found');
            }
        } catch (err) {
            setError('Failed to load agent details');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    if (error || !agent) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center">
                <h2 className="text-2xl font-bold mb-4">Agent Not Found</h2>
                <p className="text-muted-foreground mb-6">{error || "The requested agent does not exist."}</p>
                <Link to="/agents" className="text-primary hover:underline flex items-center">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Agents
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-muted/10 py-10">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link to="/agents" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Agents
                </Link>

                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="p-8 border-b border-border bg-muted/30">
                        <div className="flex items-start gap-6">
                            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                {agent.imageUrl ? (
                                    <img src={agent.imageUrl} alt={agent.name} className="h-20 w-20 rounded-full object-cover" />
                                ) : (
                                    <User className="h-10 w-10" />
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-3xl font-bold text-foreground">{agent.name}</h1>
                                    {agent.verified && (
                                        <div className="text-blue-500" title="Verified Agent">
                                            <BadgeCheck className="h-6 w-6" />
                                        </div>
                                    )}
                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                                        {agent.category}
                                    </span>
                                </div>
                                <p className="text-lg text-muted-foreground mb-4">{agent.description}</p>

                                <div className="flex items-center gap-1.5" title="Developer Principal">
                                    <Code className="h-4 w-4" />
                                    <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">
                                        {agent.developer || agent.author}
                                    </span>
                                </div>
                                {agent.created_at && (
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="h-4 w-4" />
                                        <span>Added {new Date(agent.created_at * 1000).toLocaleDateString()}</span>
                                    </div>
                                )}
                                {agent.version && (
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs bg-muted px-1.5 py-0.5 rounded">v{agent.version}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-8">
                        <section>
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <Box className="h-5 w-5 text-primary" />
                                Capabilities
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {(agent.capabilities || []).length > 0 ? (
                                    (agent.capabilities || []).map((cap) => (
                                        <span
                                            key={cap}
                                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-secondary text-secondary-foreground border border-secondary-foreground/10"
                                        >
                                            {cap}
                                        </span>
                                    ))
                                ) : (
                                    <p className="text-muted-foreground italic">No specific capabilities listed.</p>
                                )}
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <Shield className="h-5 w-5 text-primary" />
                                Security & Verification
                            </h2>
                            <div className="bg-muted/30 rounded-lg p-4 border border-border space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Verification Status</span>
                                    <span className={`text-sm flex items-center gap-1.5 ${agent.verified ? 'text-green-600' : 'text-yellow-600'}`}>
                                        {agent.verified ? <BadgeCheck className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                                        {agent.verified ? 'Verified Developer' : 'Unverified'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Manifest Hash</span>
                                    <span className="text-xs font-mono text-muted-foreground truncate max-w-[200px]" title={agent.manifest_hash}>
                                        {agent.manifest_hash || 'Not available'}
                                    </span>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-muted/30 rounded-lg p-6 border border-border">
                            <h3 className="font-semibold mb-4">Connect</h3>
                            <Link
                                to="/chat"
                                className="w-full flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors mb-3"
                            >
                                Chat with Agent
                            </Link>
                            <button className="w-full flex items-center justify-center px-4 py-2 bg-background border border-input hover:bg-muted text-foreground rounded-md font-medium transition-colors">
                                View Documentation
                            </button>
                        </div>

                        <div className="bg-muted/30 rounded-lg p-6 border border-border">
                            <h3 className="font-semibold mb-4">Details</h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className="text-muted-foreground block mb-1">Endpoint</span>
                                    <div className="flex items-center gap-2 font-mono bg-background p-2 rounded border border-border text-xs break-all">
                                        <Globe className="h-3 w-3 flex-shrink-0" />
                                        {agent.endpoint || 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block mb-1">Agent ID</span>
                                    <span className="font-mono text-xs">{agent.id}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
