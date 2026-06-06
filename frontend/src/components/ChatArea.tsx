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
                <div className="header-left">
                    {!sidebarOpen && (
                        <button onClick={() => setSidebarOpen(true)} className="menu-btn" title="EXPAND_PANEL">///</button>
                    )}
                    <h1 className="header-title">BRAHMA_TELEMETRY</h1>
                </div>
                <div className="connection-status">
                    <span className="status-text">{connected ? 'STATUS: ONLINE' : 'STATUS: OFFLINE'}</span>
                    <div className={`status-indicator ${connected ? 'indicator-online' : 'indicator-offline'}`}></div>
                </div>
            </div>

            {/* Chat Container */}
            <div className="chat-container">
                {/* Messages */}
                <div className="messages-area">
                    {messages.length === 0 && (
                        <div className="empty-state">
                            <p className="empty-title">AWAITING_INPUT</p>
                            <p className="empty-subtitle">SYS_RDY: PROVIDE COMMAND MATRIX TO PROCEED.</p>
                        </div>
                    )}
                    {messages.map((msg, i) => (
                        <div key={i} className={`message-row ${msg.role === 'user' ? 'message-user' : 'message-assistant'}`}>
                            <div className={`message-bubble ${msg.role === 'user' ? 'bubble-user' : 'bubble-assistant'}`}>
                                <p className="message-sender">{msg.role === 'user' ? '< USR_INPUT >' : '< SYS_OUTPUT >'}</p>
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
                                <span className="typing-block">[█]</span>
                                <span className="typing-text">PROCESSING_DATA_STREAM...</span>
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
                        placeholder="INPUT_COMMAND_STRING..."
                        autoComplete="off"
                    />
                    <button type="submit" className="send-btn">
                        &gt;&gt;&gt; EXECUTE
                    </button>
                </form>
            </div>
        </div>
    );
};
