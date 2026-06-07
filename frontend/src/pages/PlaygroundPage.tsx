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
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // ── Bind Chat Events to Shared Socket ────────────────────────────
    useEffect(() => {
        if (!socket) return;

        const handleTyping = (state: boolean) => { setIsTyping(state); };
        const handleChatResponse = (msg: string) => {
            setMessages(prev => [...prev, { role: 'assistant', content: msg, timestamp: new Date().toISOString(), isNew: true }]);
        };

        socket.on('typing', handleTyping);
        socket.on('chat response', handleChatResponse);

        return () => {
            socket.off('typing', handleTyping);
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
            inputValue={inputValue}
            setInputValue={setInputValue}
            handleSubmit={handleSubmit}
            messagesEndRef={messagesEndRef}
            inputRef={inputRef}
        />
    );
};
