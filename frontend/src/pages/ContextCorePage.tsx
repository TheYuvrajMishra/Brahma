import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
    PiListLight, 
    PiFileTextLight, 
    PiFloppyDiskLight,
    PiSlidersHorizontalLight
} from 'react-icons/pi';
import type { LayoutContextType } from '../components/MainLayout';

export const ContextCorePage: React.FC = () => {
    const { socket, connected, sidebarOpen, setSidebarOpen } = useOutletContext<LayoutContextType>();
    const [files, setFiles] = useState<string[]>([]);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [fileContent, setFileContent] = useState<string>('');
    const [savedContent, setSavedContent] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

    // ── Fetch file list on mount / connect ────────────────────────────
    useEffect(() => {
        if (!socket || !connected) return;
        fetchFileList();
    }, [socket, connected]);

    const fetchFileList = () => {
        socket.emit('brain:list', (res: any) => {
            if (res.success) {
                setFiles(res.files || []);
                // Auto-select the first file if none is selected
                if (res.files && res.files.length > 0 && !selectedFile) {
                    selectFile(res.files[0]);
                }
            } else {
                console.error('Failed to load brain file list:', res.error);
            }
        });
    };

    const selectFile = (filename: string) => {
        if (!socket) return;
        setSelectedFile(filename);
        setSaveStatus('idle');
        socket.emit('brain:read', filename, (res: any) => {
            if (res.success) {
                setFileContent(res.content || '');
                setSavedContent(res.content || '');
            } else {
                console.error(`Failed to read file ${filename}:`, res.error);
            }
        });
    };

    const handleSave = () => {
        if (!socket || !selectedFile || isSaving) return;
        setIsSaving(true);
        setSaveStatus('idle');
        socket.emit('brain:write', { filename: selectedFile, content: fileContent }, (res: any) => {
            setIsSaving(false);
            if (res.success) {
                setSavedContent(fileContent);
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 3000);
            } else {
                console.error(`Failed to write file ${selectedFile}:`, res.error);
                setSaveStatus('error');
            }
        });
    };

    const isModified = fileContent !== savedContent;

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
                        CONTEXT CORE
                    </h1>
                </div>
                
                {/* Live Plain IST Time */}
                <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white text-[10px] font-mono select-none">
                    {new Intl.DateTimeFormat('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true
                    }).format(new Date()) + ' IST'}
                </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 flex overflow-hidden">
                {/* File Sidebar list */}
                <div className="w-60 border-r border-white/5 bg-zinc-950/25 flex flex-col p-4 gap-3 overflow-y-auto">
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest px-2 mb-1">
                        Knowledge Bases
                    </span>
                    <div className="flex flex-col gap-1">
                        {files.map(filename => {
                            const isSelected = selectedFile === filename;
                            return (
                                <div
                                    key={filename}
                                    className={`flex items-center gap-2.5 p-3 rounded-xl cursor-pointer border text-xs font-medium transition-all duration-400 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.99] ${
                                        isSelected 
                                            ? 'bg-white/5 border-white/10 text-white' 
                                            : 'bg-transparent border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]'
                                    }`}
                                    onClick={() => selectFile(filename)}
                                >
                                    <PiFileTextLight className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-zinc-500'}`} />
                                    <span className="truncate">{filename.replace('.md', '')}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Editor Container */}
                <div className="flex-1 flex flex-col p-6 overflow-hidden">
                    {selectedFile ? (
                        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                            {/* Editor Sub-Header */}
                            <div className="flex items-center justify-between min-h-[2.5rem]">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                                        SYSTEM FILE DIRECTORY
                                    </span>
                                    <span className="text-xs font-mono text-zinc-300 font-semibold tracking-wide mt-0.5">
                                        /brahma [brain]/core/{selectedFile}
                                    </span>
                                </div>

                                {/* Unsaved modification label */}
                                <div className="text-[10px] font-mono">
                                    {isModified ? (
                                        <span className="text-amber-400 bg-amber-500/5 px-2.5 py-1 rounded-full border border-amber-500/10 animate-pulse">
                                            // UNSAVED CHANGES
                                        </span>
                                    ) : saveStatus === 'saved' ? (
                                        <span className="text-emerald-400 bg-emerald-500/5 px-2.5 py-1 rounded-full border border-emerald-500/10">
                                            // CHANGES SYNCED
                                        </span>
                                    ) : (
                                        <span className="text-zinc-500 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                                            // CONTEXT SYNCED
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Double Bezel Editor Core */}
                            <div className="flex-1 double-bezel-outer p-1 bg-white/[0.01] border border-white/5 rounded-[2rem] flex flex-col overflow-hidden hover:border-white/10 transition-colors duration-300">
                                <div className="flex-1 double-bezel-inner bg-[#070707]/90 rounded-[calc(2rem-0.375rem)] p-5 flex flex-col shadow-inner overflow-hidden">
                                    <textarea
                                        className="flex-1 bg-transparent text-zinc-200 font-mono text-sm leading-relaxed resize-none outline-none w-full h-full"
                                        value={fileContent}
                                        onChange={(e) => setFileContent(e.target.value)}
                                        placeholder="Reading system file stream..."
                                        spellCheck="false"
                                    />
                                </div>
                            </div>

                            {/* Save Actions Footer */}
                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={handleSave}
                                    disabled={!isModified || isSaving}
                                    className={`cta-pill-button active:scale-[0.97] transition-opacity duration-300 ${
                                        !isModified || isSaving ? 'opacity-50 cursor-not-allowed' : 'opacity-100'
                                    }`}
                                >
                                    <span className="font-display font-medium text-xs">
                                        {isSaving ? 'Writing Matrix...' : 'Save Context'}
                                    </span>
                                    <div className="cta-icon-wrapper">
                                        <PiFloppyDiskLight className="w-4 h-4 text-black" />
                                    </div>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                            <PiSlidersHorizontalLight className="w-10 h-10 text-zinc-600 mb-3 animate-pulse" />
                            <h3 className="text-sm font-medium text-zinc-400">
                                Awaiting file node selection...
                            </h3>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
