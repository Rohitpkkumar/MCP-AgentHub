import { useState } from 'react';
import { AlertCircle, X, ChevronDown, ChevronUp, Bot, MessageSquare } from 'lucide-react';
import type { Plan } from '../api/orchestrator';
import type { Agent } from '../types/agent';

interface PlanPreviewModalProps {
    plan: Plan;
    isOpen: boolean;
    onClose: () => void;
    onApprove: () => void;
    agents?: Agent[];
}

export function PlanPreviewModal({ plan, isOpen, onClose, onApprove, agents = [] }: PlanPreviewModalProps) {
    const [expandedSteps, setExpandedSteps] = useState<number[]>([]);

    if (!isOpen) return null;

    const toggleStep = (index: number) => {
        setExpandedSteps(prev =>
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    const getStepInfo = (step: any) => {
        if (step.tool === 'call_agent') {
            const endpoint = step.args?.endpoint;
            const agent = agents.find(a => a.endpoint === endpoint);
            const agentName = agent ? agent.name : (endpoint || 'Unknown Agent');
            const prompt = step.args?.payload?.prompt || JSON.stringify(step.args);

            return {
                title: `Ask ${agentName}`,
                description: `Sending prompt: "${prompt}"`,
                icon: <Bot className="w-5 h-5 text-indigo-600" />,
                isAgent: true
            };
        } else if (step.tool === 'answer_user') {
            return {
                title: 'Final Answer',
                description: 'The orchestrator will provide the final response to you.',
                icon: <MessageSquare className="w-5 h-5 text-green-600" />,
                isAgent: false
            };
        }
        return {
            title: `Execute Tool: ${step.tool}`,
            description: step.rationale || JSON.stringify(step.args),
            icon: <div className="w-5 h-5 rounded-full bg-gray-200" />,
            isAgent: false
        };
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-background border border-border rounded-xl shadow-lg max-w-2xl w-full max-h-[80vh] flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-border flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">Review Execution Plan</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Nexus has generated a plan to fulfill your request.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="space-y-4">
                        {plan.steps.map((step, index) => {
                            const info = getStepInfo(step);
                            const isExpanded = expandedSteps.includes(index);

                            return (
                                <div
                                    key={index}
                                    className="rounded-lg bg-white border border-gray-200 shadow-sm overflow-hidden"
                                >
                                    <div className="flex items-center gap-4 p-4 bg-gray-50/50">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center font-medium text-sm text-gray-500 shadow-sm">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                {info.icon}
                                                <h3 className="font-semibold text-gray-900 truncate">
                                                    {info.title}
                                                </h3>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1 truncate">
                                                {info.description}
                                            </p>
                                        </div>
                                        {info.isAgent && (
                                            <button
                                                onClick={() => toggleStep(index)}
                                                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                                            >
                                                {isExpanded ? 'Hide Details' : 'View Details'}
                                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                            </button>
                                        )}
                                    </div>

                                    {isExpanded && (
                                        <div className="p-4 border-t border-gray-200 bg-gray-50">
                                            <div className="text-xs font-mono text-gray-600 bg-white p-3 rounded border border-gray-200 overflow-x-auto">
                                                <div className="font-bold text-gray-800 mb-1">Technical Details:</div>
                                                <pre>{JSON.stringify(step.args, null, 2)}</pre>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-100 text-blue-700">
                        <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium">Ready to proceed?</p>
                            <p className="mt-1 opacity-90">
                                Approving this plan will execute the steps above in sequence.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onApprove}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm"
                        >
                            Approve Plan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
