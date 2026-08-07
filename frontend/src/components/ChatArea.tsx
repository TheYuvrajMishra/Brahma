import React, { type RefObject, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
    PiListLight, 
    PiArrowUpLight, 
    PiWifiHighLight, 
    PiWifiSlashLight,
    PiPaperclipLight,
    PiSpinnerLight
} from 'react-icons/pi';
import type { Message, TelemetryStep } from '../types';
import { TypewriterMarkdown } from './TypewriterMarkdown';
import { ProcessTelemetryAccordion } from './ProcessTelemetryAccordion';
import { InteractiveN8nCanvas } from './InteractiveN8nCanvas';

interface ChatAreaProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    connected: boolean;
    messages: Message[];
    isTyping: boolean;
    currentTelemetry?: TelemetryStep[];
    inputValue: string;
    setInputValue: (val: string) => void;
    handleSubmit: (e: React.FormEvent, convertedContext?: string) => void;
    messagesEndRef: RefObject<HTMLDivElement | null>;
    inputRef: RefObject<HTMLTextAreaElement | null>;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
    sidebarOpen,
    setSidebarOpen,
    connected,
    messages,
    isTyping,
    currentTelemetry = [],
    inputValue,
    setInputValue,
    handleSubmit,
    messagesEndRef,
    inputRef,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [attachedFile, setAttachedFile] = useState<{ name: string; markdown: string } | null>(null);
    const [uploadingFile, setUploadingFile] = useState(false);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingFile(true);
        try {
            const host = window.location.hostname || 'localhost';
            const res = await fetch(`http://${host}:3005/api/upload`, {
                method: 'POST',
                headers: {
                    'x-file-name': file.name
                },
                body: file
            });
            const data = await res.json();

            if (data.success) {
                setAttachedFile({
                    name: file.name,
                    markdown: data.markdown
                });
            } else {
                alert(`Failed to convert file: ${data.error}`);
            }
        } catch (err: any) {
            console.error('File conversion error:', err);
            alert(`Error uploading file: ${err.message}`);
        } finally {
            setUploadingFile(false);
            if (e.target) e.target.value = '';
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        let finalContext = '';
        if (attachedFile) {
            finalContext = `\n\n--- ATTACHED CONVERTED DOCUMENT (${attachedFile.name}) ---\n${attachedFile.markdown}`;
        }
        handleSubmit(e, finalContext);
        setAttachedFile(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (inputValue.trim() || attachedFile) {
                handleFormSubmit(e as unknown as React.FormEvent);
            }
        }
    };

    React.useEffect(() => {
        const textarea = inputRef.current;
        if (!textarea) return;
        
        textarea.style.height = 'auto';
        const scrollHeight = textarea.scrollHeight;
        // Only set explicit height if the content wraps to multiple lines (scrollHeight > 45px)
        if (scrollHeight > 45) {
            textarea.style.height = `${Math.min(scrollHeight, 120)}px`;
        }
    }, [inputValue, inputRef]);



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
                {/* Ambient Background Image Layer */}
                <div 
                    className="absolute inset-0 pointer-events-none opacity-[1] bg-cover bg-center bg-no-repeat z-0 mix-blend-lighten"
                    style={{ backgroundImage: 'url("/background.png")' }}
                />

                {/* Full-width Scroll Container so scrollbar sits clean at the viewport edge */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-8 pt-8 pb-36 flex flex-col relative z-10 w-full">
                    <div className="max-w-5xl w-full mx-auto flex flex-col gap-6">
                        {messages.length === 0 && (
                            <InteractiveN8nCanvas />
                        )}

                        {messages.map((msg, i) => (
                            <div 
                                key={i} 
                                className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {msg.role === 'user' ? (
                                    <div className="max-w-[85%] rounded-lg px-4 py-2.5 bg-white/[0.06] text-zinc-100 text-sm shadow-sm select-text font-sans leading-relaxed border border-white/5">
                                        <p className="whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                ) : (
                                    <div className="flex-1 max-w-[95%] py-0.5 select-text">
                                        {/* Telemetry Execution Thoughts Accordion */}
                                        {msg.telemetry && msg.telemetry.length > 0 && (
                                            <ProcessTelemetryAccordion 
                                                telemetry={msg.telemetry} 
                                                isLive={false} 
                                                defaultExpanded={false}
                                            />
                                        )}

                                        <div className="markdown-body select-text text-zinc-100 leading-relaxed font-sans">
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
                                )}
                            </div>
                        ))}
                        
                        {isTyping && (
                            <div className="flex w-full justify-start items-start">
                                <div className="flex-1 max-w-[95%]">
                                    {currentTelemetry && currentTelemetry.length > 0 ? (
                                        <ProcessTelemetryAccordion 
                                            telemetry={currentTelemetry} 
                                            isLive={true} 
                                            defaultExpanded={true}
                                        />
                                    ) : (
                                        <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-white/[0.02] border border-white/5 text-zinc-400 font-mono text-xs">
                                            <div className="flex gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                                <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                                <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                            </div>
                                            <span className="text-[10px] tracking-wider text-zinc-400 uppercase">
                                                Initializing Pipeline Telemetry...
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Background Progressive Blur Overlay */}
                <div 
                    className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none z-20"
                    style={{
                        background: 'linear-gradient(to top, rgba(5, 5, 5, 0.95) 0%, rgba(5, 5, 5, 0.5) 60%, transparent 100%)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        maskImage: 'linear-gradient(to top, black 30%, rgba(0, 0, 0, 0.5) 65%, transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(to top, black 30%, rgba(0, 0, 0, 0.5) 65%, transparent 100%)',
                    }}
                />

                {/* Input Area: Glass Floating Pill */}
                <form 
                    onSubmit={handleFormSubmit} 
                    className="absolute bottom-0 left-0 right-0 p-6 flex justify-center z-30 pointer-events-none"
                >
                    <div className="w-full max-w-4xl double-bezel-outer p-1 bg-white/[0.01] border border-white/5 rounded-3xl hover:border-white/10 focus-within:border-white/20 transition-all duration-300 pointer-events-auto shadow-2xl">
                        {/* Attached file chip indicator */}
                        {attachedFile && (
                            <div className="px-5 pt-2 flex items-center gap-2">
                                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono">
                                    <PiPaperclipLight className="w-3.5 h-3.5" />
                                    <span>{attachedFile.name}</span>
                                    {uploadingFile ? (
                                        <PiSpinnerLight className="w-3 h-3 animate-spin text-indigo-400" />
                                    ) : (
                                        <button 
                                            type="button" 
                                            onClick={() => setAttachedFile(null)} 
                                            className="hover:text-white transition-colors ml-1"
                                        >
                                            ×
                                        </button>
                                    )}
                                </span>
                            </div>
                        )}

                        <div className="double-bezel-inner bg-[#070707]/90 rounded-3xl pl-4 pr-1.5 py-1.5 flex items-center justify-between gap-2">
                            {/* File Attachment Button */}
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.md"
                                onChange={handleFileSelect}
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingFile}
                                title="Attach Document (PDF, DOCX, XLSX, CSV)"
                                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all shrink-0"
                            >
                                <PiPaperclipLight className="w-4 h-4" />
                            </button>

                            <textarea
                                ref={inputRef}
                                rows={1}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="flex-1 bg-transparent py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none font-sans resize-none overflow-y-auto max-h-[120px]"
                                placeholder={attachedFile ? `Ask something about ${attachedFile.name}...` : "Execute command matrix string..."}
                                autoComplete="off"
                            />
                            <button 
                                type="submit" 
                                className="cta-pill-button active:scale-[0.97]"
                                disabled={!inputValue.trim() && !attachedFile}
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
