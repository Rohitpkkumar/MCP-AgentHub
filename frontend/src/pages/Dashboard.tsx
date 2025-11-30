import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Plus, Settings, Activity, Box, Loader2 } from 'lucide-react';
import { RegisterAgentForm } from '../components/RegisterAgentForm';
import { getAllAgents } from '../api/agents';
import { AgentCard } from '../components/AgentCard';
import type { Agent } from '../types/agent';

export function Dashboard() {
    const { user, isLoading } = useAuth();
    const [activeTab, setActiveTab] = useState('agents');
    const [showRegisterForm, setShowRegisterForm] = useState(false);
    const [myAgents, setMyAgents] = useState<Agent[]>([]);
    const [isLoadingAgents, setIsLoadingAgents] = useState(false);

    useEffect(() => {
        if (user && activeTab === 'agents' && !showRegisterForm) {
            fetchMyAgents();
        }
    }, [user, activeTab, showRegisterForm]);

    const fetchMyAgents = async () => {
        setIsLoadingAgents(true);
        try {
            const allAgents = await getAllAgents();
            // Filter agents where developer matches user principal
            const userAgents = allAgents.filter(agent => agent.developer === user?.principal);
            setMyAgents(userAgents);
        } catch (error) {
            console.error("Failed to fetch agents:", error);
        } finally {
            setIsLoadingAgents(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-muted/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Developer Dashboard</h1>
                        <p className="text-muted-foreground mt-1">Manage your agents and monitor their performance.</p>
                    </div>
                    {!showRegisterForm && (
                        <button
                            onClick={() => { setActiveTab('agents'); setShowRegisterForm(true); }}
                            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Register New Agent
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Sidebar */}
                    <div className="space-y-1">
                        <button
                            onClick={() => { setActiveTab('agents'); setShowRegisterForm(false); }}
                            className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'agents' && !showRegisterForm
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                        >
                            <Box className="h-4 w-4 mr-3" />
                            My Agents
                        </button>
                        <button
                            onClick={() => { setActiveTab('analytics'); setShowRegisterForm(false); }}
                            className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'analytics'
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                        >
                            <Activity className="h-4 w-4 mr-3" />
                            Analytics
                        </button>
                        <button
                            onClick={() => { setActiveTab('settings'); setShowRegisterForm(false); }}
                            className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'settings'
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                        >
                            <Settings className="h-4 w-4 mr-3" />
                            Settings
                        </button>
                    </div>

                    {/* Content */}
                    <div className="md:col-span-3">
                        {showRegisterForm ? (
                            <RegisterAgentForm />
                        ) : (
                            <div className="bg-card border border-border rounded-xl p-6 shadow-sm min-h-[400px]">
                                {activeTab === 'agents' && (
                                    <div>
                                        <h2 className="text-xl font-semibold mb-6">My Agents</h2>

                                        {isLoadingAgents ? (
                                            <div className="flex justify-center py-12">
                                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                            </div>
                                        ) : myAgents.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {myAgents.map(agent => (
                                                    <div key={agent.id} className="h-full">
                                                        <AgentCard agent={agent} />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 border-2 border-dashed border-muted rounded-lg">
                                                <Box className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                                <h3 className="text-lg font-medium text-foreground">No agents registered</h3>
                                                <p className="text-muted-foreground mt-1 mb-4">Get started by registering your first agent.</p>
                                                <button
                                                    onClick={() => setShowRegisterForm(true)}
                                                    className="text-primary font-medium hover:underline"
                                                >
                                                    Register Agent
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {activeTab === 'analytics' && (
                                    <div>
                                        <h2 className="text-xl font-semibold mb-4">Analytics</h2>
                                        <p className="text-muted-foreground">Analytics dashboard coming soon.</p>
                                    </div>
                                )}
                                {activeTab === 'settings' && (
                                    <div>
                                        <h2 className="text-xl font-semibold mb-4">Settings</h2>
                                        <p className="text-muted-foreground">Account settings coming soon.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
