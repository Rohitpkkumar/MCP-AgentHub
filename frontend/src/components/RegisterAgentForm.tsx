import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { registerAgent } from '../api/orchestrator';
import { useAuth } from '../contexts/AuthContext';

interface RegisterAgentFormData {
    id: string;
    name: string;
    description: string;
    endpoint: string;
    category: string;
}

export function RegisterAgentForm() {
    const { register, handleSubmit, formState: { errors }, reset } = useForm<RegisterAgentFormData>();
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const { user } = useAuth();

    const onSubmit = async (data: RegisterAgentFormData) => {
        setIsLoading(true);
        setStatus('idle');
        setErrorMessage('');

        try {
            await registerAgent({
                ...data,
                developer: user?.principal || 'anonymous',
                allowed_tools: [], // Default to empty for now
                version: "0.1.0"
            });
            setStatus('success');
            reset();
        } catch (error: any) {
            setStatus('error');
            setErrorMessage(error.message || 'Failed to register agent');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm max-w-2xl">
            <h2 className="text-2xl font-bold mb-6">Register New Agent</h2>

            {status === 'success' && (
                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-md flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <span>Agent registered successfully!</span>
                </div>
            )}

            {status === 'error' && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-md flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertCircle className="h-5 w-5" />
                    <span>{errorMessage}</span>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="id" className="text-sm font-medium">Agent ID</label>
                        <input
                            id="id"
                            {...register('id', { required: 'Agent ID is required' })}
                            className="w-full px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="e.g., my-agent-1"
                        />
                        {errors.id && <p className="text-sm text-red-500">{errors.id.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium">Display Name</label>
                        <input
                            id="name"
                            {...register('name', { required: 'Name is required' })}
                            className="w-full px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="e.g., My Super Agent"
                        />
                        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium">Description</label>
                    <textarea
                        id="description"
                        {...register('description', { required: 'Description is required' })}
                        className="w-full px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                        placeholder="Describe what your agent does..."
                    />
                    {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
                </div>

                <div className="space-y-2">
                    <label htmlFor="endpoint" className="text-sm font-medium">Endpoint URL</label>
                    <input
                        id="endpoint"
                        {...register('endpoint', {
                            required: 'Endpoint URL is required',
                            pattern: {
                                value: /^https?:\/\/.+/,
                                message: 'Must be a valid URL starting with http:// or https://'
                            }
                        })}
                        className="w-full px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="http://localhost:7001"
                    />
                    {errors.endpoint && <p className="text-sm text-red-500">{errors.endpoint.message}</p>}
                </div>

                <div className="space-y-2">
                    <label htmlFor="category" className="text-sm font-medium">Category</label>
                    <select
                        id="category"
                        {...register('category', { required: 'Category is required' })}
                        className="w-full px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="">Select a category</option>
                        <option value="Development">Development</option>
                        <option value="Productivity">Productivity</option>
                        <option value="Data">Data</option>
                        <option value="Utilities">Utilities</option>
                    </select>
                    {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-2 px-4 rounded-md font-medium transition-colors flex items-center justify-center"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Registering...
                        </>
                    ) : (
                        'Register Agent'
                    )}
                </button>
            </form>
        </div>
    );
}
