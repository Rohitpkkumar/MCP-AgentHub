import type { Agent } from '../types/agent';
import { BadgeCheck, User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AgentCardProps {
    agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
    return (
        <div className="flex flex-col bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-1 h-full">
            <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User className="h-6 w-6" />
                    </div>
                    {agent.verified && (
                        <div className="text-blue-500" title="Verified Agent">
                            <BadgeCheck className="h-5 w-5" />
                        </div>
                    )}
                </div>

                <h3 className="text-lg font-semibold mb-2 line-clamp-1">{agent.name}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
                    {agent.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                    {(agent.capabilities || []).slice(0, 2).map((cap) => (
                        <span
                            key={cap}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground"
                        >
                            {cap}
                        </span>
                    ))}
                    {(agent.capabilities || []).length > 2 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                            +{(agent.capabilities || []).length - 2}
                        </span>
                    )}
                </div>
            </div>

            <div className="px-6 py-4 bg-muted/30 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground" title={agent.developer || agent.author}>
                    by {agent.developer ? (agent.developer.slice(0, 10) + '...') : agent.author}
                </span>
                <Link
                    to={`/agents/${agent.id}`}
                    className="text-sm font-medium text-primary hover:underline"
                >
                    View Details
                </Link>
            </div>
        </div>
    );
}
