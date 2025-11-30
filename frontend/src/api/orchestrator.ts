import { fetchApi } from './client';

export interface PlanStep {
    tool: string;
    args: Record<string, any>;
    rationale?: string;
}

export interface Plan {
    steps: PlanStep[];
    _meta?: any;
    prompt?: string;
}

export interface ExecutionResult {
    ok: boolean;
    result?: any;
    error?: string;
    receipt?: string;
}

export async function generatePlan(manifestId: string, prompt: string): Promise<Plan> {
    return fetchApi('/plan', {
        method: 'POST',
        body: JSON.stringify({ manifest_id: manifestId, prompt }),
    });
}

export async function executePlan(
    manifestId: string,
    prompt: string,
    plan: Plan,
    userPrincipal: string
): Promise<ExecutionResult> {
    return fetchApi('/execute', {
        method: 'POST',
        body: JSON.stringify({
            manifest_id: manifestId,
            prompt,
            plan,
            user: userPrincipal
        }),
    });
}

export async function registerAgent(agentData: any): Promise<{ ok: boolean }> {
    return fetchApi('/register', {
        method: 'POST',
        body: JSON.stringify(agentData),
    });
}

export async function chatPlan(prompt: string, userPrincipal: string, messages: any[] = []): Promise<Plan> {
    return fetchApi('/chat/plan', {
        method: 'POST',
        body: JSON.stringify({ prompt, user: userPrincipal, messages }),
    });
}
