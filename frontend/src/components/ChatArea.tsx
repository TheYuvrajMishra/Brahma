import React, { type RefObject } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from '../types';

interface ChatAreaProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    connected: boolean;
    messages: Message[];
    isTyping: boolean;
    inputValue: string;
    setInputValue: (val: string) => void;
    handleSubmit: (e: React.FormEvent) => void;
    messagesEndRef: RefObject<HTMLDivElement | null>;
    inputRef: RefObject<HTMLInputElement | null>;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
    sidebarOpen,
    setSidebarOpen,
    connected,
    messages,
    isTyping,
    inputValue,
    setInputValue,
    handleSubmit,
    messagesEndRef,
    inputRef,
}) => {
    return (
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
    );
};
