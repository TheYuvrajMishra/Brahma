import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';
import type { Session, UserProfile } from '../types';
import { Sidebar } from './Sidebar';
import { AuthScreen } from '../pages/AuthScreen';
import { OnboardingPage } from '../pages/OnboardingPage';

export interface LayoutContextType {
    socket: Socket | null;
    connected: boolean;
    sessions: Session[];
    activeSessionId: string | null;
    setActiveSessionId: React.Dispatch<React.SetStateAction<string | null>>;
    createNewSession: () => void;
    deleteSession: (id: string) => void;
    switchSession: (id: string) => void;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    user: UserProfile | null;
}

export const MainLayout: React.FC = () => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [authLoading, setAuthLoading] = useState(true);

    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [googleConnected, setGoogleConnected] = useState(false);
    const [googleEmail, setGoogleEmail] = useState('');

    const location = useLocation();
    const navigate = useNavigate();

    const activePage = location.pathname.includes('/context') 
        ? 'context' 
        : location.pathname.includes('/logs') 
            ? 'logs' 
            : 'playground';

    // ── Check Auth Status ──────────────────────────────────────────────
    const checkAuthStatus = useCallback(async () => {
        setAuthLoading(true);
        try {
            const res = await fetch('/api/auth/me');
            const data = await res.json();
            if (data.authenticated && data.user) {
                setUser(data.user);
                setGoogleConnected(true);
                setGoogleEmail(data.user.email);
            } else {
                setUser(null);
                setGoogleConnected(false);
                setGoogleEmail('');
            }
        } catch (err) {
            console.error('Auth status check failed:', err);
            setUser(null);
        } finally {
            setAuthLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuthStatus();
    }, [checkAuthStatus]);

    // ── Socket Setup ──────────────────────────────────────────────────
    useEffect(() => {
        if (!user || !user.onboardingCompleted) return;

        const newSocket = io({ withCredentials: true });
        setSocket(newSocket);

        newSocket.on('connect', () => { 
            setConnected(true); 
            newSocket.emit('google:status', (res: { connected?: boolean; email?: string }) => {
                if (res) {
                    setGoogleConnected(!!res.connected);
                    setGoogleEmail(res.email || user.email);
                }
            });
        });
        newSocket.on('disconnect', () => { setConnected(false); });
        newSocket.on('connect_error', (err: Error) => { console.error('Socket error:', err); });

        newSocket.on('google:connected', (data: { connected: boolean; email?: string }) => {
            setGoogleConnected(data.connected);
            if (data.email) setGoogleEmail(data.email);
        });

        newSocket.on('session:updated', (data: { sessionId: string; title: string }) => {
            setSessions(prev => prev.map(s => s.sessionId === data.sessionId ? { ...s, title: data.title } : s));
        });

        const handlePostMessage = (event: MessageEvent) => {
            if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
                if (event.data.success) {
                    checkAuthStatus();
                }
            }
        };
        window.addEventListener('message', handlePostMessage);

        return () => { 
            newSocket.disconnect(); 
            window.removeEventListener('message', handlePostMessage);
        };
    }, [user, checkAuthStatus]);

    const connectGoogle = useCallback(async () => {
        try {
            const res = await fetch('/api/auth/google/url');
            const data = await res.json();
            if (data.url) {
                const width = 600;
                const height = 700;
                const left = window.screen.width / 2 - width / 2;
                const top = window.screen.height / 2 - height / 2;
                window.open(data.url, 'Google OAuth', `width=${width},height=${height},top=${top},left=${left}`);
            } else {
                alert('Google OAuth client ID is not configured on backend.');
            }
        } catch (err) {
            console.error('Failed to get Google Auth URL:', err);
            alert('Could not initialize Google Connection. Ensure backend is running.');
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (e) {
            console.error('Logout error:', e);
        }
        setUser(null);
        setGoogleConnected(false);
        setGoogleEmail('');
        if (socket) socket.disconnect();
    }, [socket]);

    const resetAccount = useCallback(async () => {
        try {
            const res = await fetch('/api/auth/reset-account', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                if (socket) socket.disconnect();
                setSessions([]);
                setActiveSessionId(null);
                checkAuthStatus();
            } else {
                alert(`Reset failed: ${data.error}`);
            }
        } catch (err) {
            console.error('Reset account error:', err);
            alert('Reset request failed. Ensure backend is running.');
        }
    }, [socket, checkAuthStatus]);

    const createNewSession = useCallback(() => {
        if (!socket) return;
        socket.emit('session:create', (data: { success?: boolean; sessionId: string; title?: string }) => {
            if (data.success) {
                const newSession: Session = {
                    sessionId: data.sessionId,
                    title: data.title || 'New Chat',
                    updatedAt: new Date().toISOString(),
                };
                setSessions(prev => [newSession, ...prev]);
                setActiveSessionId(data.sessionId);
                navigate('/playground');
            }
        });
    }, [socket, navigate]);

    const loadSessions = useCallback(() => {
        if (!socket) return;
        socket.emit('session:list', (data: { success?: boolean; sessions: Session[] }) => {
            if (data.success && data.sessions.length > 0) {
                setSessions(data.sessions);
                setActiveSessionId(prev => {
                    const exists = data.sessions.find((s: Session) => s.sessionId === prev);
                    if (exists) return prev;
                    return data.sessions[0].sessionId;
                });
            } else {
                createNewSession();
            }
        });
    }, [socket, createNewSession]);

    useEffect(() => {
        if (!socket || !connected) return;
        loadSessions();
    }, [socket, connected, loadSessions]);

    const deleteSession = useCallback((sessionId: string) => {
        if (!socket) return;
        socket.emit('session:delete', sessionId, (data: { success?: boolean }) => {
            if (data.success) {
                setSessions(prev => {
                    const remaining = prev.filter(s => s.sessionId !== sessionId);
                    if (activeSessionId === sessionId) {
                        if (remaining.length > 0) {
                            setActiveSessionId(remaining[0].sessionId);
                        } else {
                            setTimeout(() => createNewSession(), 100);
                        }
                    }
                    return remaining;
                });
                setDeleteConfirm(null);
            }
        });
    }, [socket, activeSessionId, createNewSession]);

    const switchSession = useCallback((sessionId: string) => {
        setActiveSessionId(sessionId);
        navigate('/playground');
    }, [navigate]);

    if (authLoading) {
        return (
            <div className="min-h-screen w-full bg-[#09090b] text-white flex items-center justify-center font-sans">
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-emerald-400 rounded-full animate-spin" />
                    <span className="text-xs font-mono tracking-widest text-zinc-400">LOADING BRAHMA...</span>
                </div>
            </div>
        );
    }

    if (!user) {
        return <AuthScreen onLoginSuccess={checkAuthStatus} />;
    }

    if (!user.onboardingCompleted) {
        return <OnboardingPage user={user} onOnboardingComplete={checkAuthStatus} />;
    }

    return (
        <div className="app-container">
            {/* SVG Noise Filter */}
            <svg style={{ position: 'absolute', width: 0, height: 0 }} xmlns="http://www.w3.org/2000/svg">
                <filter id="noiseFilter">
                    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/>
                </filter>
            </svg>
            <div className="noise-overlay"></div>

            <Sidebar 
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                sessions={sessions}
                activeSessionId={activeSessionId}
                deleteConfirm={deleteConfirm}
                setDeleteConfirm={setDeleteConfirm}
                createNewSession={createNewSession}
                switchSession={switchSession}
                deleteSession={deleteSession}
                activePage={activePage}
                googleConnected={googleConnected}
                googleEmail={googleEmail}
                user={user}
                onConnectGoogle={connectGoogle}
                onLogout={logout}
                onResetAccount={resetAccount}
            />

            <div className="main-island">
                <Outlet context={{
                    socket,
                    connected,
                    sessions,
                    activeSessionId,
                    setActiveSessionId,
                    createNewSession,
                    deleteSession,
                    switchSession,
                    sidebarOpen,
                    setSidebarOpen,
                    user
                }} />
            </div>
        </div>
    );
};
