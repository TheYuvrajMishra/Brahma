import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { PiTerminalLight } from 'react-icons/pi';

interface AuthScreenProps {
    onLoginSuccess: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGoogleConnect = async () => {
        setConnecting(true);
        setError(null);

        try {
            const res = await fetch('/api/auth/google/url');
            const data = await res.json();
            if (data.url) {
                const width = 600;
                const height = 700;
                const left = window.screen.width / 2 - width / 2;
                const top = window.screen.height / 2 - height / 2;

                const popup = window.open(data.url, 'Google OAuth', `width=${width},height=${height},top=${top},left=${left}`);

                const handlePostMessage = (event: MessageEvent) => {
                    if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
                        window.removeEventListener('message', handlePostMessage);
                        if (event.data.success) {
                            onLoginSuccess();
                        } else {
                            setError(event.data.error || 'Google connection failed.');
                            setConnecting(false);
                        }
                    }
                };

                window.addEventListener('message', handlePostMessage);

                const timer = setInterval(() => {
                    if (popup && popup.closed) {
                        clearInterval(timer);
                        setConnecting(false);
                    }
                }, 1000);
            } else {
                setError('Google OAuth client ID is not configured on backend.');
                setConnecting(false);
            }
        } catch (err: any) {
            console.error('Failed to get Google Auth URL:', err);
            setError('Could not initialize Google Connection. Ensure backend is running.');
            setConnecting(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#09090b] text-white flex flex-col items-center justify-center relative overflow-hidden font-sans">
            {/* SVG Noise Overlay */}
            <svg style={{ position: 'absolute', width: 0, height: 0 }} xmlns="http://www.w3.org/2000/svg">
                <filter id="noiseFilterAuth">
                    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/>
                </filter>
            </svg>
            <div className="noise-overlay" />

            <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-md mx-4 p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-2xl shadow-2xl flex flex-col items-center text-center relative z-10"
            >
                {/* Logo & Header */}
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                    <PiTerminalLight className="w-7 h-7 text-white" />
                </div>

                <h1 className="text-2xl font-display font-semibold tracking-wider text-white mb-2">
                    BRAHMA SYSTEM
                </h1>
                <p className="text-xs text-zinc-400 max-w-xs leading-relaxed mb-8">
                    Multi-Platform Agentic AI Runtime with Layered Memory & Workspace Tooling
                </p>

                {error && (
                    <div className="w-full p-3 mb-6 rounded-xl bg-red-950/40 border border-red-500/20 text-red-400 text-xs font-mono text-left">
                        {error}
                    </div>
                )}

                {/* Google Connection Card */}
                <div className="w-full p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#FFFFFF" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.9 5 12 5z" />
                                <path fill="#FFFFFF" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                                <path fill="#FFFFFF" d="M5.3 14.7c-.2-.7-.4-1.7-.4-2.7s.2-2 .4-2.7L1.6 6.4C.6 8.4 0 10.1 0 12s.6 3.6 1.6 5.6l3.7-2.9z" />
                                <path fill="#FFFFFF" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.3-6.7-5.3L1.6 16C3.5 19.8 7.4 23 12 23z" />
                            </svg>
                            <span className="text-sm font-medium text-white">Google Account</span>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-white/40" />
                    </div>

                    <button
                        onClick={handleGoogleConnect}
                        disabled={connecting}
                        className="w-full py-3 px-4 rounded-xl bg-white hover:bg-zinc-200 active:scale-[0.98] text-xs font-semibold text-black tracking-wide flex items-center justify-center gap-2 transition-all duration-300 shadow-md cursor-pointer disabled:opacity-50"
                    >
                        {connecting ? (
                            <span className="flex items-center gap-2">
                                <span className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                <span>Authenticating...</span>
                            </span>
                        ) : (
                            <span>Continue with Google</span>
                        )}
                    </button>
                </div>

                <div className="mt-6 flex flex-col items-center gap-2">
                    <div className="text-[10px] font-mono text-zinc-500">
                        Encrypted OAuth Tokens • Multi-Tenant Isolated Sessions
                    </div>
                    <div className="flex items-center gap-2.5 text-[11px] text-zinc-400 font-sans">
                        <Link to="/privacy" target="_blank" className="hover:text-emerald-400 underline transition-colors">Privacy Policy</Link>
                        <span className="text-zinc-600">•</span>
                        <Link to="/terms" target="_blank" className="hover:text-emerald-400 underline transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

