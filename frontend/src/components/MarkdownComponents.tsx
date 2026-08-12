import React, { useState, useRef, useEffect } from 'react';
import type { Components } from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PiCopyLight,
    PiCheckLight,
    PiCaretDownLight
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
    if (React.isValidElement<{ children?: React.ReactNode }>(node) && node.props && node.props.children) {
        return extractText(node.props.children);
    }
    return '';
};

const MarkdownTable: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({ children, ...props }) => {
    const tableRef = useRef<HTMLTableElement>(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [copiedFormat, setCopiedFormat] = useState<'csv' | 'tsv' | null>(null);
    const [isHovered, setIsHovered] = useState(false);
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
        <div
            className="relative my-4 overflow-x-auto"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Top Right Floating Copy Dropdown (Only visible when hovering over this specific table or when dropdown is open) */}
            <div
                ref={dropdownRef}
                className={`absolute top-1 right-1 z-20 transition-opacity duration-200 ${
                    isHovered || dropdownOpen || copiedFormat ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
            >
                <button
                    type="button"
                    onClick={() => setDropdownOpen(prev => !prev)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-white/15 text-zinc-300 hover:text-white transition-all cursor-pointer text-xs shadow-xl backdrop-blur-md"
                    title="Copy table data"
                >
                    {copiedFormat ? (
                        <>
                            <PiCheckLight className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-medium text-[11px]">{copiedFormat.toUpperCase()} Copied</span>
                        </>
                    ) : (
                        <>
                            <PiCopyLight className="w-3.5 h-3.5 text-zinc-300" />
                            <span className="text-[11px] font-medium">Copy</span>
                            <PiCaretDownLight className="w-3 h-3 text-zinc-400" />
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
                            className="absolute right-0 mt-1.5 w-36 bg-zinc-900 border border-white/15 rounded-xl shadow-2xl backdrop-blur-md z-30 font-sans overflow-hidden py-0"
                        >
                            <button
                                type="button"
                                onClick={() => handleCopy('csv')}
                                className="w-full text-left px-3.5 py-2 text-xs text-zinc-200 hover:text-white hover:bg-white/10 flex items-center justify-between cursor-pointer transition-colors rounded-t-xl"
                            >
                                <span>Copy CSV</span>
                                <span className="text-[10px] text-zinc-500 font-mono">.csv</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleCopy('tsv')}
                                className="w-full text-left px-3.5 py-2 text-xs text-zinc-200 hover:text-white hover:bg-white/10 flex items-center justify-between cursor-pointer transition-colors border-t border-white/5 rounded-b-xl"
                            >
                                <span>Copy Table</span>
                                <span className="text-[10px] text-zinc-500 font-mono">TSV</span>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Clean Open Table (No surrounding box container) */}
            <table ref={tableRef} {...props} className="w-full text-left border-collapse text-xs text-zinc-200">
                {children}
            </table>
        </div>
    );
};

const MarkdownPre: React.FC<React.HTMLAttributes<HTMLPreElement>> = ({ children, ...props }) => {
    const [copied, setCopied] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    
    // Extract raw code text
    const childArray = React.Children.toArray(children);
    let rawCode = '';

    if (childArray.length > 0 && React.isValidElement(childArray[0])) {
        const codeElement = childArray[0] as React.ReactElement<{ children?: React.ReactNode }>;
        rawCode = extractText(codeElement.props?.children);
    } else {
        rawCode = extractText(children);
    }

    rawCode = rawCode.replace(/\n$/, '');

    const handleCopy = () => {
        navigator.clipboard.writeText(rawCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div
            className="relative my-3 font-mono text-xs"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Top Right Floating Copy Symbol (Only visible when hovering over this specific code block) */}
            <button
                type="button"
                onClick={handleCopy}
                className={`absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-white/15 text-zinc-400 hover:text-white transition-opacity duration-200 cursor-pointer shadow-lg backdrop-blur-md flex items-center gap-1 ${
                    isHovered || copied ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                title="Copy code"
            >
                {copied ? (
                    <PiCheckLight className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                    <PiCopyLight className="w-3.5 h-3.5" />
                )}
            </button>

            {/* Code Body - Open and clean without surrounding card box border */}
            <pre className="p-3.5 overflow-x-auto text-[13px] leading-relaxed text-zinc-200 font-mono bg-zinc-950/40 rounded-lg m-0 border-none" {...props}>
                {children}
            </pre>
        </div>
    );
};

const MarkdownCode: React.FC<React.HTMLAttributes<HTMLElement> & { inline?: boolean }> = ({ inline, children, className, ...props }) => {
    const isBlock = !inline && (className?.includes('language-') || (typeof children === 'string' && children.includes('\n')));
    if (!isBlock) {
        return (
            <code className="px-1.5 py-0.5 rounded-md bg-white/10 text-zinc-100 font-mono text-[13px] sm:text-[14px] border border-white/10 shadow-xs" {...props}>
                {children}
            </code>
        );
    }
    return <code className={className} {...props}>{children}</code>;
};

export const markdownComponents: Components = {
    h1: ({ children }) => (
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mt-7 mb-4 first:mt-0 font-display tracking-tight leading-tight border-b border-white/15 pb-3">
            {children}
        </h1>
    ),
    h2: ({ children }) => (
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-zinc-50 mt-6 mb-3 first:mt-0 font-display tracking-tight leading-snug border-b border-white/10 pb-2">
            {children}
        </h2>
    ),
    h3: ({ children }) => (
        <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-zinc-100 mt-5 mb-2.5 first:mt-0 font-display tracking-tight leading-snug">
            {children}
        </h3>
    ),
    h4: ({ children }) => (
        <h4 className="text-base sm:text-lg lg:text-xl font-semibold text-zinc-200 mt-4 mb-2 first:mt-0 font-sans leading-snug">
            {children}
        </h4>
    ),
    h5: ({ children }) => (
        <h5 className="text-sm sm:text-base font-semibold text-zinc-300 uppercase tracking-wide mt-3 mb-1.5 first:mt-0 font-sans">
            {children}
        </h5>
    ),
    h6: ({ children }) => (
        <h6 className="text-xs sm:text-sm font-medium text-zinc-400 uppercase tracking-widest mt-3 mb-1 first:mt-0 font-mono">
            {children}
        </h6>
    ),
    p: ({ children }) => (
        <p className="text-[15px] sm:text-[16px] leading-[1.75] text-zinc-200/90 font-sans mb-4 last:mb-0">
            {children}
        </p>
    ),
    strong: ({ children }) => (
        <strong className="font-semibold text-white tracking-wide">
            {children}
        </strong>
    ),
    em: ({ children }) => (
        <em className="italic text-zinc-200">
            {children}
        </em>
    ),
    ul: ({ children }) => (
        <ul className="my-3.5 pl-6 list-disc space-y-2 text-zinc-200 marker:text-zinc-400">
            {children}
        </ul>
    ),
    ol: ({ children }) => (
        <ol className="my-3.5 pl-6 list-decimal space-y-2 text-zinc-200 marker:text-zinc-400 marker:font-mono">
            {children}
        </ol>
    ),
    li: ({ children }) => (
        <li className="text-[15px] sm:text-[16px] leading-relaxed text-zinc-200/90 pl-1">
            {children}
        </li>
    ),
    blockquote: ({ children }) => (
        <blockquote className="my-4 px-4 py-3.5 bg-white/[0.03] border-l-4 border-white/30 rounded-r-xl text-zinc-300 text-[15px] leading-relaxed italic shadow-sm backdrop-blur-sm">
            {children}
        </blockquote>
    ),
    a: ({ href, children }) => (
        <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-sky-400 hover:text-sky-300 underline underline-offset-4 decoration-sky-400/40 hover:decoration-sky-300 font-medium transition-colors"
        >
            {children}
        </a>
    ),
    hr: () => (
        <hr className="my-7 border-0 border-t border-white/15" />
    ),
    table: MarkdownTable,
    pre: MarkdownPre,
    code: MarkdownCode,
};
