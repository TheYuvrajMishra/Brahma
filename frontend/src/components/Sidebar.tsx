import React from 'react';
import { Link } from 'react-router-dom';
import { 
    PiChatCircleLight, 
    PiSlidersHorizontalLight, 
    PiListLight, 
    PiPlusLight, 
    PiTrashLight, 
    PiCheckLight, 
    PiXLight,
    PiTerminalLight
} from 'react-icons/pi';
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
    activePage?: 'playground' | 'context' | 'logs';
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
    activePage = 'playground',
}) => {
    // ── Time formatter ────────────────────────────────────────────────
    const formatTime = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'JUST NOW';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    };

    return (
        <div className={`sidebar-dock ${sidebarOpen ? '' : 'sidebar-dock-closed'}`}>
            {/* Upper Content Group */}
            <div className="flex flex-col gap-6 overflow-hidden">
                {/* Sidebar Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <PiTerminalLight className="w-5 h-5 text-white/80" />
                        <span className="font-display font-semibold tracking-wider text-sm text-white/90">
                            BRAHMA SYSTEM
                        </span>
                    </div>
                    <button 
                        onClick={() => setSidebarOpen(false)} 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all duration-300" 
                        title="Close panel"
                    >
                        <PiXLight className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Navigation Group */}
                <div className="flex flex-col gap-1">
                    <Link 
                        to="/playground" 
                        className={`nav-link-item ${activePage === 'playground' ? 'nav-link-item-active' : ''}`}
                    >
                        <PiChatCircleLight className="w-4 h-4" />
                        <span>Playground</span>
                    </Link>
                    <Link 
                        to="/context" 
                        className={`nav-link-item ${activePage === 'context' ? 'nav-link-item-active' : ''}`}
                    >
                        <PiSlidersHorizontalLight className="w-4 h-4" />
                        <span>Context Core</span>
                    </Link>
                    <Link 
                        to="/logs" 
                        className={`nav-link-item ${activePage === 'logs' ? 'nav-link-item-active' : ''}`}
                    >
                        <PiListLight className="w-4 h-4" />
                        <span>Audit Telemetry</span>
                    </Link>
                </div>

                {/* Separator line */}
                <div className="h-px bg-white/5 mx-2" />

                {/* Session List Title / Eyebrow */}
                <div className="px-2 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
                        Recent Sessions
                    </span>
                </div>

                {/* Session List */}
                <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1.5 max-h-[calc(100vh-28rem)]">
                    {sessions.map(session => {
                        const isActive = session.sessionId === activeSessionId;
                        return (
                            <div
                                key={session.sessionId}
                                className={`group relative flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all duration-400 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.99] ${
                                    isActive 
                                        ? 'bg-white/5 border-white/10 text-white' 
                                        : 'bg-transparent border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]'
                                }`}
                                onClick={() => switchSession(session.sessionId)}
                            >
                                <div className="flex flex-col min-w-0 pr-6">
                                    <span className="text-xs font-medium truncate tracking-wide">
                                        {session.title}
                                    </span>
                                    <span className="text-[10px] text-zinc-500 mt-0.5 font-mono">
                                        {formatTime(session.updatedAt)}
                                    </span>
                                </div>
                                
                                <div className="absolute right-2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    {deleteConfirm === session.sessionId ? (
                                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => deleteSession(session.sessionId)}
                                                className="w-5 h-5 rounded-md bg-red-950/50 hover:bg-red-500 text-red-400 hover:text-white flex items-center justify-center transition-all duration-300"
                                                title="Confirm delete"
                                            >
                                                <PiCheckLight className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(null)}
                                                className="w-5 h-5 rounded-md bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all duration-300"
                                                title="Cancel delete"
                                            >
                                                <PiXLight className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setDeleteConfirm(session.sessionId); }}
                                            className="w-5 h-5 rounded-md bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-red-400 flex items-center justify-center transition-all duration-300"
                                            title="Delete Session"
                                        >
                                            <PiTrashLight className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bottom Content Group (CTA Button) */}
            <div className="pt-4 mt-auto">
                <button 
                    onClick={createNewSession} 
                    className="cta-pill-button w-full active:scale-[0.98]"
                >
                    <span className="font-display font-medium tracking-wide">Init Session</span>
                    <div className="cta-icon-wrapper">
                        <PiPlusLight className="w-4 h-4 text-black" />
                    </div>
                </button>
            </div>
        </div>
    );
};
