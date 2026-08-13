import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PiXLight,
    PiDownloadLight,
    PiCodeLight,
    PiEyeLight,
    PiFilePdfLight,
    PiFileTextLight,
    PiFileCodeLight,
    PiTableLight,
    PiCopyLight,
    PiCheckLight
} from 'react-icons/pi';
import type { ArtifactItem } from '../types';
import { markdownComponents } from './MarkdownComponents';

interface ArtifactViewerModalProps {
    artifact: ArtifactItem | null;
    onClose: () => void;
}

export const ArtifactViewerModal: React.FC<ArtifactViewerModalProps> = ({ artifact, onClose }) => {
    if (!artifact) return null;

    const fileType = (artifact.fileType || 'md').toLowerCase();
    
    // Formats that DO NOT have raw code view: pdf, docx, xlsx
    const noRawCodeView = ['pdf', 'docx', 'xlsx', 'xls'].includes(fileType);
    
    // Markdown renders styled by default
    const [viewMode, setViewMode] = useState<'render' | 'raw'>('render');
    const [copied, setCopied] = useState(false);

    const handleCopyCode = () => {
        if (artifact.content) {
            navigator.clipboard.writeText(artifact.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDownload = () => {
        const downloadUrl = `/api/artifacts/${artifact.artifactId}/download`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = artifact.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getFormatIcon = () => {
        switch (fileType) {
            case 'pdf': return <PiFilePdfLight className="w-4 h-4 text-red-400" />;
            case 'docx': case 'doc': return <PiFileTextLight className="w-4 h-4 text-blue-400" />;
            case 'xlsx': case 'xls': case 'csv': return <PiTableLight className="w-4 h-4 text-emerald-400" />;
            case 'json': case 'html': case 'css': case 'js': case 'ts': return <PiFileCodeLight className="w-4 h-4 text-amber-400" />;
            default: return <PiFileTextLight className="w-4 h-4 text-zinc-400" />;
        }
    };

    const renderXlsxTable = (rawText?: string) => {
        if (!rawText) return <p className="text-zinc-500 text-sm">Empty Spreadsheet Data</p>;
        
        let rows: string[][] = [];
        try {
            const parsed = JSON.parse(rawText);
            if (Array.isArray(parsed) && parsed.length > 0) {
                const keys = Object.keys(parsed[0]);
                rows.push(keys);
                parsed.forEach(row => {
                    rows.push(keys.map(k => String(row[k] ?? '')));
                });
            }
        } catch {
            const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
            lines.forEach(line => {
                if (line.includes('|')) {
                    if (line.includes('---')) return;
                    const cols = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
                    if (cols.length > 0) rows.push(cols);
                } else if (line.includes(',')) {
                    rows.push(line.split(',').map(c => c.trim()));
                }
            });
        }

        if (rows.length === 0) {
            return (
                <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 text-zinc-300 font-mono text-xs overflow-auto">
                    <pre>{rawText}</pre>
                </div>
            );
        }

        const headers = rows[0];
        const bodyRows = rows.slice(1);

        return (
            <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/60 shadow-inner">
                <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-zinc-900 text-zinc-300 border-b border-zinc-800">
                        <tr>
                            {headers.map((h, i) => (
                                <th key={i} className="px-4 py-2.5 font-semibold text-zinc-200 border-r last:border-r-0 border-zinc-800 whitespace-nowrap">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                        {bodyRows.map((r, ri) => (
                            <tr key={ri} className="hover:bg-white/[0.02] transition-colors">
                                {r.map((c, ci) => (
                                    <td key={ci} className="px-4 py-2 border-r last:border-r-0 border-zinc-800/60 whitespace-nowrap">
                                        {c}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-8 bg-black/70 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 10 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="relative w-full max-w-4xl h-[85vh] flex flex-col bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
                >
                    {/* Modal Header */}
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800/80 bg-zinc-900/60 shrink-0">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 rounded-lg bg-zinc-800/60 border border-zinc-700/50">
                                {getFormatIcon()}
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-sm font-semibold text-white truncate font-sans">
                                    {artifact.title || artifact.filename}
                                </h3>
                                <p className="text-[11px] text-zinc-400 font-mono flex items-center gap-2">
                                    <span>{artifact.filename}</span>
                                    <span>•</span>
                                    <span className="uppercase text-zinc-400 font-semibold">{fileType}</span>
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2.5 shrink-0">
                            {/* View Mode Toggle (Render vs Raw Code) */}
                            {!noRawCodeView && (
                                <div className="flex items-center p-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono">
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('render')}
                                        className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                                            viewMode === 'render'
                                                ? 'bg-zinc-800 text-white font-medium shadow-sm'
                                                : 'text-zinc-400 hover:text-zinc-200'
                                        }`}
                                    >
                                        <PiEyeLight className="w-3.5 h-3.5" />
                                        <span>Rendered</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('raw')}
                                        className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                                            viewMode === 'raw'
                                                ? 'bg-zinc-800 text-white font-medium shadow-sm'
                                                : 'text-zinc-400 hover:text-zinc-200'
                                        }`}
                                    >
                                        <PiCodeLight className="w-3.5 h-3.5" />
                                        <span>Code</span>
                                    </button>
                                </div>
                            )}

                            {/* Copy Raw Code Button */}
                            {artifact.content && !noRawCodeView && (
                                <button
                                    type="button"
                                    onClick={handleCopyCode}
                                    className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                                    title="Copy raw code"
                                >
                                    {copied ? <PiCheckLight className="w-4 h-4 text-emerald-400" /> : <PiCopyLight className="w-4 h-4" />}
                                </button>
                            )}

                            {/* Download Button */}
                            <button
                                type="button"
                                onClick={handleDownload}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs transition-colors cursor-pointer shadow-sm"
                            >
                                <PiDownloadLight className="w-4 h-4" />
                                <span>Download</span>
                            </button>

                            {/* Close Modal Button */}
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer ml-1"
                            >
                                <PiXLight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content View Body */}
                    <div className="flex-1 overflow-y-auto p-6 bg-zinc-950 text-zinc-100">
                        {/* NO RAW CODE VIEW (PDF, DOCX, XLSX) */}
                        {noRawCodeView ? (
                            fileType === 'pdf' ? (
                                <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-zinc-900/40 border border-zinc-800/80 rounded-2xl">
                                    <PiFilePdfLight className="w-16 h-16 text-red-400 mb-4 animate-pulse" />
                                    <h4 className="text-base font-medium text-white mb-1">PDF Document Artifact</h4>
                                    <p className="text-xs text-zinc-400 max-w-md mb-6 leading-relaxed">
                                        This PDF was compiled from structured markdown. View it rendered or download the complete PDF binary file.
                                    </p>
                                    <div className="w-full text-left bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-6 max-h-72 overflow-y-auto">
                                        <div className="prose prose-invert prose-sm max-w-none">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                                {artifact.content || '*No content preview*'}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleDownload}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-xs transition-colors cursor-pointer shadow-lg"
                                    >
                                        <PiDownloadLight className="w-4 h-4" />
                                        <span>Download PDF Document ({artifact.filename})</span>
                                    </button>
                                </div>
                            ) : fileType === 'docx' || fileType === 'doc' ? (
                                <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-zinc-900/40 border border-zinc-800/80 rounded-2xl">
                                    <PiFileTextLight className="w-16 h-16 text-blue-400 mb-4" />
                                    <h4 className="text-base font-medium text-white mb-1">Microsoft Word Document (.docx)</h4>
                                    <p className="text-xs text-zinc-400 max-w-md mb-6 leading-relaxed">
                                        Formatted Word document with typography and structured headings. Download to open in MS Word or Office.
                                    </p>
                                    <div className="w-full text-left bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-6 max-h-72 overflow-y-auto">
                                        <div className="prose prose-invert prose-sm max-w-none">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                                {artifact.content || '*No content preview*'}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleDownload}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors cursor-pointer shadow-lg"
                                    >
                                        <PiDownloadLight className="w-4 h-4" />
                                        <span>Download Word Document ({artifact.filename})</span>
                                    </button>
                                </div>
                            ) : (
                                /* XLSX / XLS / CSV Spreadsheet View */
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Spreadsheet Data View</h4>
                                        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-md">
                                            .xlsx Workbook
                                        </span>
                                    </div>
                                    {renderXlsxTable(artifact.content)}
                                </div>
                            )
                        ) : viewMode === 'raw' ? (
                            /* RAW CODE VIEW */
                            <div className="h-full rounded-xl bg-zinc-900/80 border border-zinc-800/80 overflow-hidden flex flex-col font-mono text-xs">
                                <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900 text-zinc-400 text-[11px]">
                                    <span>Raw {fileType.toUpperCase()} Source</span>
                                    <span>{artifact.content?.length || 0} characters</span>
                                </div>
                                <pre className="flex-1 p-4 overflow-auto text-zinc-200 leading-relaxed font-mono selection:bg-zinc-700">
                                    <code>{artifact.content}</code>
                                </pre>
                            </div>
                        ) : (
                            /* RENDERED VIEW (.md, .html, .json, .js, .css) */
                            fileType === 'md' || fileType === 'markdown' ? (
                                <div className="prose prose-invert max-w-none bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                        {artifact.content || ''}
                                    </ReactMarkdown>
                                </div>
                            ) : fileType === 'html' ? (
                                <div className="h-full flex flex-col border border-zinc-800 rounded-2xl overflow-hidden bg-white">
                                    <iframe
                                        title={artifact.title}
                                        srcDoc={artifact.content}
                                        className="w-full h-full border-none"
                                        sandbox="allow-scripts"
                                    />
                                </div>
                            ) : fileType === 'json' ? (
                                <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 font-mono text-xs text-amber-300 overflow-auto max-h-full">
                                    <pre>{artifact.content}</pre>
                                </div>
                            ) : (
                                <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 font-mono text-xs text-zinc-200 overflow-auto max-h-full">
                                    <pre>{artifact.content}</pre>
                                </div>
                            )
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
