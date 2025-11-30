export interface Agent {
    id: string;
    name: string;
    description: string;
    imageUrl?: string;
    category: string;
    capabilities: string[];
    author: string;
    developer?: string;
    verified: boolean;
    endpoint?: string;
    created_at?: number;
    manifest_hash?: string;
    version?: string;
    health_check?: string;
}
