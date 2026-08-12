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
    PiCpuLight,
    PiEnvelopeSimpleLight,
    PiGithubLogoLight,
    PiLinkedinLogoLight,
    PiArrowSquareOutLight
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
        { id: 'governing-law', title: '10. Governing Law & Developer Info' },
    ];

    return (
        <div className="min-h-screen w-full bg-[#050505] text-zinc-300 font-sans selection:bg-white/20 selection:text-white relative">
            {/* SVG Noise Overlay */}
            <svg style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0, pointerEvents: 'none' }} xmlns="http://www.w3.org/2000/svg">
                <filter id="noiseFilterTerms">
                    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/>
                </filter>
            </svg>
            <div className="noise-overlay" />

            {/* Fixed Top Navigation Header */}
            <header className="fixed top-0 left-0 right-0 z-50 w-full bg-[#050505]/95 backdrop-blur-xl border-b border-white/10 h-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
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
                            <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                                <PiTerminalLight className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-display font-semibold text-sm tracking-wider text-white">
                                BRAHMA
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-zinc-300 uppercase tracking-widest hidden sm:inline-block">
                                Legal
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <Link 
                            to="/terms" 
                            className="text-xs font-medium text-white px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 transition-colors flex items-center gap-1.5"
                        >
                            <PiFileTextLight className="w-4 h-4 text-white" />
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
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 relative z-10">
                {/* Hero Title Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mb-10 border-b border-white/10 pb-8 text-center sm:text-left"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 text-zinc-400 text-xs font-mono mb-4">
                        Effective Date: August 12, 2026
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight text-white mb-3">
                        Terms of Service
                    </h1>
                    <p className="text-sm sm:text-base text-zinc-400 max-w-3xl leading-relaxed">
                        Please read these Terms of Service carefully before accessing or using the Brahma Agentic AI Runtime platform. By accessing or using Brahma, you agree to be bound by these terms.
                    </p>
                </motion.div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
                    {/* Left Table of Contents Navigation (Sticky after scrolling down) */}
                    <div className="hidden lg:block lg:col-span-3 sticky top-24 self-start z-30">
                        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl shadow-2xl">
                            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase tracking-widest mb-4 pb-2 border-b border-white/5">
                                <PiListBulletsLight className="w-4 h-4 text-white" />
                                <span>Navigation</span>
                            </div>
                            <nav className="flex flex-col gap-1 max-h-[calc(100vh-160px)] overflow-y-auto pr-1">
                                {sections.map(sec => (
                                    <button
                                        key={sec.id}
                                        onClick={() => scrollToSection(sec.id)}
                                        className={`text-left text-xs py-2 px-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                                            activeSection === sec.id
                                                ? 'bg-white/10 border border-white/20 text-white font-medium'
                                                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                                        }`}
                                    >
                                        {sec.title}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Mobile Navigation Bar */}
                    <div className="block lg:hidden p-4 rounded-2xl bg-white/[0.02] border border-white/10 mb-2">
                        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase tracking-widest mb-3 pb-2 border-b border-white/5">
                            <PiListBulletsLight className="w-4 h-4 text-white" />
                            <span>Navigation</span>
                        </div>
                        <nav className="flex flex-wrap gap-1.5">
                            {sections.map(sec => (
                                <button
                                    key={sec.id}
                                    onClick={() => scrollToSection(sec.id)}
                                    className={`text-left text-[11px] py-1.5 px-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
                                        activeSection === sec.id
                                            ? 'bg-white/10 border border-white/20 text-white font-medium'
                                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                                    }`}
                                >
                                    {sec.title}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Right Detailed Terms Content Column */}
                    <div className="lg:col-span-9 flex flex-col gap-10">
                        {/* 1. Acceptance of Terms */}
                        <section id="acceptance" className="scroll-mt-24 p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white">
                                    <PiGavelLight className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-display font-semibold text-white">
                                    1. Acceptance of Terms
                                </h2>
                            </div>
                            <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
                                <p>
                                    These Terms of Service ("Terms") constitute a legally binding agreement made between you ("User", "you") and Brahma ("we", "us", "our"), created and maintained by Yuvraj Mishra, concerning your access to and use of the Brahma web platform, API endpoints, agent execution runtime, and connected integrations.
                                </p>
                                <p>
                                    By logging into Brahma via Google OAuth or using any portion of our service, you acknowledge that you have read, understood, and agreed to be bound by all of these Terms. If you do not agree with all of these Terms, you are explicitly prohibited from using the platform.
                                </p>
                            </div>
                        </section>

                        {/* 2. Description of Service */}
                        <section id="description" className="scroll-mt-24 p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white">
                                    <PiCpuLight className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-display font-semibold text-white">
                                    2. Description of Service
                                </h2>
                            </div>
                            <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
                                <p>
                                    Brahma is a state-of-the-art multi-tenant, multi-platform agentic AI runtime. The service provides execution sandboxing, cognitive memory management (<code className="text-white font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/10">atman.md</code>, <code className="text-white font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/10">zehn.md</code>), intent routing, real-time reflection, and automated tool integrations (such as Gmail, Google Sheets, Google Calendar, Google Drive, and Discord).
                                </p>
                                <p>
                                    We reserve the right to update, modify, or enhance features of the platform at any time to improve efficiency, security, or compliance.
                                </p>
                            </div>
                        </section>

                        {/* 3. User Accounts & Google OAuth */}
                        <section id="user-accounts" className="scroll-mt-24 p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white">
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
                        <section id="acceptable-use" className="scroll-mt-24 p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white">
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
                        <section id="agent-execution" className="scroll-mt-24 p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/15 backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white">
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
                        <section id="intellectual-property" className="scroll-mt-24 p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white">
                                    <PiFileTextLight className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-display font-semibold text-white">
                                    6. Intellectual Property & Content Ownership
                                </h2>
                            </div>
                            <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
                                <p>
                                    <strong className="text-white">Your Data Ownership:</strong> You retain full ownership of all prompts, document inputs, memory context (<code className="text-white font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/10">atman.md</code>, <code className="text-white font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/10">zehn.md</code>), and Google Workspace data accessed by Brahma.
                                </p>
                                <p>
                                    <strong className="text-white">Platform Ownership:</strong> Brahma, its source code, architecture, pipeline design, UI elements, and trademarks remain the exclusive intellectual property of Brahma and its creator Yuvraj Mishra.
                                </p>
                            </div>
                        </section>

                        {/* 7. Disclaimer of Warranties */}
                        <section id="warranties" className="scroll-mt-24 p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white">
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
                        <section id="limitation" className="scroll-mt-24 p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white">
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
                        <section id="termination" className="scroll-mt-24 p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white">
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
                        <section id="governing-law" className="scroll-mt-24 p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white">
                                    <PiTerminalLight className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-display font-semibold text-white">
                                    10. Governing Law & Developer Verification Details
                                </h2>
                            </div>
                            <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
                                <p>
                                    These Terms shall be governed by and construed in accordance with applicable laws without regard to conflict of law principles.
                                </p>
                                <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 text-xs sm:text-sm text-zinc-300 space-y-2.5">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                        <span className="text-white font-semibold">Primary Developer & Creator</span>
                                        <span className="font-mono text-xs text-zinc-400">Yuvraj Mishra</span>
                                    </div>
                                    <div className="flex flex-col gap-2 pt-1 text-xs">
                                        <div className="flex items-center gap-2">
                                            <PiEnvelopeSimpleLight className="w-4 h-4 text-white shrink-0" />
                                            <strong className="text-white min-w-[110px]">Official Contact:</strong>
                                            <a href="mailto:yuvraj17mishra11@gmail.com" className="text-white underline hover:text-zinc-300">yuvraj17mishra11@gmail.com</a>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <PiGithubLogoLight className="w-4 h-4 text-white shrink-0" />
                                            <strong className="text-white min-w-[110px]">GitHub Repository:</strong>
                                            <a href="https://github.com/TheYuvrajMishra/Brahma" target="_blank" rel="noopener noreferrer" className="text-white underline hover:text-zinc-300 inline-flex items-center gap-1">github.com/TheYuvrajMishra/Brahma <PiArrowSquareOutLight className="w-3 h-3" /></a>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <PiGithubLogoLight className="w-4 h-4 text-white shrink-0" />
                                            <strong className="text-white min-w-[110px]">GitHub Profile:</strong>
                                            <a href="https://github.com/TheYuvrajMishra" target="_blank" rel="noopener noreferrer" className="text-white underline hover:text-zinc-300 inline-flex items-center gap-1">github.com/TheYuvrajMishra <PiArrowSquareOutLight className="w-3 h-3" /></a>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <PiLinkedinLogoLight className="w-4 h-4 text-white shrink-0" />
                                            <strong className="text-white min-w-[110px]">LinkedIn Profile:</strong>
                                            <a href="https://linkedin.com/in/the-yuvraj-mishra" target="_blank" rel="noopener noreferrer" className="text-white underline hover:text-zinc-300 inline-flex items-center gap-1">linkedin.com/in/the-yuvraj-mishra <PiArrowSquareOutLight className="w-3 h-3" /></a>
                                        </div>
                                    </div>
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
                        <PiTerminalLight className="w-4 h-4 text-white" />
                        <span className="font-display font-semibold text-zinc-300">BRAHMA SYSTEM</span>
                        <span>© 2026 Yuvraj Mishra. All rights reserved.</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/privacy" className="hover:text-zinc-300 transition-colors">Privacy Policy</Link>
                        <span className="text-zinc-700">•</span>
                        <Link to="/terms" className="text-white underline">Terms of Service</Link>
                        <span className="text-zinc-700">•</span>
                        <a href="https://github.com/TheYuvrajMishra/Brahma" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors">GitHub</a>
                        <span className="text-zinc-700">•</span>
                        <a href="https://linkedin.com/in/the-yuvraj-mishra" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors">LinkedIn</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};
