import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import type { Message, Session } from '../types';
import { Sidebar } from '../components/Sidebar';
import { ChatArea } from '../components/ChatArea';
import '../App.css';

export const PlaygroundPage: React.FC = () => {
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
            setMessages(prev => [...prev, { role: 'assistant', content: msg, timestamp: new Date().toISOString(), isNew: true }]);
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
            />
            <ChatArea 
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                connected={connected}
                messages={messages}
                isTyping={isTyping}
                inputValue={inputValue}
                setInputValue={setInputValue}
                handleSubmit={handleSubmit}
                messagesEndRef={messagesEndRef}
                inputRef={inputRef}
            />
        </div>
    );
};
