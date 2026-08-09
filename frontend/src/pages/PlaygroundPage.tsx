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
    
    const telemetryRef = useRef<any[]>([]);
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

        const handleTelemetry = (data: any) => {
            const stepItem = {
                id: (data.event || 'step') + '_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                event: data.event,
                stage: data.stage || 'Pipeline Execution',
                label: data.label || 'Processing stage payload...',
                timestamp: data.timestamp || new Date().toISOString(),
                details: data.details || data.plan || data.step || null
            };
            telemetryRef.current = [...telemetryRef.current, stepItem];
            setCurrentTelemetry(telemetryRef.current);
        };

        const handleChatResponse = (msg: string) => {
            const finalTelemetry = [...telemetryRef.current];
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: msg, 
                timestamp: new Date().toISOString(), 
                isNew: true,
                telemetry: finalTelemetry.length > 0 ? finalTelemetry : undefined
            }]);
            setCurrentTelemetry([]);
            telemetryRef.current = [];
        };

        socket.on('typing', handleTyping);
        socket.on('telemetry', handleTelemetry);
        socket.on('chat response', handleChatResponse);

        return () => {
            socket.off('typing', handleTyping);
            socket.off('telemetry', handleTelemetry);
            socket.off('chat response', handleChatResponse);
        };
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
        setIsTyping(false);
        inputRef.current?.focus();
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

        setMessages(prev => [...prev, { role: 'user', content: text, timestamp: new Date().toISOString() }]);
        socket.emit('chat message', { text: fullMessageText, sessionId: activeSessionId });
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
