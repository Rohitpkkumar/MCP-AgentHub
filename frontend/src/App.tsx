import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Agents } from './pages/Agents';
import { AgentDetail } from './pages/AgentDetail';

import { AuthProvider } from './contexts/AuthContext';
import { Dashboard } from './pages/Dashboard';
import { Chat } from './pages/Chat';
import { Docs } from './pages/Docs';


const queryClient = new QueryClient();

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <Router>
                    <Layout>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/agents" element={<Agents />} />
                            <Route path="/agents/:id" element={<AgentDetail />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/chat" element={<Chat />} />
                            <Route path="/docs" element={<Docs />} />

                        </Routes>
                    </Layout>
                </Router>
            </AuthProvider>
        </QueryClientProvider>
    );
}

export default App;
