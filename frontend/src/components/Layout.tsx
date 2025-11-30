import React from 'react';
import { Navbar } from './Navbar';

interface LayoutProps {
    children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
    return (
        <div className="min-h-screen flex flex-col relative overflow-x-hidden">
            {/* Navbar with glass effect */}
            <div className="sticky top-0 z-50 w-full border-b border-white/20 bg-white/60 backdrop-blur-xl supports-[backdrop-filter]:bg-white/40">
                <Navbar />
            </div>

            <main className="flex-1 w-full relative z-10">
                {children}
            </main>

            {/* Footer */}
            <div className="mt-8 pt-8 border-t border-white/20 text-center text-sm text-gray-500">
                &copy; {new Date().getFullYear()} Nexus. Decentralized Agent Orchestration.
            </div>
        </div>
    );
}
