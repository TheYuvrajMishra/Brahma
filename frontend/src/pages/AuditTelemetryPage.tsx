import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
    PiListLight, 
    PiArrowsCounterClockwiseLight,
    PiTerminalLight
} from 'react-icons/pi';
import type { LayoutContextType } from '../components/MainLayout';

interface LogEntry {
    timestamp: string;
    level: string;
    action?: string;
    details?: any;
}

export const AuditTelemetryPage: React.FC = () => {
    const { socket, connected, sidebarOpen, setSidebarOpen } = useOutletContext<LayoutContextType>();
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = useCallback(() => {
        if (!socket || !connected) return;
        
        socket.emit('logs:read', (res: any) => {
            setLoading(false);
            if (res.success) {
                setLogs(res.logs || []);
                setError(null);
            } else {
                console.error('Failed to load audit logs:', res.error);
                setError(res.error || 'Unknown error');
            }
        });
    }, [socket, connected]);

    // Fetch logs on mount and when connection status changes
    useEffect(() => {
        if (connected && socket) {
            fetchLogs();
        }
    }, [connected, socket, fetchLogs]);

    // Set up polling interval to auto-refresh logs
    useEffect(() => {
        if (!connected || !socket) return;
        
        const interval = setInterval(() => {
            fetchLogs();
        }, 3000);

        return () => clearInterval(interval);
    }, [connected, socket, fetchLogs]);

    const formatTimestamp = (ts: string) => {
        try {
            const d = new Date(ts);
            return new Intl.DateTimeFormat('en-IN', {
                timeZone: 'Asia/Kolkata',
                day: '2-digit',
                month: 'short',
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric',
                hour12: true
            }).format(d) + ' IST';
        } catch {
            return ts;
        }
    };

    const formatDetails = (details: any) => {
        if (!details) return '';
        if (typeof details === 'string') return details;
        if (typeof details === 'object') {
            return JSON.stringify(details, null, 2);
        }
        return String(details);
    };

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
                        AUDIT LOGS
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
            <div className="flex-1 flex flex-col p-6 overflow-hidden gap-4">
                {/* Telemetry Actions Header */}
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                            SYSTEM TELEMETRY AUDIT
                        </span>
                        <span className="text-xs font-mono text-zinc-300 font-semibold tracking-wide mt-0.5">
                            [ LOG_DATA_STREAM ]
                        </span>
                    </div>

                    <button 
                        onClick={fetchLogs} 
                        className="cta-pill-button-outline active:scale-[0.97]"
                        disabled={!connected}
                    >
                        <span className="font-display font-medium text-xs">Sync Logs</span>
                        <div className="cta-icon-wrapper-outline">
                            <PiArrowsCounterClockwiseLight className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        </div>
                    </button>
                </div>

                {/* Double Bezel Logs Table Grid */}
                <div className="flex-1 double-bezel-outer p-1 bg-white/[0.01] border border-white/5 rounded-[2rem] flex flex-col overflow-hidden hover:border-white/10 transition-colors duration-300">
                    <div className="flex-1 double-bezel-inner bg-[#070707]/90 rounded-[calc(2rem-0.375rem)] shadow-inner overflow-hidden flex flex-col">
                        <div className="flex-1 overflow-auto pr-1">
                            {loading && logs.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center">
                                    <PiTerminalLight className="w-8 h-8 text-zinc-600 mb-2 animate-pulse" />
                                    <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
                                        STREAMING_AUDIT_NODES...
                                    </span>
                                </div>
                            ) : error ? (
                                <div className="h-full flex items-center justify-center text-rose-400 text-xs font-mono">
                                    ERROR: {error}
                                </div>
                            ) : logs.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-zinc-500 text-xs font-mono">
                                    NO_SYSTEM_LOGS_FOUND
                                </div>
                            ) : (
                                <table className="telemetry-table">
                                    <thead>
                                        <tr>
                                            <th className="telemetry-th" style={{ width: '180px' }}>Timestamp</th>
                                            <th className="telemetry-th" style={{ width: '100px' }}>Level</th>
                                            <th className="telemetry-th" style={{ width: '150px' }}>Action</th>
                                            <th className="telemetry-th">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.map((log, index) => {
                                            const levelLower = (log.level || 'info').toLowerCase();
                                            
                                            // Dynamic badge styles for level
                                            let levelBadgeClass = 'text-zinc-400 bg-zinc-500/5 border-zinc-500/10';
                                            if (levelLower === 'audit') {
                                                levelBadgeClass = 'text-amber-400 bg-amber-500/5 border-amber-500/10';
                                            } else if (levelLower === 'error') {
                                                levelBadgeClass = 'text-rose-400 bg-rose-500/5 border-rose-500/10 animate-pulse';
                                            }

                                            return (
                                                <tr key={index} className="telemetry-tr">
                                                    <td className="telemetry-td font-mono text-zinc-500 text-[11px] whitespace-nowrap">
                                                        {formatTimestamp(log.timestamp)}
                                                    </td>
                                                    <td className="telemetry-td">
                                                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-mono tracking-wider font-semibold border ${levelBadgeClass}`}>
                                                            {levelLower.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="telemetry-td font-medium text-zinc-200">
                                                        {log.action || '-'}
                                                    </td>
                                                    <td className="telemetry-td text-zinc-400 font-mono text-[11px] leading-relaxed whitespace-pre-wrap word-break-all max-w-lg select-text">
                                                        {formatDetails(log.details)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
