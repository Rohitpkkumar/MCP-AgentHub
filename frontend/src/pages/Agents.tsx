import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllAgents } from '../api/agents';
import { AgentCard } from '../components/AgentCard';
import { Loader2, Search, Filter } from 'lucide-react';
import type { Agent } from '../types/agent';

export function Agents() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const { data: agents, isLoading } = useQuery({
        queryKey: ['agents'],
        queryFn: getAllAgents,
    });

    const categories = agents
        ? Array.from(new Set(agents.map((a: Agent) => a.category)))
        : [];

    const filteredAgents = agents?.filter((agent: Agent) => {
        const matchesSearch = (agent.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (agent.description || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory ? agent.category === selectedCategory : true;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-muted/10 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Agents Directory</h1>
                        <p className="mt-2 text-muted-foreground">
                            Explore and deploy intelligent agents for your tasks.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search agents..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 w-full sm:w-64 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <select
                                value={selectedCategory || ''}
                                onChange={(e) => setSelectedCategory(e.target.value || null)}
                                className="pl-9 pr-8 py-2 w-full sm:w-48 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                            >
                                <option value="">All Categories</option>
                                {categories.map((category) => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-24">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <>
                        {filteredAgents && filteredAgents.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredAgents.map((agent: Agent) => (
                                    <AgentCard key={agent.id} agent={agent} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-24">
                                <p className="text-lg text-muted-foreground">No agents found matching your criteria.</p>
                                <button
                                    onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}
                                    className="mt-4 text-primary hover:underline"
                                >
                                    Clear filters
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
