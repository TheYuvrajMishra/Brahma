import React, { type RefObject } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
    PiListLight, 
    PiArrowUpLight, 
    PiWifiHighLight, 
    PiWifiSlashLight,
    PiSparkleLight,
    PiBrainLight,
    PiListDashesLight
} from 'react-icons/pi';
import type { Message } from '../types';
import { TypewriterMarkdown } from './TypewriterMarkdown';

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
    const suggestedPrompts = [
        { label: "Analyze Core State", text: "Evaluate core system configuration and context state variables.", icon: <PiBrainLight className="w-4 h-4 text-purple-400" /> },
        { label: "Audit Telemetry", text: "Summarize the latest system audit logs and level distributions.", icon: <PiListDashesLight className="w-4 h-4 text-blue-400" /> },
        { label: "Check Connections", text: "Verify connection status and list active session configurations.", icon: <PiSparkleLight className="w-4 h-4 text-emerald-400" /> }
    ];

    return (
        <div className="main-area flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-zinc-950/20 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                    {!sidebarOpen && (
                        <button 
                            onClick={() => setSidebarOpen(true)} 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all duration-300"
                            title="Expand Panel"
                        >
                            <PiListLight className="w-4 h-4" />
                        </button>
                    )}
                    <h1 className="font-display font-semibold tracking-wide text-sm text-white/95">
                        BRAHMA TELEMETRY
                    </h1>
                </div>
                
                {/* Connection Badge */}
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono border transition-all duration-500 ${
                    connected 
                        ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' 
                        : 'bg-rose-500/5 border-rose-500/10 text-rose-400'
                }`}>
                    {connected ? (
                        <>
                            <PiWifiHighLight className="w-3.5 h-3.5 animate-pulse" />
                            <span>SYS_ONLINE</span>
                        </>
                    ) : (
                        <>
                            <PiWifiSlashLight className="w-3.5 h-3.5" />
                            <span>SYS_OFFLINE</span>
                        </>
                    )}
                </div>
            </div>

            {/* Chat Container */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Messages Scroll Area */}
                <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-6">
                    {messages.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto text-center py-12">
                            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.2em] mb-3">
                                [ CORE COGNITIVE SYSTEM ]
                            </span>
                            <h2 className="font-display font-medium text-2xl text-white/90 tracking-tight mb-2">
                                Awaiting Command String
                            </h2>
                            <p className="text-xs text-zinc-400 leading-relaxed mb-8">
                                Feed raw cognitive commands or trigger pre-configured telemetry operations below to start the interaction sequence.
                            </p>

                            {/* Suggestion Bento Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                                {suggestedPrompts.map((p, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => {
                                            setInputValue(p.text);
                                            inputRef.current?.focus();
                                        }}
                                        className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 cursor-pointer text-left transition-all duration-300 hover:-translate-y-0.5 active:scale-98 flex flex-col justify-between h-32"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mb-3">
                                            {p.icon}
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-semibold text-white/90 mb-1">{p.label}</h4>
                                            <p className="text-[10px] text-zinc-500 line-clamp-2 leading-normal">{p.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((msg, i) => (
                        <div 
                            key={i} 
                            className={`flex flex-col w-full ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                        >
                            {msg.role === 'user' ? (
                                /* User Bubble: Simple Glass Pill */
                                <div className="max-w-[75%] rounded-2xl px-4 py-3 bg-white/[0.04] border border-white/5 text-zinc-200 text-sm shadow-sm select-text">
                                    <span className="block text-[8px] font-mono text-zinc-500 tracking-wider mb-1 uppercase">
                                        [ USER INPUT ]
                                    </span>
                                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                </div>
                            ) : (
                                /* Assistant Bubble: Double Bezel (Doppelrand) Card */
                                <div className="w-full max-w-[85%] double-bezel-outer bg-white/[0.01] border border-white/5 rounded-[2rem] p-1 shadow-md hover:border-white/10 transition-colors duration-500 select-text">
                                    <div className="double-bezel-inner bg-[#080808]/80 p-5 rounded-[calc(2rem-0.375rem)] shadow-inner">
                                        <span className="block text-[9px] font-semibold text-zinc-500 uppercase tracking-widest mb-3 font-sans">
                                            // Brahma Response Engine
                                        </span>
                                        <div className="markdown-body select-text">
                                            {msg.isNew ? (
                                                <TypewriterMarkdown 
                                                    content={msg.content} 
                                                    onUpdate={() => {
                                                        const container = messagesEndRef.current?.parentElement;
                                                        if (container) {
                                                            container.scrollTop = container.scrollHeight;
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    
                    {isTyping && (
                        <div className="flex flex-col items-start w-full">
                            <div className="flex items-center gap-3 px-5 py-3 rounded-full bg-white/[0.02] border border-white/5 text-zinc-400">
                                <div className="flex gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                                <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase">
                                    PROCESSING_STREAM...
                                </span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area: Glass Floating Pill */}
                <form 
                    onSubmit={handleSubmit} 
                    className="p-4 border-t border-white/5 bg-zinc-950/30 backdrop-blur-md flex justify-center z-10"
                >
                    <div className="w-full max-w-3xl double-bezel-outer p-1 bg-white/[0.01] border border-white/5 rounded-full hover:border-white/10 focus-within:border-white/20 transition-all duration-300">
                        <div className="double-bezel-inner bg-[#070707]/90 rounded-full pl-6 pr-1.5 py-1.5 flex items-center justify-between">
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                className="flex-1 bg-transparent py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none font-sans"
                                placeholder="Execute command matrix string..."
                                autoComplete="off"
                            />
                            <button 
                                type="submit" 
                                className="cta-pill-button active:scale-[0.97]"
                                disabled={!inputValue.trim()}
                            >
                                <span className="font-display font-medium text-xs">Execute</span>
                                <div className="cta-icon-wrapper">
                                    <PiArrowUpLight className="w-4 h-4 text-black" />
                                </div>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
