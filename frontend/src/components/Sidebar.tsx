import React from 'react';
import type { Session } from '../types';

interface SidebarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    sessions: Session[];
    activeSessionId: string | null;
    deleteConfirm: string | null;
    setDeleteConfirm: (id: string | null) => void;
    createNewSession: () => void;
    switchSession: (id: string) => void;
    deleteSession: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    sidebarOpen,
    setSidebarOpen,
    sessions,
    activeSessionId,
    deleteConfirm,
    setDeleteConfirm,
    createNewSession,
    switchSession,
    deleteSession,
}) => {
    // ── Time formatter ────────────────────────────────────────────────
    const formatTime = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    };

    return (
        <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
            {/* Sidebar Header */}
            <div className="sidebar-header">
                <h2 className="sidebar-title">Sessions</h2>
                <button onClick={() => setSidebarOpen(false)} className="sidebar-close-btn" title="Close sidebar">✕</button>
            </div>

            {/* New Chat Button */}
            <button onClick={createNewSession} className="new-chat-btn">
                + New Chat
            </button>

            {/* Session List */}
            <div className="session-list">
                {sessions.map(session => (
                    <div
                        key={session.sessionId}
                        className={`session-item ${session.sessionId === activeSessionId ? 'session-active' : ''}`}
                        onClick={() => switchSession(session.sessionId)}
                    >
                        <div className="session-info">
                            <p className="session-title">{session.title}</p>
                            <p className="session-time">{formatTime(session.updatedAt)}</p>
                        </div>
                        {deleteConfirm === session.sessionId ? (
                            <div className="delete-confirm">
                                <button
                                    onClick={(e) => { e.stopPropagation(); deleteSession(session.sessionId); }}
                                    className="delete-yes"
                                >✓</button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(null); }}
                                    className="delete-no"
                                >✕</button>
                            </div>
                        ) : (
                            <button
                                onClick={(e) => { e.stopPropagation(); setDeleteConfirm(session.sessionId); }}
                                className="delete-btn"
                                title="Delete session"
                            >🗑</button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
