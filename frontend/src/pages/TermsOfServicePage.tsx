import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    PiFileTextLight, 
    PiTerminalLight, 
    PiArrowLeftLight, 
    PiShieldCheckLight,
    PiGavelLight, 
    PiScalesLight, 
    PiWarningCircleLight,
    PiListBulletsLight,
    PiUserCheckLight,
    PiCpuLight
} from 'react-icons/pi';

export const TermsOfServicePage: React.FC = () => {
    const [activeSection, setActiveSection] = useState<string>('acceptance');

    const scrollToSection = (id: string) => {
        setActiveSection(id);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const sections = [
        { id: 'acceptance', title: '1. Acceptance of Terms' },
        { id: 'description', title: '2. Description of Service' },
        { id: 'user-accounts', title: '3. Accounts & Google OAuth' },
        { id: 'acceptable-use', title: '4. Acceptable Use Policy' },
        { id: 'agent-execution', title: '5. Automated Agent Actions' },
        { id: 'intellectual-property', title: '6. Ownership & IP' },
        { id: 'warranties', title: '7. Disclaimer of Warranties' },
        { id: 'limitation', title: '8. Limitation of Liability' },
        { id: 'termination', title: '9. Termination & Purge' },
        { id: 'governing-law', title: '10. Governing Law & Contact' },
    ];

    return (
        <div className="min-h-screen w-full bg-[#050505] text-zinc-200 font-sans selection:bg-emerald-500/20 selection:text-emerald-300 relative overflow-x-hidden">
            {/* SVG Noise Overlay */}
            <svg style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0, pointerEvents: 'none' }} xmlns="http://www.w3.org/2000/svg">
                <filter id="noiseFilterTerms">
                    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/>
                </filter>
            </svg>
            <div className="noise-overlay" />

            {/* Ambient Background Glow */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-emerald-500/5 blur-[140px] pointer-events-none rounded-full" />

            {/* Top Navigation Header */}
            <header className="sticky top-0 z-50 w-full bg-[#050505]/80 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link 
                            to="/playground" 
                            className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all duration-200"
                        >
                            <PiArrowLeftLight className="w-4 h-4" />
                            <span>Return to App</span>
                        </Link>
                        <div className="h-4 w-px bg-white/10 hidden sm:block" />
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                <PiTerminalLight className="w-4 h-4 text-emerald-400" />
                            </div>
                            <span className="font-display font-semibold text-sm tracking-wider text-white">
                                BRAHMA
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase tracking-widest hidden sm:inline-block">
                                Legal
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <Link 
                            to="/terms" 
                            className="text-xs font-medium text-emerald-400 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 transition-colors flex items-center gap-1.5"
                        >
                            <PiFileTextLight className="w-4 h-4" />
                            <span>Terms of Service</span>
                        </Link>
                        <Link 
                            to="/privacy" 
                            className="text-xs font-medium text-zinc-400 hover:text-white px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors flex items-center gap-1.5"
                        >
                            <PiShieldCheckLight className="w-4 h-4" />
                            <span>Privacy Policy</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content Layout */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
                {/* Hero Title Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mb-12 text-center sm:text-left border-b border-white/10 pb-8"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 text-emerald-400 text-xs font-mono mb-4">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Effective Date: August 12, 2026
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight text-white mb-3">
                        Terms of Service
                    </h1>
                    <p className="text-sm sm:text-base text-zinc-400 max-w-3xl leading-relaxed">
                        Please read these Terms of Service carefully before accessing or using the Brahma Agentic AI Runtime platform. By accessing or using Brahma, you agree to be bound by these terms.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Sticky Navigation Sidebar */}
                    <div className="lg:col-span-3">
                        <div className="sticky top-24 p-5 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase tracking-widest mb-4 pb-2 border-b border-white/5">
                                <PiListBulletsLight className="w-4 h-4 text-emerald-400" />
                                <span>Navigation</span>
                            </div>
                            <nav className="flex flex-col gap-1">
                                {sections.map(sec => (
                                    <button
                                        key={sec.id}
                                        onClick={() => scrollToSection(sec.id)}
                                        className={`text-left text-xs py-2 px-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                                            activeSection === sec.id
                                                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium'
                                                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                                        }`}
                                    >
                                        {sec.title}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Right Detailed Terms Content */}
                    <div className="lg:col-span-9 flex flex-col gap-10">
                        {/* 1. Acceptance of Terms */}
                        <section id="acceptance" className="p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                    <PiGavelLight className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-display font-semibold text-white">
                                    1. Acceptance of Terms
                                </h2>
                            </div>
                            <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
                                <p>
                                    These Terms of Service ("Terms") constitute a legally binding agreement made between you ("User", "you") and Brahma ("we", "us", "our"), concerning your access to and use of the Brahma web platform, API endpoints, agent execution runtime, and connected integrations.
                                </p>
                                <p>
                                    By logging into Brahma via Google OAuth or using any portion of our service, you acknowledge that you have read, understood, and agreed to be bound by all of these Terms. If you do not agree with all of these Terms, you are explicitly prohibited from using the platform.
                                </p>
                            </div>
                        </section>

                        {/* 2. Description of Service */}
                        <section id="description" className="p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                    <PiCpuLight className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-display font-semibold text-white">
                                    2. Description of Service
                                </h2>
                            </div>
                            <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
                                <p>
                                    Brahma is a state-of-the-art multi-tenant, multi-platform agentic AI runtime. The service provides execution sandboxing, cognitive memory management (<code className="text-emerald-400 font-mono">atman.md</code>, <code className="text-emerald-400 font-mono">zehn.md</code>), intent routing, real-time reflection, and automated tool integrations (such as Gmail, Google Sheets, Google Calendar, Google Drive, and Discord).
                                </p>
                                <p>
                                    We reserve the right to update, modify, or enhance features of the platform at any time to improve efficiency, security, or compliance.
                                </p>
                            </div>
                        </section>

                        {/* 3. User Accounts & Google OAuth */}
                        <section id="user-accounts" className="p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                    <PiUserCheckLight className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-display font-semibold text-white">
                                    3. Account Registration & Google OAuth Authorization
                                </h2>
                            </div>
                            <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
                                <p>
                                    To access Brahma, you must authenticate using your Google Account. By authenticating and granting OAuth permissions:
                                </p>
                                <ul className="list-disc pl-5 space-y-2 text-zinc-400">
                                    <li>You confirm that you are at least 13 years of age (or the minimum legal age in your jurisdiction).</li>
                                    <li>You authorize Brahma to access requested Google APIs (Gmail, Sheets, Calendar, Drive) solely for executing actions initiated by you or your automated pipeline tasks.</li>
                                    <li>You remain solely responsible for maintaining the confidentiality of your Google login credentials and session cookies.</li>
                                </ul>
                            </div>
                        </section>

                        {/* 4. Acceptable Use Policy */}
                        <section id="acceptable-use" className="p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                    <PiScalesLight className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-display font-semibold text-white">
                                    4. Acceptable Use & Prohibited Conduct
                                </h2>
                            </div>
                            <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
                                <p>
                                    You agree not to use Brahma for any unlawful purpose or in any way that violates these Terms. Prohibited activities include:
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-zinc-300">
                                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                                        <strong className="text-white block mb-1">Unsolicited Messaging / Spam</strong>
                                        Using Brahma email tools to send bulk unsolicited emails or phishing content.
                                    </div>
                                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                                        <strong className="text-white block mb-1">System Abuse & Reverse Engineering</strong>
                                        Attempting to bypass multi-tenant isolation, inject malicious prompts, or exploit API endpoints.
                                    </div>
                                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                                        <strong className="text-white block mb-1">Illegal or Harmful Tasks</strong>
                                        Commanding agents to perform illegal data exfiltration, malware distribution, or harassment.
                                    </div>
                                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                                        <strong className="text-white block mb-1">Rate Limit Violations</strong>
                                        Interfering with service availability or overloading underlying AI inference APIs.
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 5. Automated Agent Execution & User Responsibility */}
                        <section id="agent-execution" className="p-6 sm:p-8 rounded-3xl bg-amber-950/20 border border-amber-500/30 backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300">
                                    <PiWarningCircleLight className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-display font-semibold text-white">
                                    5. Automated AI Execution & User Verification Notice
                                </h2>
                            </div>
                            <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
                                <p>
                                    Brahma executes actions autonomously or semi-autonomously based on your prompt inputs and agent DAG plans. You acknowledge and agree that:
                                </p>
                                <ul className="list-disc pl-5 space-y-2 text-zinc-300 text-xs sm:text-sm">
                                    <li><strong className="text-white">Reviewing Critical Actions:</strong> You are responsible for overseeing agent actions that modify external systems (e.g. sending emails to external parties, altering Google Sheets, or modifying calendar entries).</li>
                                    <li><strong className="text-white">AI Response Output:</strong> AI model responses may occasionally contain inaccuracies, hallucinations, or formatting variances. Critical data decisions should be verified independently.</li>
                                </ul>
                            </div>
                        </section>

                        {/* 6. Intellectual Property & User Data Ownership */}
                        <section id="intellectual-property" className="p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                    <PiFileTextLight className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-display font-semibold text-white">
                                    6. Intellectual Property & Content Ownership
                                </h2>
                            </div>
                            <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
                                <p>
                                    <strong className="text-white">Your Data Ownership:</strong> You retain full ownership of all prompts, document inputs, memory context (<code className="text-emerald-400 font-mono">atman.md</code>, <code className="text-emerald-400 font-mono">zehn.md</code>), and Google Workspace data accessed by Brahma.
                                </p>
                                <p>
                                    <strong className="text-white">Platform Ownership:</strong> Brahma, its source code, architecture, pipeline design, UI elements, and trademarks remain the exclusive intellectual property of Brahma and its creator Yuvraj Mishra.
                                </p>
                            </div>
                        </section>

                        {/* 7. Disclaimer of Warranties */}
                        <section id="warranties" className="p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                    <PiScalesLight className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-display font-semibold text-white">
                                    7. Disclaimer of Warranties
                                </h2>
                            </div>
                            <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
                                <p className="uppercase text-xs font-mono tracking-wider text-zinc-400">
                                    THE PLATFORM IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
                                </p>
                            </div>
                        </section>

                        {/* 8. Limitation of Liability */}
                        <section id="limitation" className="p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                    <PiGavelLight className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-display font-semibold text-white">
                                    8. Limitation of Liability
                                </h2>
                            </div>
                            <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
                                <p>
                                    To the maximum extent permitted by applicable law, in no event shall Brahma or its developers be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, loss of data, or operational interruptions resulting from your use of the service.
                                </p>
                            </div>
                        </section>

                        {/* 9. Termination & Purge */}
                        <section id="termination" className="p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                    <PiUserCheckLight className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-display font-semibold text-white">
                                    9. Termination & Account Data Purge
                                </h2>
                            </div>
                            <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
                                <p>
                                    You may stop using Brahma at any time and purge all your stored context and encrypted tokens using the in-app reset tools. Brahma reserves the right to suspend or terminate access for users who violate these Terms.
                                </p>
                            </div>
                        </section>

                        {/* 10. Governing Law & Contact */}
                        <section id="governing-law" className="p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                    <PiTerminalLight className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-display font-semibold text-white">
                                    10. Governing Law & Contact Information
                                </h2>
                            </div>
                            <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
                                <p>
                                    These Terms shall be governed by and construed in accordance with applicable laws without regard to conflict of law principles.
                                </p>
                                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-xs sm:text-sm text-zinc-400">
                                    <p className="text-white font-medium mb-1">Legal Inquiries:</p>
                                    <p>Developer: Yuvraj Mishra</p>
                                    <p>Email: <a href="mailto:support@brahma.ai" className="text-emerald-400 underline">support@brahma.ai</a> / <a href="mailto:yuvraj@brahma.ai" className="text-emerald-400 underline">yuvraj@brahma.ai</a></p>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full border-t border-white/10 py-8 bg-[#050505] relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
                    <div className="flex items-center gap-2">
                        <PiTerminalLight className="w-4 h-4 text-emerald-400" />
                        <span className="font-display font-semibold text-zinc-300">BRAHMA SYSTEM</span>
                        <span>© 2026 Yuvraj Mishra. All rights reserved.</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/privacy" className="hover:text-zinc-300 transition-colors">Privacy Policy</Link>
                        <span className="text-zinc-700">•</span>
                        <Link to="/terms" className="text-emerald-400 hover:underline">Terms of Service</Link>
                        <span className="text-zinc-700">•</span>
                        <Link to="/playground" className="hover:text-zinc-300 transition-colors">Playground</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};
