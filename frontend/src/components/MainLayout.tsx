import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import type { Session } from '../types';
import { Sidebar } from './Sidebar';

export interface LayoutContextType {
    socket: any;
    connected: boolean;
    sessions: Session[];
    activeSessionId: string | null;
    setActiveSessionId: React.SetStateAction<any>;
    createNewSession: () => void;
    deleteSession: (id: string) => void;
    switchSession: (id: string) => void;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

export const MainLayout: React.FC = () => {
    const [socket, setSocket] = useState<any>(null);
    const [connected, setConnected] = useState(false);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [googleConnected, setGoogleConnected] = useState(false);
    const [googleEmail, setGoogleEmail] = useState('');

    const location = useLocation();
    const navigate = useNavigate();

    // Determine active nav item from path
    const activePage = location.pathname.includes('/context') 
        ? 'context' 
        : location.pathname.includes('/logs') 
            ? 'logs' 
            : 'playground';

    // ── Socket Setup ──────────────────────────────────────────────────
    useEffect(() => {
        const newSocket = io('http://127.0.0.1:3005');
        setSocket(newSocket);

        newSocket.on('connect', () => { 
            setConnected(true); 
            // Query google status
            newSocket.emit('google:status', (res: any) => {
                if (res) {
                    setGoogleConnected(!!res.connected);
                    setGoogleEmail(res.email || '');
                }
            });
        });
        newSocket.on('disconnect', () => { setConnected(false); });
        newSocket.on('connect_error', (err: any) => { console.error('Socket error:', err); });

        newSocket.on('google:connected', (data: { connected: boolean; email?: string }) => {
            setGoogleConnected(data.connected);
            if (data.email) setGoogleEmail(data.email);
        });

        newSocket.on('session:updated', (data: { sessionId: string; title: string }) => {
            setSessions(prev => prev.map(s => s.sessionId === data.sessionId ? { ...s, title: data.title } : s));
        });

        // Listen for postMessage from OAuth popup window
        const handlePostMessage = (event: MessageEvent) => {
            if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
                if (event.data.success) {
                    setGoogleConnected(true);
                    if (event.data.email) setGoogleEmail(event.data.email);
                } else {
                    alert(`Google Connection Failed: ${event.data.error || 'Unknown error'}`);
                }
            }
        };
        window.addEventListener('message', handlePostMessage);

        return () => { 
            newSocket.disconnect(); 
            window.removeEventListener('message', handlePostMessage);
        };
    }, []);

    const connectGoogle = useCallback(async () => {
        try {
            const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                ? 'http://localhost:3005' 
                : '';
            const res = await fetch(`${baseUrl}/api/auth/google/url`);
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

    // ── Load sessions on connect ──────────────────────────────────────
    useEffect(() => {
        if (!socket || !connected) return;
        loadSessions();
    }, [socket, connected]);

    const loadSessions = useCallback(() => {
        if (!socket) return;
        socket.emit('session:list', (data: any) => {
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
    }, [socket]);

    const createNewSession = useCallback(() => {
        if (!socket) return;
        socket.emit('session:create', (data: any) => {
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

    const deleteSession = useCallback((sessionId: string) => {
        if (!socket) return;
        socket.emit('session:delete', sessionId, (data: any) => {
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
                onConnectGoogle={connectGoogle}
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
                    setSidebarOpen
                }} />
            </div>
        </div>
    );
};
