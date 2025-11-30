import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';

export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface ChatWindowProps {
    messages: Message[];
    onSendMessage: (content: string) => void;
    isLoading?: boolean;
}

export function ChatWindow({ onSendMessage, messages, isLoading }: ChatWindowProps) {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        onSendMessage(input);
        setInput('');
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] bg-background border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                        <Bot className="h-12 w-12 mb-4 opacity-50" />
                        <h3 className="text-lg font-medium mb-2">Start a new conversation</h3>
                        <p className="max-w-sm">
                            Ask me to help you with coding, data analysis, or any other task. I'll coordinate with specialized agents to get it done.
                        </p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex w-full",
                                msg.role === 'user' ? "justify-end" : "justify-start"
                            )}
                        >
                            <div
                                className={cn(
                                    "flex max-w-[80%] rounded-lg px-4 py-3 text-sm",
                                    msg.role === 'user'
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-foreground"
                                )}
                            >
                                {msg.role === 'assistant' && <Bot className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />}
                                <div className="whitespace-pre-wrap">{msg.content}</div>
                                {msg.role === 'user' && <User className="h-5 w-5 ml-2 flex-shrink-0 mt-0.5" />}
                            </div>
                        </div>
                    ))
                )}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-muted text-foreground rounded-lg px-4 py-3 text-sm flex items-center">
                            <Bot className="h-5 w-5 mr-2 flex-shrink-0" />
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Thinking...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-border bg-card">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="bg-primary text-primary-foreground p-2 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </button>
                </form>
            </div>
        </div>
    );
}
