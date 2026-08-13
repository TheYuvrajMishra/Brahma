import React, { type RefObject, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    PiListLight, 
    PiArrowUpLight, 
    PiPaperclipLight,
    PiSpinnerLight,
    PiCopyLight,
    PiCheckLight,
    PiPencilLight,
    PiArrowClockwiseLight,
    PiCaretLeftLight,
    PiCaretRightLight,
    PiShieldCheckLight,
    PiDownloadLight,
    PiCaretDownLight,
    PiFileCodeLight,
    PiFilePdfLight,
    PiFileTextLight,
    PiFolderSimpleLight
} from 'react-icons/pi';
import type { Message, MessageVariant, TelemetryStep, ArtifactItem } from '../types';
import { TypewriterMarkdown } from './TypewriterMarkdown';
import { ProcessTelemetryAccordion } from './ProcessTelemetryAccordion';
import { InteractiveN8nCanvas } from './InteractiveN8nCanvas';
import { markdownComponents } from './MarkdownComponents';
import { downloadAsMarkdown, downloadAsTXT, downloadAsPDF } from '../utils/exportUtils';
import { ArtifactViewerModal } from './ArtifactViewerModal';
import { ArtifactsListPanel } from './ArtifactsListPanel';

interface ChatAreaProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    connected?: boolean;
    messages: Message[];
    artifacts?: ArtifactItem[];
    isTyping: boolean;

    currentTelemetry?: TelemetryStep[];
    inputValue: string;
    setInputValue: (val: string) => void;
    handleSubmit: (e: React.FormEvent, convertedContext?: string) => void;
    messagesEndRef: RefObject<HTMLDivElement | null>;
    inputRef: RefObject<HTMLTextAreaElement | null>;
    onEditMessage?: (messageId: string, newText: string) => void;
    onRegenerateMessage?: (messageId: string) => void;
    onSelectVariant?: (messageId: string, variantIndex: number) => void;
}

const WITTY_STATUS_PHRASES = [
    "mulling...",
    "taking time to think...",
    "polishing the neurons...",
    "consulting the digital cosmos...",
    "staring into the void...",
    "cookin' something up...",
    "deciphering your brilliance...",
    "warming up the brain cells...",
    "plotting the next move...",
    "scratching CPU head...",
    "whispering to the LLM gods...",
    "assembling digital thoughts...",
    "brewing a genius response...",
    "aligning synaptic orbits...",
    "parsing human magic..."
];

const stripLegacySecurityFooter = (text: string) => {
    if (!text) return '';
    return text
        .replace(/\n\n---\n🔒 \*\*Brahma Security Guarantee\*\*: Zero-Deletion & Privacy Shield Active\. Connected user accounts and data are 100% protected\./gi, '')
        .replace(/\n\n---\n🔒 \*\*Brahma Security Guarantee\*\*:[^\n]*/gi, '')
        .trim();
};

const formatISTTime = (isoDateStr?: string) => {
    try {
        const date = isoDateStr ? new Date(isoDateStr) : new Date();
        return new Intl.DateTimeFormat('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        }).format(date) + ' IST';
    } catch {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST';
    }
};

interface MessageFooterProps {
    messageId?: string;
    content: string;
    timestamp?: string;
    isUser: boolean;
    variants?: MessageVariant[];
    activeVariantIndex?: number;
    onStartEdit?: () => void;
    onRegenerate?: () => void;
    onSelectVariant?: (index: number) => void;
    isTyping?: boolean;
}

const MessageFooter: React.FC<MessageFooterProps> = ({
    content,
    timestamp,
    isUser,
    variants,
    activeVariantIndex = 0,
    onStartEdit,
    onRegenerate,
    onSelectVariant,
    isTyping
}) => {
    const [copied, setCopied] = useState(false);
    const [downloadDropdownOpen, setDownloadDropdownOpen] = useState(false);
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
    const [openUpwards, setOpenUpwards] = useState(false);
    const downloadBtnRef = useRef<HTMLButtonElement>(null);
    const downloadDropdownRef = useRef<HTMLDivElement>(null);

    const toggleDownloadDropdown = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!downloadDropdownOpen && downloadBtnRef.current) {
            const rect = downloadBtnRef.current.getBoundingClientRect();
            const dropdownHeight = 125;
            const spaceBelow = window.innerHeight - rect.bottom;
            const isUpwards = spaceBelow < (dropdownHeight + 60);

            const clampedLeft = Math.max(12, Math.min(rect.left, window.innerWidth - 160));

            setOpenUpwards(isUpwards);
            setDropdownStyle({
                position: 'fixed',
                left: `${clampedLeft}px`,
                width: '144px',
                zIndex: 9999,
                ...(isUpwards 
                    ? { bottom: `${window.innerHeight - rect.top + 6}px` } 
                    : { top: `${rect.bottom + 6}px` }
                )
            });
            setDownloadDropdownOpen(true);
        } else {
            setDownloadDropdownOpen(false);
        }
    };

    useEffect(() => {
        if (!downloadDropdownOpen) return;

        const handleScrollOrResize = () => {
            setDownloadDropdownOpen(false);
        };

        const handleClickOutside = (e: MouseEvent) => {
            if (
                downloadDropdownRef.current &&
                !downloadDropdownRef.current.contains(e.target as Node) &&
                downloadBtnRef.current &&
                !downloadBtnRef.current.contains(e.target as Node)
            ) {
                setDownloadDropdownOpen(false);
            }
        };

        window.addEventListener('scroll', handleScrollOrResize, true);
        window.addEventListener('resize', handleScrollOrResize);
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            window.removeEventListener('scroll', handleScrollOrResize, true);
            window.removeEventListener('resize', handleScrollOrResize);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [downloadDropdownOpen]);

    const handleCopy = () => {
        navigator.clipboard.writeText(stripLegacySecurityFooter(content));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadMarkdown = () => {
        const clean = stripLegacySecurityFooter(content);
        downloadAsMarkdown(clean, `brahma-response-${Date.now()}.md`);
        setDownloadDropdownOpen(false);
    };

    const handleDownloadTXT = () => {
        const clean = stripLegacySecurityFooter(content);
        downloadAsTXT(clean, `brahma-response-${Date.now()}.txt`);
        setDownloadDropdownOpen(false);
    };

    const handleDownloadPDF = async () => {
        setIsDownloadingPdf(true);
        try {
            const msgContainer = downloadBtnRef.current?.closest('.group\\/msg');
            const markdownBody = msgContainer?.querySelector('.markdown-body') as HTMLElement | null;
            const clean = stripLegacySecurityFooter(content);
            await downloadAsPDF(clean, markdownBody, `brahma-response-${Date.now()}.pdf`);
        } catch (err) {
            console.error('Download PDF error:', err);
        } finally {
            setIsDownloadingPdf(false);
            setDownloadDropdownOpen(false);
        }
    };

    const hasMultipleVariants = variants && variants.length > 1;

    return (
        <div className={`flex items-center gap-3 mt-1.5 text-[10px] text-zinc-500 font-mono select-none ${isUser ? 'justify-end' : 'justify-start'}`}>
            <span>{formatISTTime(timestamp)}</span>
            
            {/* Copy Button */}
            <button
                type="button"
                onClick={handleCopy}
                className="hover:text-zinc-300 transition-colors flex items-center gap-1 cursor-pointer"
                title="Copy message"
            >
                {copied ? (
                    <>
                        <PiCheckLight className="w-3 h-3 text-white" />
                        <span className="text-white">Copied</span>
                    </>
                ) : (
                    <>
                        <PiCopyLight className="w-3 h-3" />
                        <span>Copy</span>
                    </>
                )}
            </button>

            {/* Download Button & Dropdown (AI responses only) */}
            {!isUser && (
                <>
                    <button
                        ref={downloadBtnRef}
                        type="button"
                        onClick={toggleDownloadDropdown}
                        className="hover:text-zinc-300 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Download response"
                    >
                        <PiDownloadLight className="w-3 h-3" />
                        <span>Download</span>
                        <PiCaretDownLight className={`w-2.5 h-2.5 transition-transform duration-200 ${downloadDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {downloadDropdownOpen && createPortal(
                        <AnimatePresence>
                            <motion.div
                                ref={downloadDropdownRef}
                                style={dropdownStyle}
                                initial={{ opacity: 0, scale: 0.95, y: openUpwards ? 4 : -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: openUpwards ? 4 : -4 }}
                                transition={{ duration: 0.12 }}
                                className="bg-zinc-900/95 border border-white/15 rounded-xl shadow-2xl backdrop-blur-md overflow-hidden py-1 font-sans text-xs"
                            >
                                <button
                                    type="button"
                                    onClick={handleDownloadMarkdown}
                                    className="w-full text-left px-3 py-1.5 text-zinc-300 hover:text-white hover:bg-white/10 flex items-center justify-between cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <PiFileCodeLight className="w-3.5 h-3.5 text-zinc-400" />
                                        <span>Markdown</span>
                                    </div>
                                    <span className="text-[10px] text-zinc-500 font-mono">.md</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleDownloadPDF}
                                    disabled={isDownloadingPdf}
                                    className="w-full text-left px-3 py-1.5 text-zinc-300 hover:text-white hover:bg-white/10 flex items-center justify-between cursor-pointer transition-colors border-t border-white/5 disabled:opacity-50"
                                >
                                    <div className="flex items-center gap-2">
                                        {isDownloadingPdf ? (
                                            <PiSpinnerLight className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                                        ) : (
                                            <PiFilePdfLight className="w-3.5 h-3.5 text-zinc-400" />
                                        )}
                                        <span>PDF</span>
                                    </div>
                                    <span className="text-[10px] text-zinc-500 font-mono">.pdf</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleDownloadTXT}
                                    className="w-full text-left px-3 py-1.5 text-zinc-300 hover:text-white hover:bg-white/10 flex items-center justify-between cursor-pointer transition-colors border-t border-white/5"
                                >
                                    <div className="flex items-center gap-2">
                                        <PiFileTextLight className="w-3.5 h-3.5 text-zinc-400" />
                                        <span>TXT</span>
                                    </div>
                                    <span className="text-[10px] text-zinc-500 font-mono">.txt</span>
                                </button>
                            </motion.div>
                        </AnimatePresence>,
                        document.body
                    )}
                </>
            )}

            {/* Edit Button (User messages) */}
            {isUser && onStartEdit && (
                <button
                    type="button"
                    onClick={onStartEdit}
                    disabled={isTyping}
                    className="hover:text-zinc-300 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    title="Edit message"
                >
                    <PiPencilLight className="w-3 h-3" />
                    <span>Edit</span>
                </button>
            )}

            {/* Regenerate Button (Assistant messages) */}
            {!isUser && onRegenerate && (
                <button
                    type="button"
                    onClick={onRegenerate}
                    disabled={isTyping}
                    className="hover:text-zinc-300 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    title="Regenerate response"
                >
                    <PiArrowClockwiseLight className="w-3 h-3" />
                    <span>Regenerate</span>
                </button>
            )}

            {/* Variant Switcher (Assistant messages with multiple variants) */}
            {!isUser && hasMultipleVariants && onSelectVariant && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-zinc-300">
                    <button
                        type="button"
                        onClick={() => onSelectVariant(activeVariantIndex - 1)}
                        disabled={activeVariantIndex === 0 || isTyping}
                        className="hover:text-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                        title="Previous version"
                    >
                        <PiCaretLeftLight className="w-3 h-3" />
                    </button>
                    <span>{activeVariantIndex + 1} / {variants.length}</span>
                    <button
                        type="button"
                        onClick={() => onSelectVariant(activeVariantIndex + 1)}
                        disabled={activeVariantIndex === variants.length - 1 || isTyping}
                        className="hover:text-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                        title="Next version"
                    >
                        <PiCaretRightLight className="w-3 h-3" />
                    </button>
                </div>
            )}

            {/* Security Guarantee Shield Icon Tooltip */}
            {!isUser && (
                <div className="relative group/shield flex items-center">
                    <button
                        type="button"
                        className="hover:text-zinc-300 transition-colors flex items-center cursor-pointer"
                        title="Brahma Security Guarantee: Zero-Deletion & Privacy Shield Active. Connected user accounts and data are 100% protected."
                    >
                        <PiShieldCheckLight className="w-3 h-3" />
                    </button>

                    {/* Subtle Hover Tooltip Card */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/shield:flex flex-col w-60 p-2.5 rounded-lg bg-zinc-900/95 border border-zinc-800 shadow-xl backdrop-blur-md z-50 pointer-events-none transition-all duration-150">
                        <div className="flex items-center gap-1.5 text-zinc-200 font-medium text-[11px] mb-1">
                            <PiShieldCheckLight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                            <span>Brahma Security Guarantee</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">
                            Zero-Deletion & Privacy Shield Active. Connected user accounts and data are 100% protected.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

const ThinkingStatus: React.FC = () => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex(prev => (prev + 1) % WITTY_STATUS_PHRASES.length);
        }, 1100);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-zinc-400 select-none">
            <AnimatePresence mode="wait">
                <motion.span
                    key={index}
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -3 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="font-mono text-xs text-zinc-300 lowercase tracking-wide"
                >
                    {WITTY_STATUS_PHRASES[index]}
                </motion.span>
            </AnimatePresence>
        </div>
    );
};

export const ChatArea: React.FC<ChatAreaProps> = ({
    sidebarOpen,
    setSidebarOpen,
    messages,
    artifacts = [],
    isTyping,
    currentTelemetry = [],
    inputValue,
    setInputValue,
    handleSubmit,
    messagesEndRef,
    inputRef,
    onEditMessage,
    onRegenerateMessage,
    onSelectVariant
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [attachedFile, setAttachedFile] = useState<{ name: string; markdown: string } | null>(null);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [showWittyPhase, setShowWittyPhase] = useState(false);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState<string>('');

    const [selectedArtifact, setSelectedArtifact] = useState<ArtifactItem | null>(null);
    const [artifactsPanelOpen, setArtifactsPanelOpen] = useState(false);


    // Calculate dynamic witty status duration (1s - 3s based on user message length)
    useEffect(() => {
        if (isTyping) {
            const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
            const msgLen = lastUserMsg?.content?.length || 0;

            let delayMs = 1000;
            if (msgLen >= 200) {
                delayMs = 3000;
            } else if (msgLen >= 50) {
                delayMs = 2000;
            }

            setShowWittyPhase(true);
            const timer = setTimeout(() => {
                setShowWittyPhase(false);
            }, delayMs);

            return () => clearTimeout(timer);
        } else {
            setShowWittyPhase(false);
        }
    }, [isTyping, messages]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingFile(true);
        try {
            const res = await fetch('/api/upload', {
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
        } catch (err: unknown) {
            console.error('File conversion error:', err);
            const msg = err instanceof Error ? err.message : String(err);
            alert(`Error uploading file: ${msg}`);
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

    useEffect(() => {
        const textarea = inputRef.current;
        if (!textarea) return;
        
        textarea.style.height = 'auto';
        const scrollHeight = textarea.scrollHeight;
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
                        BRAHMA SYSTEM
                    </h1>
                </div>
                
                <div className="flex items-center gap-2">
                    {artifacts.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setArtifactsPanelOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-mono transition-colors cursor-pointer select-none"
                            title="View session artifacts"
                        >
                            <PiFolderSimpleLight className="w-3.5 h-3.5 text-amber-400" />
                            <span>Artifacts ({artifacts.length})</span>
                        </button>
                    )}
                    {/* Live Plain IST Time */}
                    <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white text-[10px] font-mono select-none">
                        {formatISTTime()}
                    </div>
                </div>

            </div>

            {/* Chat Container */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Ambient Background Image Layer */}
                <div 
                    className="absolute inset-0 pointer-events-none opacity-[1] bg-cover bg-center bg-no-repeat z-0 mix-blend-lighten"
                    style={{ backgroundImage: 'url("/background.png")' }}
                />

                {/* Full-width Scroll Container */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-8 pt-8 pb-36 flex flex-col relative z-10 w-full">
                    <div className="max-w-5xl w-full mx-auto flex flex-col gap-6">
                        {messages.length === 0 && (
                            <InteractiveN8nCanvas />
                        )}

                        {messages.map((msg, i) => (
                            <div 
                                key={msg.id || i} 
                                className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {msg.role === 'user' ? (
                                    <div className="flex flex-col items-end max-w-[85%] group/msg w-full sm:w-auto">
                                        {editingMessageId === msg.id ? (
                                            <div className="w-full sm:min-w-[360px] bg-zinc-900/90 border border-white/15 rounded-xl p-3 flex flex-col gap-2.5 shadow-xl">
                                                <textarea
                                                    value={editingText}
                                                    onChange={(e) => setEditingText(e.target.value)}
                                                    className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none font-sans resize-none overflow-y-auto max-h-[120px]"
                                                    rows={2}
                                                    autoFocus
                                                />
                                                <div className="flex items-center justify-end gap-2 text-xs font-sans">
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingMessageId(null)}
                                                        className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (onEditMessage && msg.id && editingText.trim()) {
                                                                onEditMessage(msg.id, editingText.trim());
                                                            }
                                                            setEditingMessageId(null);
                                                        }}
                                                        className="px-3 py-1 rounded-lg bg-white text-black hover:bg-zinc-200 font-medium transition-colors cursor-pointer"
                                                    >
                                                        Save & Submit
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="rounded-lg px-4 py-2.5 bg-white/[0.06] text-zinc-100 text-sm shadow-sm select-text font-sans leading-relaxed border border-white/5 w-full">
                                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                            </div>
                                        )}
                                        <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity duration-300">
                                            <MessageFooter 
                                                messageId={msg.id}
                                                content={msg.content} 
                                                timestamp={msg.timestamp} 
                                                isUser={true}
                                                isTyping={isTyping}
                                                onStartEdit={() => {
                                                    setEditingMessageId(msg.id);
                                                    setEditingText(msg.content);
                                                }}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 max-w-[95%] py-0.5 select-text flex flex-col items-start group/msg">
                                        {/* Telemetry Execution Thoughts Accordion */}
                                        {msg.telemetry && msg.telemetry.length > 0 && (
                                            <ProcessTelemetryAccordion 
                                                telemetry={msg.telemetry} 
                                                isLive={false} 
                                                defaultExpanded={false}
                                            />
                                        )}

                                        <div className="markdown-body select-text text-zinc-100 leading-relaxed font-sans w-full">
                                            {msg.isNew ? (
                                                <TypewriterMarkdown 
                                                    content={stripLegacySecurityFooter(msg.content)} 
                                                    onUpdate={() => {
                                                        const container = messagesEndRef.current?.parentElement;
                                                        if (container) {
                                                            container.scrollTop = container.scrollHeight;
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{stripLegacySecurityFooter(msg.content)}</ReactMarkdown>
                                            )}
                                        </div>
                                        <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity duration-300">
                                            <MessageFooter 
                                                messageId={msg.id}
                                                content={msg.content} 
                                                timestamp={msg.timestamp} 
                                                isUser={false}
                                                variants={msg.variants}
                                                activeVariantIndex={msg.activeVariantIndex}
                                                isTyping={isTyping}
                                                onRegenerate={() => {
                                                    if (onRegenerateMessage && msg.id) {
                                                        onRegenerateMessage(msg.id);
                                                    }
                                                }}
                                                onSelectVariant={(idx) => {
                                                    if (onSelectVariant && msg.id) {
                                                        onSelectVariant(msg.id, idx);
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        
                        {isTyping && (
                            <div className="flex w-full justify-start items-start">
                                <div className="flex-1 max-w-[95%]">
                                    {showWittyPhase ? (
                                        <ThinkingStatus />
                                    ) : (
                                        <ProcessTelemetryAccordion 
                                            telemetry={currentTelemetry} 
                                            isLive={true} 
                                            defaultExpanded={true}
                                        />
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
                                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-mono">
                                    <PiPaperclipLight className="w-3.5 h-3.5" />
                                    <span>{attachedFile.name}</span>
                                    {uploadingFile ? (
                                        <PiSpinnerLight className="w-3 h-3 animate-spin text-white" />
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

            {/* Artifact Viewer Modal */}
            <ArtifactViewerModal
                artifact={selectedArtifact}
                onClose={() => setSelectedArtifact(null)}
            />

            {/* Artifacts List Drawer Panel */}
            <ArtifactsListPanel
                isOpen={artifactsPanelOpen}
                onClose={() => setArtifactsPanelOpen(false)}
                artifacts={artifacts}
                onSelectArtifact={(art) => {
                    setSelectedArtifact(art);
                    setArtifactsPanelOpen(false);
                }}
            />
        </div>
    );
};

