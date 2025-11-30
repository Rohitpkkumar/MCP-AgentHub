import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChatWindow } from '../components/ChatWindow';
import { PlanPreviewModal } from '../components/PlanPreviewModal';
import { executePlan, chatPlan, type Plan } from '../api/orchestrator';
import { getAllAgents } from '../api/agents';
import { useAuth } from '../contexts/AuthContext';

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export function Chat() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'assistant', content: 'Hello! I am the Orchestrator. How can I help you today?' }
    ]);
    const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch agents to resolve names in the plan
    const { data: agents = [] } = useQuery({
        queryKey: ['agents'],
        queryFn: getAllAgents
    });

    // Hardcoded manifest ID for now, or could be selected from UI
    const MANIFEST_ID = "orchestrator_v2";

    const handleSendMessage = async (content: string) => {
        const newMessage: Message = { id: Date.now().toString(), role: 'user', content };
        setMessages(prev => [...prev, newMessage]);
        setIsLoading(true);

        try {
            // Call orchestrator to discover agents and plan
            const plan = await chatPlan(content, user?.principal || 'anonymous', messages);

            // Store the prompt in the plan object for later execution
            const planWithPrompt = { ...plan, prompt: content };
            setCurrentPlan(planWithPrompt);
            setIsPreviewOpen(true);
        } catch (error) {
            console.error("Planning failed:", error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: 'Sorry, I encountered an error while trying to plan this task.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const formatExecutionResult = (result: any): string => {
        try {
            if (typeof result === 'string') return result;

            // Check for steps
            if (result.steps && Array.isArray(result.steps)) {
                let output = "";
                for (const step of result.steps) {
                    if (step.tool === 'answer_user') {
                        output += step.result?.answer || step.args?.answer || "No answer provided.";
                    } else if (step.tool === 'call_agent') {
                        const endpoint = step.args?.endpoint;
                        const agent = agents.find(a => a.endpoint === endpoint);
                        const agentName = agent ? agent.name : (endpoint || 'Unknown Agent');

                        const agentResult = step.result?.result || step.result?.text || step.result?.error || JSON.stringify(step.result);
                        const displayResult = agentResult === "null" ? "No response (Check agent health)" : agentResult;
                        output += `**${agentName}**: ${displayResult}\n`;
                    } else if (step.tool === 'no_agent_found') {
                        output += step.args?.message || "No suitable agent found.";
                    } else {
                        output += `Tool ${step.tool}: ${JSON.stringify(step.result || step.args)}\n`;
                    }
                }
                return output.trim();
            }

            return JSON.stringify(result, null, 2);
        } catch (e) {
            return "Error formatting result.";
        }
    };

    const handleApprovePlan = async () => {
        if (!currentPlan) return;
        setIsPreviewOpen(false);

        // Add a "Processing..." message
        const processingMsgId = Date.now().toString();
        setMessages(prev => [...prev, {
            id: processingMsgId,
            role: 'assistant',
            content: 'Plan approved. Executing...'
        }]);

        setIsLoading(true);
        try {
            const result = await executePlan(
                MANIFEST_ID,
                currentPlan.prompt || "", // Use the prompt from the current plan
                currentPlan,
                user?.principal || 'anonymous'
            );

            // Update the processing message with the result
            setMessages(prev => prev.map(msg =>
                msg.id === processingMsgId
                    ? { ...msg, content: formatExecutionResult(result) }
                    : msg
            ));
        } catch (err: any) {
            setMessages(prev => prev.map(msg =>
                msg.id === processingMsgId
                    ? { ...msg, content: `Execution failed: ${err.message || 'Unknown error'}` }
                    : msg
            ));
        } finally {
            setIsLoading(false);
            setCurrentPlan(null);
        }
    };

    return (
        <div className="container mx-auto max-w-4xl p-4 h-[calc(100vh-4rem)] flex flex-col">
            <div className="flex-1 overflow-hidden bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl shadow-lg flex flex-col">
                <ChatWindow
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    isLoading={isLoading}
                />
            </div>

            {isPreviewOpen && currentPlan && (
                <PlanPreviewModal
                    isOpen={isPreviewOpen}
                    onClose={() => setIsPreviewOpen(false)}
                    onApprove={handleApprovePlan}
                    plan={currentPlan}
                    agents={agents}
                />
            )}
        </div>
    );
}
