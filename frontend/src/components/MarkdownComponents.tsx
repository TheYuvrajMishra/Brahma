import React, { useState, useRef, useEffect } from 'react';
import type { Components } from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PiCopyLight,
    PiCheckLight,
    PiCaretDownLight,
    PiTableLight,
    PiTerminalLight,
    PiCodeLight
} from 'react-icons/pi';

const tableToCSV = (tableEl: HTMLTableElement): string => {
    const rows = Array.from(tableEl.querySelectorAll('tr'));
    return rows.map(row => {
        const cells = Array.from(row.querySelectorAll('th, td'));
        return cells.map(cell => {
            let text = cell.textContent || '';
            text = text.trim();
            if (text.includes(',') || text.includes('"') || text.includes('\n')) {
                text = `"${text.replace(/"/g, '""')}"`;
            }
            return text;
        }).join(',');
    }).join('\n');
};

const tableToTSV = (tableEl: HTMLTableElement): string => {
    const rows = Array.from(tableEl.querySelectorAll('tr'));
    return rows.map(row => {
        const cells = Array.from(row.querySelectorAll('th, td'));
        return cells.map(cell => {
            let text = cell.textContent || '';
            text = text.trim().replace(/\t/g, ' ').replace(/\n/g, ' ');
            return text;
        }).join('\t');
    }).join('\n');
};

const extractText = (node: React.ReactNode): string => {
    if (typeof node === 'string') return node;
    if (typeof node === 'number') return String(node);
    if (!node) return '';
    if (Array.isArray(node)) return node.map(extractText).join('');
    if (React.isValidElement(node) && node.props && (node.props as any).children) {
        return extractText((node.props as any).children);
    }
    return '';
};

const MarkdownTable: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({ children, ...props }) => {
    const tableRef = useRef<HTMLTableElement>(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [copiedFormat, setCopiedFormat] = useState<'csv' | 'tsv' | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        if (dropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [dropdownOpen]);

    const handleCopy = (format: 'csv' | 'tsv') => {
        if (!tableRef.current) return;
        const textToCopy = format === 'csv' ? tableToCSV(tableRef.current) : tableToTSV(tableRef.current);
        navigator.clipboard.writeText(textToCopy);
        setCopiedFormat(format);
        setDropdownOpen(false);
        setTimeout(() => setCopiedFormat(null), 2000);
    };

    return (
        <div className="relative my-6 rounded-xl border border-white/15 bg-zinc-950/70 overflow-hidden group shadow-lg">
            {/* Table Header Bar */}
            <div className="flex items-center justify-between px-3.5 py-2 bg-white/[0.04] border-b border-white/10 text-xs text-zinc-300 font-mono select-none">
                <div className="flex items-center gap-2">
                    <PiTableLight className="w-4 h-4 text-zinc-400" />
                    <span className="font-semibold text-zinc-200 uppercase tracking-wider text-[11px]">Table Data</span>
                </div>
                <div className="relative" ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={() => setDropdownOpen(prev => !prev)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer text-xs font-sans"
                    >
                        {copiedFormat ? (
                            <>
                                <PiCheckLight className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400 font-medium">Copied {copiedFormat.toUpperCase()}</span>
                            </>
                        ) : (
                            <>
                                <PiCopyLight className="w-3.5 h-3.5 text-zinc-400" />
                                <span>Copy Table</span>
                                <PiCaretDownLight className="w-3 h-3 text-zinc-400 ml-0.5" />
                            </>
                        )}
                    </button>

                    <AnimatePresence>
                        {dropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -4, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -4, scale: 0.95 }}
                                transition={{ duration: 0.12 }}
                                className="absolute right-0 mt-1.5 w-44 py-1 bg-zinc-900 border border-white/15 rounded-lg shadow-2xl backdrop-blur-md z-30 font-sans"
                            >
                                <button
                                    type="button"
                                    onClick={() => handleCopy('csv')}
                                    className="w-full text-left px-3 py-2 text-xs text-zinc-200 hover:text-white hover:bg-white/10 flex items-center justify-between cursor-pointer transition-colors"
                                >
                                    <span>Copy CSV</span>
                                    <span className="text-[10px] text-zinc-500 font-mono">.csv</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleCopy('tsv')}
                                    className="w-full text-left px-3 py-2 text-xs text-zinc-200 hover:text-white hover:bg-white/10 flex items-center justify-between cursor-pointer transition-colors border-t border-white/5"
                                >
                                    <span>Copy Table (TSV)</span>
                                    <span className="text-[10px] text-zinc-500 font-mono">TSV</span>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto p-1">
                <table ref={tableRef} {...props} className="w-full text-left border-collapse text-xs text-zinc-200">
                    {children}
                </table>
            </div>
        </div>
    );
};

const MarkdownPre: React.FC<React.HTMLAttributes<HTMLPreElement>> = ({ children, ...props }) => {
    const [copied, setCopied] = useState(false);
    
    // Inspect child element to find code props
    const childArray = React.Children.toArray(children);
    let language = '';
    let rawCode = '';

    if (childArray.length > 0 && React.isValidElement(childArray[0])) {
        const codeElement = childArray[0] as React.ReactElement<any>;
        const className = codeElement.props?.className || '';
        const match = /language-(\w+)/.exec(className);
        if (match) {
            language = match[1];
        }
        rawCode = extractText(codeElement.props?.children);
    } else {
        rawCode = extractText(children);
    }

    rawCode = rawCode.replace(/\n$/, '');

    const isBash = ['bash', 'sh', 'zsh', 'shell', 'cmd', 'powershell', 'terminal'].includes(language.toLowerCase()) || 
                   (!language && (rawCode.startsWith('$ ') || rawCode.startsWith('sudo ') || rawCode.startsWith('npm ') || rawCode.startsWith('git ') || rawCode.startsWith('cd ')));

    const handleCopy = () => {
        navigator.clipboard.writeText(rawCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative my-5 rounded-xl border border-white/15 bg-zinc-950/80 overflow-hidden font-mono text-xs group shadow-lg">
            {/* Code Header Bar */}
            <div className="flex items-center justify-between px-3.5 py-2 bg-white/[0.04] border-b border-white/10 text-zinc-400 select-none">
                <div className="flex items-center gap-2">
                    {isBash ? (
                        <PiTerminalLight className="w-4 h-4 text-emerald-400" />
                    ) : (
                        <PiCodeLight className="w-4 h-4 text-zinc-400" />
                    )}
                    <span className="text-xs uppercase tracking-wider font-semibold text-zinc-200">
                        {language || (isBash ? 'bash' : 'code')}
                    </span>
                    {isBash && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-sans font-medium">
                            Terminal
                        </span>
                    )}
                </div>

                <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer text-xs font-sans"
                    title={isBash ? "Copy bash command" : "Copy code"}
                >
                    {copied ? (
                        <>
                            <PiCheckLight className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-medium">Copied!</span>
                        </>
                    ) : (
                        <>
                            <PiCopyLight className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{isBash ? "Copy Command" : "Copy Code"}</span>
                        </>
                    )}
                </button>
            </div>

            {/* Code Body */}
            <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed text-zinc-200 font-mono bg-black/40 m-0 border-none rounded-none" {...props}>
                {children}
            </pre>
        </div>
    );
};

const MarkdownCode: React.FC<React.HTMLAttributes<HTMLElement> & { inline?: boolean }> = ({ inline, children, className, ...props }) => {
    if (inline) {
        return (
            <code className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-200 font-mono text-[0.8125rem] border border-white/5" {...props}>
                {children}
            </code>
        );
    }
    return <code className={className} {...props}>{children}</code>;
};

export const markdownComponents: Components = {
    h1: ({ children }) => (
        <h1 className="text-2xl sm:text-3xl font-bold text-white mt-7 mb-3.5 font-display tracking-tight leading-snug border-b border-white/10 pb-2">
            {children}
        </h1>
    ),
    h2: ({ children }) => (
        <h2 className="text-xl sm:text-2xl font-semibold text-white/95 mt-6 mb-3 font-display tracking-tight leading-snug">
            {children}
        </h2>
    ),
    h3: ({ children }) => (
        <h3 className="text-lg sm:text-xl font-semibold text-zinc-100 mt-5 mb-2.5 font-display leading-snug">
            {children}
        </h3>
    ),
    h4: ({ children }) => (
        <h4 className="text-base font-semibold text-zinc-200 mt-4 mb-2 font-sans">
            {children}
        </h4>
    ),
    h5: ({ children }) => (
        <h5 className="text-sm font-semibold text-zinc-300 mt-3 mb-1.5 font-sans">
            {children}
        </h5>
    ),
    h6: ({ children }) => (
        <h6 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mt-3 mb-1 font-mono">
            {children}
        </h6>
    ),
    hr: () => (
        <hr className="my-7 border-0 border-t border-white/15" />
    ),
    table: MarkdownTable,
    pre: MarkdownPre,
    code: MarkdownCode,
};
