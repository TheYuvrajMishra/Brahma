import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
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
        <div className="main-area">
            {/* Header */}
            <div className="chat-header">
                <div className="header-left">
                    {!sidebarOpen && (
                        <button onClick={() => setSidebarOpen(true)} className="menu-btn" title="EXPAND_PANEL">///</button>
                    )}
                    <h1 className="header-title">CONTEXT_CORE</h1>
                </div>
                <div className="connection-status">
                    <span className="status-text">{connected ? 'STATUS: ONLINE' : 'STATUS: OFFLINE'}</span>
                    <div className={`status-indicator ${connected ? 'indicator-online' : 'indicator-offline'}`}></div>
                </div>
            </div>

            {/* Context Manager Layout */}
            <div className="context-layout">
                {/* File Sidebar */}
                <div className="file-sidebar">
                    <div className="file-sidebar-title">[ CORE_KNOWLEDGE_FILES ]</div>
                    {files.map(filename => (
                        <div
                            key={filename}
                            className={`file-item ${selectedFile === filename ? 'file-item-active' : ''}`}
                            onClick={() => selectFile(filename)}
                        >
                            {filename.replace('.md', '')}
                        </div>
                    ))}
                </div>

                {/* Editor Container */}
                <div className="editor-container">
                    {selectedFile ? (
                        <>
                            <div className="editor-header">
                                <div className="editor-file-title">
                                    PATH: /brahma [brain]/core/{selectedFile}
                                </div>
                                <div className="editor-status">
                                    {isModified ? (
                                        <span className="editor-status-modified">// STATUS: UNSAVED_MODIFICATIONS</span>
                                    ) : saveStatus === 'saved' ? (
                                        <span className="editor-status-saved">// STATUS: SYNCED_TO_DISK</span>
                                    ) : (
                                        <span>// STATUS: SYNCED</span>
                                    )}
                                </div>
                            </div>
                            <textarea
                                className="editor-textarea"
                                value={fileContent}
                                onChange={(e) => setFileContent(e.target.value)}
                                placeholder="READING_FILE_STREAM..."
                                spellCheck="false"
                            />
                            <div className="editor-footer">
                                <button
                                    onClick={handleSave}
                                    className="editor-save-btn"
                                    disabled={!isModified || isSaving}
                                >
                                    {isSaving ? 'WRITING...' : '>>> WRITE_TO_DISK'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="editor-empty">
                            AWAITING_FILE_SELECTION...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
