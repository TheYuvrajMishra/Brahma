import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    PiShieldCheckLight, 
    PiFileTextLight, 
    PiCpuLight, 
    PiDatabaseLight, 
    PiEnvelopeSimpleLight, 
    PiTableLight, 
    PiCalendarLight, 
    PiLockKeyLight, 
    PiArrowRightLight,
    PiGithubLogoLight,
    PiLinkedinLogoLight,
    PiCheckCircleLight,
    PiSparkleLight
} from 'react-icons/pi';

export const LandingPage: React.FC = () => {
    return (
        <div className="min-h-screen w-full bg-[#050505] text-zinc-300 font-sans selection:bg-white/20 selection:text-white relative overflow-x-hidden">
            {/* SVG Noise Overlay */}
            <svg style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0, pointerEvents: 'none' }} xmlns="http://www.w3.org/2000/svg">
                <filter id="noiseFilterLanding">
                    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/>
                </filter>
            </svg>
            <div className="noise-overlay" />

            {/* Fixed Top Header */}
            <header className="fixed top-0 left-0 right-0 z-50 w-full bg-[#050505]/95 backdrop-blur-xl border-b border-white/10 h-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-1.5">
                            <img src="/lotus-logo.svg" alt="Brahma Lotus Logo" className="w-full h-full object-contain" />
                        </div>
                        <span className="font-display font-bold text-base tracking-wider text-white">
                            BRAHMA
                        </span>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6 text-xs font-medium">
                        <a href="#features" className="hidden md:inline-block text-zinc-400 hover:text-white transition-colors">
                            Features
                        </a>
                        <a href="#workspace" className="hidden md:inline-block text-zinc-400 hover:text-white transition-colors">
                            Google Integration
                        </a>
                        <Link to="/privacy" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1">
                            <PiShieldCheckLight className="w-4 h-4" />
                            <span>Privacy Policy</span>
                        </Link>
                        <Link to="/terms" className="hidden sm:flex text-zinc-400 hover:text-white transition-colors items-center gap-1">
                            <PiFileTextLight className="w-4 h-4" />
                            <span>Terms</span>
                        </Link>
                        <Link 
                            to="/playground" 
                            className="px-3.5 py-1.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-all active:scale-95 shadow-md flex items-center gap-1.5"
                        >
                            <span>Launch App</span>
                            <PiArrowRightLight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Hero Section */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 relative z-10">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center text-center max-w-4xl mx-auto mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-zinc-300 text-xs font-mono mb-6">
                        <PiSparkleLight className="w-4 h-4 text-white" />
                        <span>Multi-Platform Agentic AI Runtime</span>
                    </div>

                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-bold tracking-tight text-white mb-6 leading-[1.1]">
                        Brahma
                    </h1>

                    <p className="text-base sm:text-xl text-zinc-400 max-w-2xl leading-relaxed mb-8">
                        A structured cognitive AI runtime for autonomous goal execution, persistent long-term memory management, and safe Google Workspace automation.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <Link 
                            to="/playground" 
                            className="px-6 py-3 rounded-2xl bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition-all active:scale-95 shadow-lg flex items-center gap-2"
                        >
                            <span>Launch App & Login</span>
                            <PiArrowRightLight className="w-4 h-4" />
                        </Link>
                        <Link 
                            to="/privacy" 
                            className="px-6 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-white font-medium text-sm hover:bg-white/[0.08] transition-all flex items-center gap-2"
                        >
                            <PiShieldCheckLight className="w-4 h-4" />
                            <span>Read Privacy Policy</span>
                        </Link>
                    </div>
                </motion.div>

                {/* Purpose Overview Card */}
                <div className="p-8 sm:p-10 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl mb-16">
                    <div className="max-w-3xl">
                        <div className="text-xs font-mono text-zinc-400 uppercase tracking-widest mb-2">
                            Application Purpose
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-display font-semibold text-white mb-4">
                            What is Brahma?
                        </h2>
                        <p className="text-zinc-300 text-sm sm:text-base leading-relaxed mb-4">
                            Brahma is a multi-tenant, multi-platform agentic AI runtime built to decompose user goals into structured dependency graphs, execute parallel tool calls safely, and maintain continuous session memory.
                        </p>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                            Through user-authorized Google OAuth permissions, Brahma empowers users to automate everyday productivity workflows — such as reading and drafting email responses via Gmail, logging structured data into Google Sheets, checking schedules on Google Calendar, and retrieving document context from Google Drive.
                        </p>
                    </div>
                </div>

                {/* Features Grid */}
                <div id="features" className="mb-20">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl sm:text-4xl font-display font-bold text-white mb-3">
                            Core Architecture
                        </h2>
                        <p className="text-sm text-zinc-400 max-w-xl mx-auto">
                            Decoupled 8-stage cognitive pipeline engineered for execution safety and memory partitioning.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 flex flex-col gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                                <PiCpuLight className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-display font-semibold text-white">
                                Cognitive DAG Execution
                            </h3>
                            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                                Goal decomposition into sequential and parallel execution stages with automated self-reflection loops and error retries.
                            </p>
                        </div>

                        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 flex flex-col gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                                <PiDatabaseLight className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-display font-semibold text-white">
                                Isolated Memory Brains
                            </h3>
                            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                                Every tenant receives a dedicated memory sandbox (<code className="text-white font-mono text-[11px]">atman.md</code>, <code className="text-white font-mono text-[11px]">zehn.md</code>) ensuring strict multi-tenant privacy.
                            </p>
                        </div>

                        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 flex flex-col gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                                <PiLockKeyLight className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-display font-semibold text-white">
                                AES-256-GCM Encryption
                            </h3>
                            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                                Google OAuth tokens are encrypted at rest with unique IVs. Plaintext tokens are never stored on disk.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Google Workspace Integration Highlight */}
                <div id="workspace" className="p-8 sm:p-12 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl mb-16">
                    <div className="mb-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white text-xs font-mono mb-3">
                            Google API Services Integration
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-3">
                            Google OAuth & Workspace Capabilities
                        </h2>
                        <p className="text-sm text-zinc-400 max-w-2xl">
                            Brahma requests specific OAuth scopes solely to execute actions requested directly by the user:
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-2">
                            <PiEnvelopeSimpleLight className="w-6 h-6 text-white" />
                            <strong className="text-white text-sm">Gmail Integration</strong>
                            <span className="text-xs text-zinc-400">Summarizing email threads & drafting user-requested replies.</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-2">
                            <PiTableLight className="w-6 h-6 text-white" />
                            <strong className="text-white text-sm">Google Sheets</strong>
                            <span className="text-xs text-zinc-400">Reading spreadsheets and populating structured output rows.</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-2">
                            <PiCalendarLight className="w-6 h-6 text-white" />
                            <strong className="text-white text-sm">Google Calendar</strong>
                            <span className="text-xs text-zinc-400">Retrieving upcoming events and scheduling invitations.</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-2">
                            <PiDatabaseLight className="w-6 h-6 text-white" />
                            <strong className="text-white text-sm">Google Drive</strong>
                            <span className="text-xs text-zinc-400">Fetching document context for task execution.</span>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-xs sm:text-sm text-zinc-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <PiCheckCircleLight className="w-5 h-5 text-white shrink-0" />
                            <span>Brahma adheres strictly to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-white underline hover:text-zinc-300">Google API Services User Data Policy</a>, including Limited Use requirements.</span>
                        </div>
                        <Link to="/privacy" className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-medium whitespace-nowrap hover:bg-white/20 transition-colors">
                            View Policy
                        </Link>
                    </div>
                </div>

                {/* Bottom CTA Card */}
                <div className="p-8 sm:p-12 rounded-3xl bg-white/[0.03] border border-white/10 text-center flex flex-col items-center">
                    <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-3">
                        Ready to launch Brahma?
                    </h2>
                    <p className="text-sm text-zinc-400 max-w-md mb-6">
                        Access your isolated AI runtime session or review our legal compliance documents.
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center">
                        <Link 
                            to="/playground" 
                            className="px-6 py-3 rounded-2xl bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition-all flex items-center gap-2"
                        >
                            <span>Open App</span>
                            <PiArrowRightLight className="w-4 h-4" />
                        </Link>
                        <Link 
                            to="/privacy" 
                            className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-medium text-sm hover:bg-white/10 transition-all"
                        >
                            Privacy Policy
                        </Link>
                        <Link 
                            to="/terms" 
                            className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-medium text-sm hover:bg-white/10 transition-all"
                        >
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full border-t border-white/10 py-8 bg-[#050505] relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
                    <div className="flex items-center gap-2">
                        <img src="/lotus-logo.svg" alt="Brahma Lotus Logo" className="w-4 h-4 object-contain" />
                        <span className="font-display font-semibold text-zinc-300">BRAHMA SYSTEM</span>
                        <span>© 2026 Yuvraj Mishra. All rights reserved.</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/privacy" className="text-white underline hover:text-zinc-300">Privacy Policy</Link>
                        <span className="text-zinc-700">•</span>
                        <Link to="/terms" className="hover:text-zinc-300 transition-colors">Terms of Service</Link>
                        <span className="text-zinc-700">•</span>
                        <a href="https://github.com/TheYuvrajMishra/Brahma" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors flex items-center gap-1"><PiGithubLogoLight /> GitHub</a>
                        <span className="text-zinc-700">•</span>
                        <a href="https://linkedin.com/in/the-yuvraj-mishra" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors flex items-center gap-1"><PiLinkedinLogoLight /> LinkedIn</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};
