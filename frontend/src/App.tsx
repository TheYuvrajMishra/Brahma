import { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './App.css';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

interface Session {
    sessionId: string;
    title: string;
    updatedAt: string;
}

export default function App() {
    const [socket, setSocket] = useState<any>(null);
    const [connected, setConnected] = useState(false);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // ── Socket Setup ──────────────────────────────────────────────────
    useEffect(() => {
        const newSocket = io('http://127.0.0.1:3005');
        setSocket(newSocket);

        newSocket.on('connect', () => { setConnected(true); });
        newSocket.on('disconnect', () => { setConnected(false); });
        newSocket.on('connect_error', (err: any) => { console.error('Socket error:', err); });

        newSocket.on('typing', (state: boolean) => { setIsTyping(state); });

        newSocket.on('chat response', (msg: string) => {
            setMessages(prev => [...prev, { role: 'assistant', content: msg, timestamp: new Date().toISOString() }]);
        });

        newSocket.on('session:updated', (data: { sessionId: string; title: string }) => {
            setSessions(prev => prev.map(s => s.sessionId === data.sessionId ? { ...s, title: data.title } : s));
        });

        return () => { newSocket.disconnect(); };
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
                // Auto-select the most recent session if none is active
                setActiveSessionId(prev => {
                    const exists = data.sessions.find((s: Session) => s.sessionId === prev);
                    if (exists) return prev;
                    return data.sessions[0].sessionId;
                });
            } else {
                // No sessions exist — create one
                createNewSession();
            }
        });
    }, [socket]);

    // ── Load messages when active session changes ─────────────────────
    useEffect(() => {
        if (!socket || !activeSessionId) return;
        socket.emit('session:load', activeSessionId, (data: any) => {
            if (data.success) {
                setMessages(data.messages || []);
            } else {
                setMessages([]);
            }
        });
        inputRef.current?.focus();
    }, [socket, activeSessionId]);

    // ── Auto-scroll ───────────────────────────────────────────────────
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    // ── Session Actions ───────────────────────────────────────────────
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
                setMessages([]);
            }
        });
    }, [socket]);

    const deleteSession = useCallback((sessionId: string) => {
        if (!socket) return;
        socket.emit('session:delete', sessionId, (data: any) => {
            if (data.success) {
                setSessions(prev => {
                    const remaining = prev.filter(s => s.sessionId !== sessionId);
                    // If we deleted the active session, switch to next or create new
                    if (activeSessionId === sessionId) {
                        if (remaining.length > 0) {
                            setActiveSessionId(remaining[0].sessionId);
                        } else {
                            // Create a new session since we deleted the last one
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
        if (sessionId === activeSessionId) return;
        setActiveSessionId(sessionId);
        setIsTyping(false);
    }, [activeSessionId]);

    // ── Send Message ──────────────────────────────────────────────────
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const text = inputValue.trim();
        if (!text || !socket || !activeSessionId) return;

        setMessages(prev => [...prev, { role: 'user', content: text, timestamp: new Date().toISOString() }]);
        socket.emit('chat message', { text, sessionId: activeSessionId });
        setInputValue('');
    };

    // ── Time formatter ────────────────────────────────────────────────
    const formatTime = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    };

    // ── Render ────────────────────────────────────────────────────────
    return (
        <div className="app-container" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            
            {/* Sidebar */}
            <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
                {/* Sidebar Header */}
                <div className="sidebar-header">
                    <h2 className="sidebar-title">Sessions</h2>
                    <button onClick={() => setSidebarOpen(false)} className="sidebar-close-btn" title="Close sidebar">✕</button>
                </div>

                {/* New Chat Button */}
                <button onClick={createNewSession} className="new-chat-btn">
                    + New Chat
                </button>

                {/* Session List */}
                <div className="session-list">
                    {sessions.map(session => (
                        <div
                            key={session.sessionId}
                            className={`session-item ${session.sessionId === activeSessionId ? 'session-active' : ''}`}
                            onClick={() => switchSession(session.sessionId)}
                        >
                            <div className="session-info">
                                <p className="session-title">{session.title}</p>
                                <p className="session-time">{formatTime(session.updatedAt)}</p>
                            </div>
                            {deleteConfirm === session.sessionId ? (
                                <div className="delete-confirm">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteSession(session.sessionId); }}
                                        className="delete-yes"
                                    >✓</button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm(null); }}
                                        className="delete-no"
                                    >✕</button>
                                </div>
                            ) : (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(session.sessionId); }}
                                    className="delete-btn"
                                    title="Delete session"
                                >🗑</button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="main-area">
                {/* Header */}
                <div className="chat-header">
                    {!sidebarOpen && (
                        <button onClick={() => setSidebarOpen(true)} className="menu-btn" title="Open sidebar">☰</button>
                    )}
                    <h1 className="header-title">Brahma Playground</h1>
                    <div className="connection-status">
                        <div className={`status-dot ${connected ? 'status-online' : 'status-offline'}`}></div>
                        <span className="status-text">{connected ? 'Connected' : 'Disconnected'}</span>
                    </div>
                </div>

                {/* Chat Container */}
                <div className="chat-container">
                    {/* Messages */}
                    <div className="messages-area">
                        {messages.length === 0 && (
                            <div className="empty-state">
                                <p className="empty-title">Start a conversation</p>
                                <p className="empty-subtitle">Type a message below to begin.</p>
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <div key={i} className={`message-row ${msg.role === 'user' ? 'message-user' : 'message-assistant'}`}>
                                <div className={`message-bubble ${msg.role === 'user' ? 'bubble-user' : 'bubble-assistant'}`}>
                                    <p className="message-sender">{msg.role === 'user' ? 'You' : 'Brahma Core'}</p>
                                    <div className="message-content prose prose-sm max-w-none">
                                        {msg.role === 'assistant' ? (
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                        ) : (
                                            <p className="whitespace-pre-wrap">{msg.content}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {isTyping && (
                            <div className="message-row message-assistant">
                                <div className="typing-indicator">
                                    <span className="typing-dot"></span>
                                    <span className="typing-dot"></span>
                                    <span className="typing-dot"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="input-area">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="chat-input"
                            placeholder="Enter your command..."
                            autoComplete="off"
                        />
                        <button type="submit" className="send-btn">
                            Send
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
