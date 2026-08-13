import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { Message, TelemetryStep, ArtifactItem } from '../types';
import type { LayoutContextType } from '../components/MainLayout';
import { ChatArea } from '../components/ChatArea';
import '../App.css';

export const PlaygroundPage: React.FC = () => {
    const {
        socket,
        connected,
        activeSessionId,
        sidebarOpen,
        setSidebarOpen
    } = useOutletContext<LayoutContextType>();

    const [messages, setMessages] = useState<Message[]>([]);
    const [artifacts, setArtifacts] = useState<ArtifactItem[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [currentTelemetry, setCurrentTelemetry] = useState<TelemetryStep[]>([]);
    
    const telemetryRef = useRef<TelemetryStep[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // ── Bind Chat Events & Telemetry to Shared Socket ────────────────────────────
    useEffect(() => {
        if (!socket) return;

        const handleTyping = (state: boolean) => { 
            setIsTyping(state); 
            if (state) {
                telemetryRef.current = [];
                setCurrentTelemetry([]);
            }
        };

        const handleTelemetry = (data: { event?: string; stage?: string; label?: string; timestamp?: string; details?: unknown; plan?: unknown; step?: unknown }) => {
            const stepItem: TelemetryStep = {
                id: (data.event || 'step') + '_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                event: data.event || 'telemetry',
                stage: data.stage || 'Pipeline Execution',
                label: data.label || 'Processing stage payload...',
                timestamp: data.timestamp || new Date().toISOString(),
                details: data.details || data.plan || data.step || undefined
            };
            telemetryRef.current = [...telemetryRef.current, stepItem];
            setCurrentTelemetry(telemetryRef.current);
        };

        const handleChatResponse = () => {
            setCurrentTelemetry([]);
            telemetryRef.current = [];
        };

        const handleSessionLoaded = (data: { success?: boolean; messages?: Message[] }) => {
            if (data.success && data.messages) {
                setMessages(data.messages);
            }
        };

        const handleArtifactCreated = (artifact: ArtifactItem) => {
            if (artifact && artifact.sessionId === activeSessionId) {
                setArtifacts(prev => {
                    if (prev.some(a => a.artifactId === artifact.artifactId)) return prev;
                    return [artifact, ...prev];
                });
            }
        };

        const handleArtifactsUpdated = (data: { sessionId: string; artifacts: ArtifactItem[] }) => {
            if (data && data.sessionId === activeSessionId) {
                setArtifacts(data.artifacts || []);
            }
        };

        socket.on('typing', handleTyping);
        socket.on('telemetry', handleTelemetry);
        socket.on('chat response', handleChatResponse);
        socket.on('session:loaded', handleSessionLoaded);
        socket.on('artifact:created', handleArtifactCreated);
        socket.on('artifacts:updated', handleArtifactsUpdated);

        return () => {
            socket.off('typing', handleTyping);
            socket.off('telemetry', handleTelemetry);
            socket.off('chat response', handleChatResponse);
            socket.off('session:loaded', handleSessionLoaded);
            socket.off('artifact:created', handleArtifactCreated);
            socket.off('artifacts:updated', handleArtifactsUpdated);
        };
    }, [socket, activeSessionId]);

    // ── Load messages & artifacts when active session changes ─────────────────────
    useEffect(() => {
        if (!socket || !activeSessionId) return;
        
        socket.emit('session:load', activeSessionId, (data: { success?: boolean; messages?: Message[] }) => {
            if (data.success) {
                setMessages(data.messages || []);
            } else {
                setMessages([]);
            }
            setIsTyping(false);
            inputRef.current?.focus();
        });

        socket.emit('artifacts:list', activeSessionId, (data: { success?: boolean; artifacts?: ArtifactItem[] }) => {
            if (data.success && data.artifacts) {
                setArtifacts(data.artifacts);
            } else {
                setArtifacts([]);
            }
        });
    }, [socket, activeSessionId]);

    // ── Auto-scroll ───────────────────────────────────────────────────
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    // ── Send Message ──────────────────────────────────────────────────
    const handleSubmit = (e: React.FormEvent, convertedContext?: string) => {
        e.preventDefault();
        let text = inputValue.trim();
        if (!text && convertedContext) {
            text = "Please analyze the attached document and summarize key details.";
        }
        if (!text || !socket || !activeSessionId) return;

        const fullMessageText = convertedContext ? `${text}${convertedContext}` : text;

        const tempId = `msg_user_${Date.now()}`;
        setMessages(prev => [...prev, { id: tempId, role: 'user', content: text, timestamp: new Date().toISOString() }]);
        socket.emit('chat message', { text: fullMessageText, sessionId: activeSessionId });
        setInputValue('');
    };

    // ── Edit User Message ─────────────────────────────────────────────
    const handleEditMessage = (messageId: string, newText: string) => {
        if (!socket || !activeSessionId || !newText.trim()) return;
        socket.emit('chat edit', { messageId, newText: newText.trim(), sessionId: activeSessionId });
    };

    // ── Regenerate Assistant Message ──────────────────────────────────
    const handleRegenerateMessage = (messageId: string) => {
        if (!socket || !activeSessionId) return;
        socket.emit('chat regenerate', { messageId, sessionId: activeSessionId });
    };

    // ── Select Response Variant ───────────────────────────────────────
    const handleSelectVariant = (messageId: string, variantIndex: number) => {
        if (!socket || !activeSessionId) return;
        socket.emit('chat select_variant', { messageId, variantIndex, sessionId: activeSessionId });
    };

    return (
        <ChatArea 
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            connected={connected}
            messages={messages}
            artifacts={artifacts}
            isTyping={isTyping}
            currentTelemetry={currentTelemetry}
            inputValue={inputValue}
            setInputValue={setInputValue}
            handleSubmit={handleSubmit}
            messagesEndRef={messagesEndRef}
            inputRef={inputRef}
            onEditMessage={handleEditMessage}
            onRegenerateMessage={handleRegenerateMessage}
            onSelectVariant={handleSelectVariant}
        />
    );
};

