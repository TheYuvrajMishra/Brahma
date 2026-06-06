import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
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
            // Show as YYYY-MM-DD HH:MM:SS
            const pad = (n: number) => n.toString().padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
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
        <div className="main-area">
            {/* Header */}
            <div className="chat-header">
                <div className="header-left">
                    {!sidebarOpen && (
                        <button onClick={() => setSidebarOpen(true)} className="menu-btn" title="EXPAND_PANEL">///</button>
                    )}
                    <h1 className="header-title">AUDIT_LOGS</h1>
                </div>
                <div className="connection-status">
                    <span className="status-text">{connected ? 'STATUS: ONLINE' : 'STATUS: OFFLINE'}</span>
                    <div className={`status-indicator ${connected ? 'indicator-online' : 'indicator-offline'}`}></div>
                </div>
            </div>

            {/* Logs layout container */}
            <div className="logs-layout">
                <div className="logs-header">
                    <div className="logs-title">[ SYSTEM_AUDIT_TRAIL ]</div>
                    <button onClick={fetchLogs} className="logs-refresh-btn" disabled={!connected}>
                        &gt;&gt;&gt; REFRESH_LOGS
                    </button>
                </div>

                <div className="logs-table-container">
                    {loading && logs.length === 0 ? (
                        <div className="editor-empty">AWAITING_LOGS_STREAM...</div>
                    ) : error ? (
                        <div className="editor-empty" style={{ color: 'var(--accent-red)' }}>
                            ERROR_LOADING_LOGS: {error}
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="editor-empty">NO_LOGS_FOUND_IN_SYSTEM</div>
                    ) : (
                        <table className="logs-table">
                            <thead>
                                <tr>
                                    <th className="logs-th" style={{ width: '180px' }}>TIMESTAMP</th>
                                    <th className="logs-th" style={{ width: '100px' }}>LEVEL</th>
                                    <th className="logs-th" style={{ width: '150px' }}>ACTION</th>
                                    <th className="logs-th">DETAILS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log, index) => {
                                    const levelClass = `level-${(log.level || 'INFO').toLowerCase()}`;
                                    return (
                                        <tr key={index} className="logs-tr">
                                            <td className="logs-td log-time">
                                                {formatTimestamp(log.timestamp)}
                                            </td>
                                            <td className={`logs-td log-level ${levelClass}`}>
                                                {(log.level || 'INFO').toUpperCase()}
                                            </td>
                                            <td className="logs-td log-action">
                                                {log.action || '-'}
                                            </td>
                                            <td className="logs-td log-details">
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
    );
};
