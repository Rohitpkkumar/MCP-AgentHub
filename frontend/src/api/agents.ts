import { fetchApi } from './client';
import type { Agent } from '../types/agent';

export async function getAllAgents(): Promise<Agent[]> {
    const data = await fetchApi('/agents');

    // Handle nested list response from backend [[{...}, {...}]]
    let rawAgents: any[] = [];
    if (Array.isArray(data)) {
        if (data.length > 0 && Array.isArray(data[0])) {
            rawAgents = data[0];
        } else {
            rawAgents = data;
        }
    }

    // Normalize agent data
    return rawAgents.map(normalizeAgent);
}

export async function getFeaturedAgents(): Promise<Agent[]> {
    const agents = await getAllAgents();
    return agents.slice(0, 4);
}

export async function getAgentById(id: string): Promise<Agent | undefined> {
    try {
        const data = await fetchApi(`/agents/${id}`);
        // Handle nested list response [[{...}]]
        let rawAgent = data;
        if (Array.isArray(data)) {
            if (data.length > 0 && Array.isArray(data[0])) {
                rawAgent = data[0][0];
            } else if (data.length > 0) {
                rawAgent = data[0];
            }
        }
        return normalizeAgent(rawAgent);
    } catch (error) {
        return undefined;
    }
}

function normalizeAgent(raw: any): Agent {
    // Helper to unwrap optional fields that might be lists (["value"]) or values
    const unwrap = (val: any) => {
        if (Array.isArray(val)) {
            return val.length > 0 ? val[0] : undefined;
        }
        return val;
    };

    // Helper to flatten allowed_tools which might be [["tool1", "tool2"]]
    const normalizeTools = (val: any): string[] => {
        if (!Array.isArray(val)) return [];
        if (val.length > 0 && Array.isArray(val[0])) {
            return val[0];
        }
        return val;
    };

    return {
        id: raw.id,
        name: raw.name || 'Unnamed Agent',
        description: raw.description || '',
        imageUrl: raw.imageUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${raw.id}`, // Generate avatar if missing
        category: raw.category || 'General',
        capabilities: normalizeTools(raw.allowed_tools),
        author: raw.author || 'Unknown',
        developer: raw.developer, // Keep as is (Principal string)
        verified: raw.verified || false,
        endpoint: unwrap(raw.endpoint),
        created_at: raw.created_at,
        manifest_hash: unwrap(raw.manifest_hash),
        version: raw.version,
        health_check: unwrap(raw.health_check),
    };
}
