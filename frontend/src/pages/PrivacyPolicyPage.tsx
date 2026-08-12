import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    PiShieldCheckLight, 
    PiTerminalLight, 
    PiArrowLeftLight, 
    PiLockKeyLight, 
    PiDatabaseLight, 
    PiEnvelopeSimpleLight, 
    PiCheckCircleLight,
    PiFileTextLight,
    PiArrowSquareOutLight,
    PiKeyLight,
    PiListBulletsLight
} from 'react-icons/pi';

export const PrivacyPolicyPage: React.FC = () => {
    const [activeSection, setActiveSection] = useState<string>('overview');

    const scrollToSection = (id: string) => {
        setActiveSection(id);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const sections = [
        { id: 'overview', title: '1. Executive Overview' },
        { id: 'data-collection', title: '2. Information We Collect' },
        { id: 'google-data-usage', title: '3. Google User Data & Limited Use' },
        { id: 'ai-model-policy', title: '4. AI Model & LLM Policy' },
        { id: 'security-encryption', title: '5. Encryption & Multi-Tenant Security' },
        { id: 'data-retention', title: '6. Retention & Account Purge' },
        { id: 'third-party', title: '7. Sub-processors & Services' },
        { id: 'user-rights', title: '8. Your Rights & Choice' },
        { id: 'contact', title: '9. Contact & Updates' },
    ];

    return (
        <div className="min-h-screen w-full bg-[#050505] text-zinc-200 font-sans selection:bg-emerald-500/20 selection:text-emerald-300 relative overflow-x-hidden">
            {/* SVG Noise Overlay */}
            <svg style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0, pointerEvents: 'none' }} xmlns="http://www.w3.org/2000/svg">
                <filter id="noiseFilterPrivacy">
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
                            className="text-xs font-medium text-zinc-400 hover:text-white px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors flex items-center gap-1.5"
                        >
                            <PiFileTextLight className="w-4 h-4" />
                            <span>Terms of Service</span>
                        </Link>
                        <Link 
                            to="/privacy" 
                            className="text-xs font-medium text-emerald-400 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 transition-colors flex items-center gap-1.5"
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
                        Google OAuth Verification Compliant • Last Updated: August 12, 2026
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight text-white mb-3">
                        Privacy Policy
                    </h1>
                    <p className="text-sm sm:text-base text-zinc-400 max-w-3xl leading-relaxed">
                        This Privacy Policy describes how Brahma ("we", "us", "our") collects, uses, stores, and protects user data when you interact with the Brahma Multi-Platform Agentic AI Runtime, including connected Google Workspace services.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Sticky Table of Contents Sidebar */}
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

                    {/* Right Detailed Policy Content */}
                    <div className="lg:col-span-9 flex flex-col gap-10">
                        {/* 1. Executive Overview */}
                        <section id="overview" className="p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                    <PiShieldCheckLight className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-display font-semibold text-white">
                                    1. Executive Overview
                                </h2>
                            </div>
                            <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
                                <p>
                                    Brahma is a multi-tenant, multi-platform agentic AI runtime designed to perform automated intent processing, cognitive planning, and task execution for users. To deliver seamless automation (such as drafting emails, creating calendar events, and updating spreadsheets), Brahma integrates with third-party identity providers, notably Google OAuth.
                                </p>
                                <p>
                                    We treat user data privacy and authorization security with the utmost care. We do not sell your personal data, we do not monetize email content, and we enforce strict AES-256-GCM encryption and multi-tenant sandboxing to ensure your information remains isolated to your account.
                                </p>
                            </div>
                        </section>

                        {/* 2. Information We Collect */}
                        <section id="data-collection" className="p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                    <PiDatabaseLight className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-display font-semibold text-white">
                                    2. Information We Collect
                                </h2>
                            </div>
                            <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
                                <p>
                                    We collect only the minimum required data necessary to authenticate your account and execute user-authorized agentic tasks:
                                </p>
                                <ul className="list-disc pl-5 space-y-2 text-zinc-400">
                                    <li>
                                        <strong className="text-white">Account Identification:</strong> When signing in with Google, we receive your Google User ID, primary email address, display name, and avatar URL via the <code className="text-emerald-400 font-mono text-xs">userinfo.email</code> and <code className="text-emerald-400 font-mono text-xs">userinfo.profile</code> OAuth scopes.
                                    </li>
                                    <li>
                                        <strong className="text-white">User-Provided Onboarding Context:</strong> Profile details (e.g. role, interaction preferences, communication guidelines) provided during account initialization to configure your personalized AI agent persona (<code className="text-emerald-400 font-mono text-xs">atman.md</code> and <code className="text-emerald-400 font-mono text-xs">zehn.md</code>).
                                    </li>
                                    <li>
                                        <strong className="text-white">Google Workspace Data (User-Authorized Scopes):</strong> When explicitly enabled, Brahma accesses Google Workspace services on your behalf to run tools requested in your chat or workflow commands:
                                        <ul className="list-circle pl-5 mt-1.5 space-y-1 text-xs">
                                            <li><strong className="text-zinc-200">Gmail (<code className="text-emerald-400 font-mono">https://mail.google.com/</code>):</strong> Reads email threads for contextual summarization and constructs/sends emails when explicitly commanded by the user.</li>
                                            <li><strong className="text-zinc-200">Google Sheets (<code className="text-emerald-400 font-mono">.../auth/spreadsheets</code>):</strong> Reads and writes tabular data to user-specified spreadsheets.</li>
                                            <li><strong className="text-zinc-200">Google Calendar (<code className="text-emerald-400 font-mono">.../auth/calendar</code>):</strong> Fetches upcoming schedules and creates event invitations.</li>
                                            <li><strong className="text-zinc-200">Google Drive (<code className="text-emerald-400 font-mono">.../auth/drive</code>):</strong> Searches and reads user files referenced in execution prompts.</li>
                                        </ul>
                                    </li>
                                    <li>
                                        <strong className="text-white">System Audit & Telemetry Logs:</strong> Session interaction history, plan execution DAGs, tool timing, and diagnostic logs generated during active chat sessions.
                                    </li>
                                </ul>
                            </div>
                        </section>

                        {/* 3. Google User Data & Limited Use Disclosure (CRITICAL FOR GOOGLE OAUTH VERIFICATION) */}
                        <section id="google-data-usage" className="p-6 sm:p-8 rounded-3xl bg-emerald-950/20 border border-emerald-500/30 backdrop-blur-xl relative overflow-hidden">
                            <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                                    <PiKeyLight className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-display font-semibold text-white">
                                    3. Google User Data & Limited Use Requirement
                                </h2>
                            </div>
                            
                            <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/30 mb-5">
                                <p className="text-sm font-medium text-emerald-300 leading-relaxed">
                                    Brahma's use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-1 font-semibold hover:text-white">Google API Services User Data Policy <PiArrowSquareOutLight className="w-3.5 h-3.5" /></a>, including the Limited Use requirements.
                                </p>
                            </div>

                            <div className="space-y-3 text-sm text-zinc-300 leading-relaxed">
                                <p className="font-semibold text-white">Specific Commitments Regarding Google User Data:</p>
                                <ul className="space-y-2.5 text-xs sm:text-sm text-zinc-300">
                                    <li className="flex items-start gap-2.5">
                                        <PiCheckCircleLight className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                                        <span><strong className="text-white">Strict Purpose Limitation:</strong> Google user data accessed by Brahma is strictly used to provide or improve user-facing features that are prominent in the requesting application's user interface.</span>
                                    </li>
                                    <li className="flex items-start gap-2.5">
                                        <PiCheckCircleLight className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                                        <span><strong className="text-white">No Transfer to Third Parties:</strong> We do not transfer, sell, or disclose Google user data to third parties, advertising networks, or data brokers under any circumstances, unless required by law or during a corporate merger/acquisition with explicit user notice.</span>
                                    </li>
                                    <li className="flex items-start gap-2.5">
                                        <PiCheckCircleLight className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                                        <span><strong className="text-white">No Advertising or Monetization:</strong> Google Workspace user data (including email content, messages, files, and calendar entries) is never used for serving advertisements, target marketing, or commercial retargeting.</span>
                                    </li>
                                    <li className="flex items-start gap-2.5">
                                        <PiCheckCircleLight className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                                        <span><strong className="text-white">Human Inspection Restrictions:</strong> Human employees or contractors are strictly prohibited from reading user Google data, except: (a) if the user provides explicit consent for troubleshooting a specific bug, (b) for security investigation of system abuse, or (c) as required by applicable law.</span>
                                    </li>
                                </ul>
                            </div>
                        </section>

                        {/* 4. AI Model & LLM Policy */}
                        <section id="ai-model-policy" className="p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                    <PiTerminalLight className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-display font-semibold text-white">
                                    4. AI Model & LLM Data Protection Policy
                                </h2>
                            </div>
                            <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
                                <p>
                                    As an agentic AI runtime, Brahma interacts with Large Language Models (LLMs) to reason, plan, and format execution steps.
                                </p>
                                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-xs sm:text-sm text-zinc-300 space-y-2">
                                    <p className="font-semibold text-emerald-400">Our Guarantee on AI Training:</p>
                                    <p>
                                        <strong className="text-white">Zero Base Model Training on Google User Data:</strong> Data obtained through Google OAuth APIs (including Gmail emails, Google Sheets data, and Google Drive files) is <span className="text-white underline">NEVER</span> used to train, retrain, fine-tune, or improve generalized foundation AI/LLM models.
                                    </p>
                                    <p>
                                        All API calls to LLM provider inference endpoints are governed by enterprise zero-data-retention agreements where prompt context is processed statelessly in memory during request execution and discarded immediately thereafter.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* 5. Encryption & Multi-Tenant Security */}
                        <section id="security-encryption" className="p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                    <PiLockKeyLight className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-display font-semibold text-white">
                                    5. Encryption & Multi-Tenant Isolation
                                </h2>
                            </div>
                            <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
                                <p>
                                    Brahma implements rigorous defense-in-depth security mechanisms to protect credentials and tenant data:
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-2">
                                        <div className="font-mono text-emerald-400 font-semibold uppercase tracking-wider text-[11px]">
                                            AES-256-GCM Token Encryption
                                        </div>
                                        <p className="text-zinc-400 leading-normal">
                                            Google OAuth access and refresh tokens are encrypted at rest in MongoDB using AES-256-GCM encryption with unique initialization vectors (IVs) and authentication tags. Plaintext tokens are never written to disk.
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-2">
                                        <div className="font-mono text-emerald-400 font-semibold uppercase tracking-wider text-[11px]">
                                            Multi-Tenant Partitioning
                                        </div>
                                        <p className="text-zinc-400 leading-normal">
                                            Every user account receives an isolated cognitive brain environment (<code className="text-zinc-200">/users/:userId/core/*</code>). Cross-tenant data access is strictly blocked at the file-system and API layer.
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-2">
                                        <div className="font-mono text-emerald-400 font-semibold uppercase tracking-wider text-[11px]">
                                            HMAC Session Security
                                        </div>
                                        <p className="text-zinc-400 leading-normal">
                                            Browser sessions are authenticated via HTTP-only, SameSite HMAC-signed session cookies (<code className="text-zinc-200">brahma_session</code>) to protect against CSRF and credential theft.
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-2">
                                        <div className="font-mono text-emerald-400 font-semibold uppercase tracking-wider text-[11px]">
                                            In-Transit Protection
                                        </div>
                                        <p className="text-zinc-400 leading-normal">
                                            All network communications between the browser client, Brahma services, and Google APIs enforce TLS 1.3 encryption.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 6. Retention & Account Purge */}
                        <section id="data-retention" className="p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                    <PiEnvelopeSimpleLight className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-display font-semibold text-white">
                                    6. Data Retention, Revocation & Account Purge
                                </h2>
                            </div>
                            <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
                                <p>
                                    We maintain your data only for as long as your Brahma account remains active:
                                </p>
                                <ul className="list-disc pl-5 space-y-2 text-zinc-400">
                                    <li>
                                        <strong className="text-white">In-App Reset & Data Erasure:</strong> You may at any time trigger a complete purge of your long-term memory, session logs, persona profiles, and encrypted tokens by clicking <span className="text-red-400 font-mono text-xs">Reset Brain & Setup</span> in the Brahma application sidebar.
                                    </li>
                                    <li>
                                        <strong className="text-white">Revoking Google OAuth Access:</strong> You can revoke Brahma's access to your Google Account at any time directly through your <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline hover:text-white">Google Security Account Permissions <PiArrowSquareOutLight className="w-3 h-3 inline" /></a>. Upon revocation, Brahma immediately loses the ability to interact with your Google Workspace.
                                    </li>
                                </ul>
                            </div>
                        </section>

                        {/* 7. Sub-processors & Services */}
                        <section id="third-party" className="p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                    <PiFileTextLight className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-display font-semibold text-white">
                                    7. Sub-processors & Service Integrations
                                </h2>
                            </div>
                            <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
                                <p>
                                    Brahma utilizes trusted sub-processors and external APIs solely to maintain backend functionality:
                                </p>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left border-collapse border border-white/10 rounded-xl overflow-hidden">
                                        <thead>
                                            <tr className="bg-white/5 text-white font-display">
                                                <th className="p-3 border-b border-r border-white/10">Entity</th>
                                                <th className="p-3 border-b border-r border-white/10">Purpose</th>
                                                <th className="p-3 border-b border-white/10">Location / Data Safeguards</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 text-zinc-400">
                                            <tr>
                                                <td className="p-3 border-r border-white/5 font-semibold text-white">Google Cloud APIs</td>
                                                <td className="p-3 border-r border-white/5">OAuth Authentication, Gmail, Sheets, Calendar & Drive Tools</td>
                                                <td className="p-3">United States / TLS Encrypted, Google User Data Policy Compliant</td>
                                            </tr>
                                            <tr>
                                                <td className="p-3 border-r border-white/5 font-semibold text-white">MongoDB Inc.</td>
                                                <td className="p-3 border-r border-white/5">Encrypted User Account & Metadata Storage</td>
                                                <td className="p-3">AES-256-GCM Encrypted at Rest</td>
                                            </tr>
                                            <tr>
                                                <td className="p-3 border-r border-white/5 font-semibold text-white">LLM Provider Infrastructure</td>
                                                <td className="p-3 border-r border-white/5">Stateless Intent Processing & Code Execution Formatting</td>
                                                <td className="p-3">Zero-Data Retention Agreements, No AI Model Training</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>

                        {/* 8. Your Rights */}
                        <section id="user-rights" className="p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                    <PiShieldCheckLight className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-display font-semibold text-white">
                                    8. Your Privacy Rights (GDPR & CCPA)
                                </h2>
                            </div>
                            <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
                                <p>
                                    Depending on your jurisdiction, you possess rights regarding your personal data, including the right to access, rectify, export, restrict processing, or request deletion of your information. Because Brahma stores user brain context in transparent Markdown files (<code className="text-emerald-400 font-mono">atman.md</code>, <code className="text-emerald-400 font-mono">zehn.md</code>), you maintain direct visibility and editing control over your stored memory at any time via the Context Core screen.
                                </p>
                            </div>
                        </section>

                        {/* 9. Contact & Updates */}
                        <section id="contact" className="p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                    <PiEnvelopeSimpleLight className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-display font-semibold text-white">
                                    9. Contact Us & Policy Modifications
                                </h2>
                            </div>
                            <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
                                <p>
                                    We may update this Privacy Policy from time to time to reflect system updates or legal modifications. Any revisions will be published on this page with an updated "Last Updated" timestamp.
                                </p>
                                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-xs sm:text-sm text-zinc-400">
                                    <p className="text-white font-medium mb-1">Privacy & Security Inquiries:</p>
                                    <p>Developer & Maintainer: Yuvraj Mishra</p>
                                    <p>Email: <a href="mailto:privacy@brahma.ai" className="text-emerald-400 underline">privacy@brahma.ai</a> / <a href="mailto:yuvraj@brahma.ai" className="text-emerald-400 underline">yuvraj@brahma.ai</a></p>
                                    <p>System Repository: <span className="font-mono text-zinc-300">Brahma Agentic AI Runtime</span></p>
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
                        <Link to="/privacy" className="text-emerald-400 hover:underline">Privacy Policy</Link>
                        <span className="text-zinc-700">•</span>
                        <Link to="/terms" className="hover:text-zinc-300 transition-colors">Terms of Service</Link>
                        <span className="text-zinc-700">•</span>
                        <Link to="/playground" className="hover:text-zinc-300 transition-colors">Playground</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};
