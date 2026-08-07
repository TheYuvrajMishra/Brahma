import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { Message } from '../types';
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
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [currentTelemetry, setCurrentTelemetry] = useState<any[]>([]);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // ── Bind Chat Events & Telemetry to Shared Socket ────────────────────────────
    useEffect(() => {
        if (!socket) return;

        const handleTyping = (state: boolean) => { 
            setIsTyping(state); 
            if (state) {
                setCurrentTelemetry([]);
            }
        };

        const handleTelemetry = (data: any) => {
            setCurrentTelemetry(prev => [...prev, {
                id: data.event + '_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                event: data.event,
                stage: data.stage,
                label: data.label,
                timestamp: data.timestamp,
                details: data.details || data.plan || data.step || null
            }]);
        };

        const handleChatResponse = (msg: string) => {
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: msg, 
                timestamp: new Date().toISOString(), 
                isNew: true,
                telemetry: currentTelemetry.length > 0 ? [...currentTelemetry] : undefined
            }]);
            setCurrentTelemetry([]);
        };

        socket.on('typing', handleTyping);
        socket.on('telemetry', handleTelemetry);
        socket.on('chat response', handleChatResponse);

        return () => {
            socket.off('typing', handleTyping);
            socket.off('telemetry', handleTelemetry);
            socket.off('chat response', handleChatResponse);
        };
    }, [socket, currentTelemetry]);

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
        setIsTyping(false);
        inputRef.current?.focus();
    }, [socket, activeSessionId]);

    // ── Auto-scroll ───────────────────────────────────────────────────
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

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
        <ChatArea 
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            connected={connected}
            messages={messages}
            isTyping={isTyping}
            currentTelemetry={currentTelemetry}
            inputValue={inputValue}
            setInputValue={setInputValue}
            handleSubmit={handleSubmit}
            messagesEndRef={messagesEndRef}
            inputRef={inputRef}
        />
    );
};
