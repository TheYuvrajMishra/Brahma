import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
    PiChatCircleLight, 
    PiSlidersHorizontalLight, 
    PiListLight, 
    PiPlusLight, 
    PiTrashLight, 
    PiCheckLight, 
    PiXLight,
    PiTerminalLight,
    PiSignOutLight,
    PiArrowCounterClockwiseLight
} from 'react-icons/pi';
import type { Session, UserProfile } from '../types';

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
    googleConnected?: boolean;
    googleEmail?: string;
    user?: UserProfile | null;
    onConnectGoogle?: () => void;
    onLogout?: () => void;
    onResetAccount?: () => void;
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
    googleConnected = false,
    googleEmail = '',
    user,
    onConnectGoogle,
    onLogout,
    onResetAccount,
}) => {
    const [resetConfirm, setResetConfirm] = useState(false);

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
                        <PiTerminalLight className="w-5 h-5 text-emerald-400" />
                        <span className="font-display font-semibold tracking-wider text-sm text-white/90">
                            BRAHMA SYSTEM
                        </span>
                    </div>
                    <button 
                        onClick={() => setSidebarOpen(false)} 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all duration-300 cursor-pointer" 
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

                {/* Google Workspace & User Profile Connection Pill */}
                <div className="mx-1 p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {user?.picture ? (
                                <img src={user.picture} alt="Avatar" className="w-4 h-4 rounded-full" />
                            ) : (
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.9 5 12 5z" />
                                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                                    <path fill="#FBBC05" d="M5.3 14.7c-.2-.7-.4-1.7-.4-2.7s.2-2 .4-2.7L1.6 6.4C.6 8.4 0 10.1 0 12s.6 3.6 1.6 5.6l3.7-2.9z" />
                                    <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.3-6.7-5.3L1.6 16C3.5 19.8 7.4 23 12 23z" />
                                </svg>
                            )}
                            <span className="text-xs font-medium text-white/90 truncate max-w-[110px]">
                                {user?.name || 'Google Account'}
                            </span>
                        </div>
                        <span className={`w-2 h-2 rounded-full ${googleConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-500/60'}`} />
                    </div>

                    {googleConnected ? (
                        <div className="flex items-center justify-between pt-1 border-t border-white/5">
                            <span className="text-[10px] font-mono text-emerald-400 truncate max-w-[100px]">
                                {user?.email || googleEmail || 'Connected'}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={onConnectGoogle}
                                    className="text-[10px] text-zinc-400 hover:text-white underline transition-colors cursor-pointer"
                                >
                                    Reconnect
                                </button>
                                {onLogout && (
                                    <button
                                        onClick={onLogout}
                                        className="text-[10px] text-zinc-400 hover:text-red-400 transition-colors flex items-center gap-0.5 cursor-pointer"
                                        title="Sign Out"
                                    >
                                        <PiSignOutLight className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={onConnectGoogle}
                            className="w-full py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-xs font-medium text-white/90 flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                            <span>Connect Google</span>
                        </button>
                    )}

                    {/* Reset Brain & Account Setup Button */}
                    {onResetAccount && (
                        <div className="pt-1.5 border-t border-white/5">
                            {resetConfirm ? (
                                <div className="flex items-center justify-between bg-red-950/40 p-1.5 rounded-xl border border-red-500/30">
                                    <span className="text-[9px] font-medium text-red-300">Clear Brain & Restart?</span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => { setResetConfirm(false); onResetAccount(); }}
                                            className="px-2 py-0.5 rounded-md bg-red-600 hover:bg-red-500 text-white text-[9px] font-medium transition-all cursor-pointer"
                                        >
                                            Confirm
                                        </button>
                                        <button
                                            onClick={() => setResetConfirm(false)}
                                            className="px-1.5 py-0.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[9px] font-medium transition-all cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setResetConfirm(true)}
                                    className="w-full py-1 px-2 rounded-lg hover:bg-red-500/10 text-[10px] font-medium text-zinc-400 hover:text-red-400 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                    title="Deletes all brain context, chat history & restarts onboarding"
                                >
                                    <PiArrowCounterClockwiseLight className="w-3 h-3 text-red-400" />
                                    <span>Reset Brain & Setup</span>
                                </button>
                            )}
                        </div>
                    )}
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
