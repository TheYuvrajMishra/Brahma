import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PiXLight,
    PiFilePdfLight,
    PiFileTextLight,
    PiFileCodeLight,
    PiTableLight,
    PiDownloadLight,
    PiEyeLight,
    PiFolderSimpleLight
} from 'react-icons/pi';
import type { ArtifactItem } from '../types';

interface ArtifactsListPanelProps {
    isOpen: boolean;
    onClose: () => void;
    artifacts: ArtifactItem[];
    onSelectArtifact: (artifact: ArtifactItem) => void;
}

export const ArtifactsListPanel: React.FC<ArtifactsListPanelProps> = ({
    isOpen,
    onClose,
    artifacts,
    onSelectArtifact
}) => {
    if (!isOpen) return null;

    const getFormatIcon = (fileType: string) => {
        const type = (fileType || 'md').toLowerCase();
        switch (type) {
            case 'pdf': return <PiFilePdfLight className="w-4 h-4 text-red-400" />;
            case 'docx': case 'doc': return <PiFileTextLight className="w-4 h-4 text-blue-400" />;
            case 'xlsx': case 'xls': case 'csv': return <PiTableLight className="w-4 h-4 text-emerald-400" />;
            case 'json': case 'html': case 'css': case 'js': case 'ts': return <PiFileCodeLight className="w-4 h-4 text-amber-400" />;
            default: return <PiFileTextLight className="w-4 h-4 text-zinc-400" />;
        }
    };

    const handleDownload = (e: React.MouseEvent, artifact: ArtifactItem) => {
        e.stopPropagation();
        const downloadUrl = `/api/artifacts/${artifact.artifactId}/download`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = artifact.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[90] flex justify-end bg-black/40 backdrop-blur-xs">
                <motion.div
                    initial={{ x: '100%', opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: '100%', opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="w-full max-w-sm h-full bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col"
                >
                    {/* Panel Header */}
                    <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-800/80 bg-zinc-900/60">
                        <div className="flex items-center gap-2.5">
                            <PiFolderSimpleLight className="w-5 h-5 text-zinc-300" />
                            <h3 className="text-sm font-semibold text-white font-sans">Session Artifacts</h3>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                                {artifacts.length}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                            <PiXLight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Artifacts List */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {artifacts.length === 0 ? (
                            <div className="h-48 flex flex-col items-center justify-center text-center p-4">
                                <PiFolderSimpleLight className="w-10 h-10 text-zinc-600 mb-2" />
                                <p className="text-xs text-zinc-400 font-sans">No artifacts created yet.</p>
                                <p className="text-[11px] text-zinc-500 font-sans mt-1">
                                    Ask Brahma to generate a report, PDF, spreadsheet, document, or code file.
                                </p>
                            </div>
                        ) : (
                            artifacts.map(art => (
                                <div
                                    key={art.artifactId}
                                    onClick={() => onSelectArtifact(art)}
                                    className="group flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/80 transition-all cursor-pointer select-none"
                                >
                                    <div className="flex items-center gap-3 min-w-0 pr-2">
                                        <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 group-hover:border-zinc-700 transition-colors">
                                            {getFormatIcon(art.fileType)}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-xs font-medium text-zinc-200 group-hover:text-white truncate font-sans">
                                                {art.title || art.filename}
                                            </h4>
                                            <p className="text-[10px] text-zinc-500 font-mono mt-0.5 truncate">
                                                {art.filename} • <span className="uppercase text-zinc-400 font-semibold">{art.fileType}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); onSelectArtifact(art); }}
                                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer"
                                            title="View Artifact"
                                        >
                                            <PiEyeLight className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => handleDownload(e, art)}
                                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer"
                                            title="Download File"
                                        >
                                            <PiDownloadLight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
