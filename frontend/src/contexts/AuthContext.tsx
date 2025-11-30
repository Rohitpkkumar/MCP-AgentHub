import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import type { Identity } from '@dfinity/agent';

interface User {
    principal: string;
    isAuthenticated: boolean;
}

interface AuthContextType {
    user: User | null;
    identity: Identity | null;
    login: () => Promise<void>;
    logout: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [authClient, setAuthClient] = useState<AuthClient | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [identity, setIdentity] = useState<Identity | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        AuthClient.create().then(async (client) => {
            setAuthClient(client);
            const isAuthenticated = await client.isAuthenticated();
            if (isAuthenticated) {
                const identity = client.getIdentity();
                setIdentity(identity);
                setUser({
                    principal: identity.getPrincipal().toText(),
                    isAuthenticated: true,
                });
            }
            setIsLoading(false);
        }).catch((err) => {
            console.error("AuthClient init error:", err);
            setIsLoading(false);
        });
    }, []);

    const login = async () => {
        if (!authClient) return;

        await authClient.login({
            identityProvider: import.meta.env.VITE_II_URL || 'https://identity.ic0.app',
            onSuccess: () => {
                const identity = authClient.getIdentity();
                setIdentity(identity);
                setUser({
                    principal: identity.getPrincipal().toText(),
                    isAuthenticated: true,
                });
            },
        });
    };

    const logout = async () => {
        if (!authClient) return;
        await authClient.logout();
        setUser(null);
        setIdentity(null);
    };

    return (
        <AuthContext.Provider value={{ user, identity, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
