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
    PiSparkleLight,
    PiInfoLight
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
                        <span className="font-display font-bold text-lg tracking-wider text-white">
                            Brahma
                        </span>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6 text-xs font-medium">
                        <a href="#purpose" className="text-zinc-300 hover:text-white transition-colors flex items-center gap-1 font-semibold">
                            <PiInfoLight className="w-4 h-4" />
                            <span>App Purpose</span>
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
                    className="flex flex-col items-center text-center max-w-4xl mx-auto mb-14"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-zinc-300 text-xs font-mono mb-6">
                        <PiSparkleLight className="w-4 h-4 text-white" />
                        <span>Application Name: Brahma • Multi-Platform Agentic AI Runtime</span>
                    </div>

                    <h1 className="text-5xl sm:text-7xl lg:text-8xl font-display font-bold tracking-tight text-white mb-6 leading-[1.05]">
                        Brahma
                    </h1>

                    <p className="text-base sm:text-xl text-zinc-300 max-w-3xl leading-relaxed mb-8">
                        Brahma is an intelligent agentic AI runtime built to help users automate productivity tasks, execute cognitive planning, manage personal memory context, and connect securely to Google Workspace services.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <Link 
                            to="/playground" 
                            className="px-6 py-3 rounded-2xl bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition-all active:scale-95 shadow-lg flex items-center gap-2"
                        >
                            <span>Launch Brahma App</span>
                            <PiArrowRightLight className="w-4 h-4" />
                        </Link>
                        <Link 
                            to="/privacy" 
                            className="px-6 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-white font-medium text-sm hover:bg-white/[0.08] transition-all flex items-center gap-2"
                        >
                            <PiShieldCheckLight className="w-4 h-4" />
                            <span>Privacy Policy</span>
                        </Link>
                    </div>
                </motion.div>

                {/* Explicit App Purpose Disclosure (CRITICAL FOR GOOGLE OAUTH VERIFICATION) */}
                <section id="purpose" className="scroll-mt-24 p-8 sm:p-12 rounded-3xl bg-white/[0.03] border border-white/15 backdrop-blur-xl mb-16 shadow-2xl">
                    <div className="max-w-4xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-mono mb-4">
                            <PiInfoLight className="w-4 h-4 text-white" />
                            <span>Google Verification Disclosure — Application Purpose</span>
                        </div>

                        <h2 className="text-2xl sm:text-4xl font-display font-bold text-white mb-4">
                            About Brahma & Purpose Statement
                        </h2>

                        <div className="space-y-4 text-sm sm:text-base text-zinc-300 leading-relaxed">
                            <p>
                                <strong className="text-white">Brahma</strong> is a productivity-focused Multi-Platform Agentic AI Runtime. The core purpose of the Brahma application is to convert high-level user instructions (such as "summarize my emails", "log updates to my spreadsheet", or "schedule a meeting") into structured execution steps and perform them automatically on behalf of the user.
                            </p>
                            
                            <p>
                                To accomplish these user-initiated tasks, Brahma integrates with Google Workspace APIs via Google OAuth. The requested Google API scopes allow Brahma users to perform the following core features:
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-white font-semibold text-base">
                                        <PiEnvelopeSimpleLight className="w-5 h-5 text-white" />
                                        <span>Gmail Integration</span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-zinc-400 leading-normal">
                                        Allows Brahma to read email threads for context summarization and draft or send email responses when explicitly commanded by the user.
                                    </p>
                                </div>

                                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-white font-semibold text-base">
                                        <PiTableLight className="w-5 h-5 text-white" />
                                        <span>Google Sheets Integration</span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-zinc-400 leading-normal">
                                        Allows Brahma to read tabular spreadsheet data and append formatted output rows to user-selected Google Sheets documents.
                                    </p>
                                </div>

                                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-white font-semibold text-base">
                                        <PiCalendarLight className="w-5 h-5 text-white" />
                                        <span>Google Calendar Integration</span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-zinc-400 leading-normal">
                                        Allows Brahma to fetch upcoming calendar events to check availability and create new event invitations upon user request.
                                    </p>
                                </div>

                                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-white font-semibold text-base">
                                        <PiDatabaseLight className="w-5 h-5 text-white" />
                                        <span>Google Drive Integration</span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-zinc-400 leading-normal">
                                        Allows Brahma to search and read relevant document files stored in user's Google Drive for context-aware processing.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <div id="features" className="mb-20">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl sm:text-4xl font-display font-bold text-white mb-3">
                            Brahma Architecture & Security
                        </h2>
                        <p className="text-sm text-zinc-400 max-w-xl mx-auto">
                            Built with multi-tenant sandboxing and military-grade encryption standards.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 flex flex-col gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                                <PiCpuLight className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-display font-semibold text-white">
                                Cognitive Execution DAG
                            </h3>
                            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                                Decomposes user goals into sequential execution steps with real-time reflection and error retries.
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
                                AES-256-GCM Token Security
                            </h3>
                            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                                Google OAuth access and refresh tokens are encrypted at rest with unique initialization vectors.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Google Workspace Integration & Compliance Highlight */}
                <div id="workspace" className="p-8 sm:p-12 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl mb-16">
                    <div className="mb-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white text-xs font-mono mb-3">
                            Google User Data Policy Compliance
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-3">
                            Google API Scopes & Limited Use Disclosure
                        </h2>
                        <p className="text-sm text-zinc-400 max-w-3xl leading-relaxed">
                            Brahma's use and transfer to any other app of information received from Google APIs adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-white underline hover:text-zinc-300">Google API Services User Data Policy</a>, including the Limited Use requirements.
                        </p>
                    </div>

                    <div className="space-y-3 text-xs sm:text-sm text-zinc-300 mb-8">
                        <div className="flex items-start gap-2.5">
                            <PiCheckCircleLight className="w-5 h-5 text-white shrink-0 mt-0.5" />
                            <span><strong className="text-white">Zero Base AI Training:</strong> Google user data is NEVER used to train, retrain, or fine-tune generalized AI or LLM models.</span>
                        </div>
                        <div className="flex items-start gap-2.5">
                            <PiCheckCircleLight className="w-5 h-5 text-white shrink-0 mt-0.5" />
                            <span><strong className="text-white">No Data Sale or Advertising:</strong> Google Workspace user data is never sold, transferred to third parties, or used for serving advertisements.</span>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-xs sm:text-sm text-zinc-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <PiShieldCheckLight className="w-5 h-5 text-white shrink-0" />
                            <span>Read full details in the Brahma Privacy Policy document.</span>
                        </div>
                        <Link to="/privacy" className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs whitespace-nowrap hover:bg-zinc-200 transition-colors">
                            Read Privacy Policy
                        </Link>
                    </div>
                </div>

                {/* Bottom CTA Card */}
                <div className="p-8 sm:p-12 rounded-3xl bg-white/[0.03] border border-white/10 text-center flex flex-col items-center">
                    <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-3">
                        Launch Brahma
                    </h2>
                    <p className="text-sm text-zinc-400 max-w-md mb-6">
                        Access your agent runtime session or review our legal compliance documents.
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center">
                        <Link 
                            to="/playground" 
                            className="px-6 py-3 rounded-2xl bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition-all flex items-center gap-2"
                        >
                            <span>Open Brahma App</span>
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
                        <span className="font-display font-semibold text-zinc-300">Brahma</span>
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
