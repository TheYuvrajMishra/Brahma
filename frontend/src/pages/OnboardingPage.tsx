import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    PiUserLight, 
    PiMapPinLight, 
    PiSparkleLight, 
    PiProhibitLight, 
    PiChatCircleLight,
    PiCheckLight,
    PiArrowRightLight
} from 'react-icons/pi';
import type { UserProfile } from '../types';

interface OnboardingPageProps {
    user: UserProfile;
    onOnboardingComplete: () => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ user, onOnboardingComplete }) => {
    const [step, setStep] = useState<number>(1);

    // Form fields
    const [displayName, setDisplayName] = useState(user.name || '');
    const [role, setRole] = useState('');
    const [location, setLocation] = useState('');
    const [preferredHandle, setPreferredHandle] = useState(user.email || '');
    const [preferences, setPreferences] = useState('');
    const [dislikes, setDislikes] = useState('');
    const [interactionStyle, setInteractionStyle] = useState<'analytical' | 'conversational' | 'executive'>('conversational');

    const [isInitializing, setIsInitializing] = useState(false);
    const [initProgress, setInitProgress] = useState('Seeding Atman soul persona...');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsInitializing(true);
        setError(null);

        // Simulated progress sequence for "Initializing Brahma..."
        const stages = [
            'Seeding Atman soul persona...',
            'Structuring Zehn long-term memory indexes...',
            'Formatting user profile & communication preferences...',
            'Finalizing dedicated brain core files...'
        ];

        let idx = 0;
        const progressTimer = setInterval(() => {
            idx++;
            if (idx < stages.length) {
                setInitProgress(stages[idx]);
            }
        }, 600);

        try {
            const res = await fetch('/api/auth/onboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    displayName: displayName.trim() || user.name,
                    role: role.trim(),
                    location: location.trim(),
                    preferredHandle: preferredHandle.trim() || user.email,
                    preferences: preferences.trim(),
                    dislikes: dislikes.trim(),
                    interactionStyle
                })
            });

            const data = await res.json();
            clearInterval(progressTimer);

            if (data.success) {
                setTimeout(() => {
                    onOnboardingComplete();
                }, 800);
            } else {
                setError(data.error || 'Failed to complete onboarding.');
                setIsInitializing(false);
            }
        } catch (err: any) {
            clearInterval(progressTimer);
            console.error('Onboarding failed:', err);
            setError('Error initializing Brahma brain. Please try again.');
            setIsInitializing(false);
        }
    };

    if (isInitializing) {
        return (
            <div className="min-h-screen w-full bg-[#09090b] text-white flex flex-col items-center justify-center relative overflow-hidden font-sans">
                <div className="noise-overlay" />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center text-center max-w-sm px-6"
                >
                    <div className="relative w-20 h-20 mb-8 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center shadow-[0_0_30px_#10b981]">
                            <PiSparkleLight className="w-6 h-6 text-emerald-400 animate-pulse" />
                        </div>
                    </div>

                    <h2 className="text-xl font-display font-semibold tracking-wider text-white mb-2">
                        Initializing Brahma...
                    </h2>
                    <p className="text-xs font-mono text-emerald-400 h-6">
                        {initProgress}
                    </p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-[#09090b] text-white flex flex-col items-center justify-center relative overflow-hidden font-sans py-12 px-4">
            <div className="noise-overlay" />

            <div className="w-full max-w-xl">
                {/* Step indicator */}
                <div className="flex items-center justify-between mb-8 px-2">
                    <div>
                        <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase">
                            BRAHMA ONBOARDING • STEP {step} OF 5
                        </span>
                        <h1 className="text-xl font-display font-semibold text-white mt-1">
                            {step === 1 && 'Basic Profile Details'}
                            {step === 2 && 'Contact & Location Info'}
                            {step === 3 && 'Tools & Preferences'}
                            {step === 4 && 'Dislikes & Constraints'}
                            {step === 5 && 'Interaction & Tone Style'}
                        </h1>
                    </div>

                    {/* Dots */}
                    <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map(s => (
                            <div 
                                key={s} 
                                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                                    s === step 
                                        ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' 
                                        : s < step 
                                            ? 'bg-emerald-500/40' 
                                            : 'bg-white/10'
                                }`} 
                            />
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-2xl shadow-2xl flex flex-col gap-6"
                    >
                        {error && (
                            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/20 text-red-400 text-xs font-mono">
                                {error}
                            </div>
                        )}

                        {/* STEP 1: Profile */}
                        {step === 1 && (
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-2">
                                        <PiUserLight className="w-4 h-4 text-emerald-400" />
                                        <span>Display Name / What should Brahma call you?</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        value={displayName}
                                        onChange={e => setDisplayName(e.target.value)}
                                        placeholder="e.g. Alex, Yuvraj, Sarah"
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-all"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                                        Primary Role / Occupation
                                    </label>
                                    <input 
                                        type="text" 
                                        value={role}
                                        onChange={e => setRole(e.target.value)}
                                        placeholder="e.g. Senior Software Engineer, Product Manager, Founder"
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        {/* STEP 2: Contact Details (NO PHONE NUMBER) */}
                        {step === 2 && (
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-2">
                                        <PiMapPinLight className="w-4 h-4 text-emerald-400" />
                                        <span>Location / Timezone</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        value={location}
                                        onChange={e => setLocation(e.target.value)}
                                        placeholder="e.g. San Francisco, CA (PST) / New Delhi (IST)"
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                                        Preferred Communication Handle / Email
                                    </label>
                                    <input 
                                        type="text" 
                                        value={preferredHandle}
                                        onChange={e => setPreferredHandle(e.target.value)}
                                        placeholder="e.g. alex@company.com or @alexdev"
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-all"
                                    />
                                    <p className="text-[10px] text-zinc-500 mt-1">
                                        * Note: Phone numbers are excluded for privacy & security.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: Preferences */}
                        {step === 3 && (
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-2">
                                        <PiSparkleLight className="w-4 h-4 text-emerald-400" />
                                        <span>Preferences, Frequent Tools & Stack</span>
                                    </label>
                                    <textarea 
                                        rows={4}
                                        value={preferences}
                                        onChange={e => setPreferences(e.target.value)}
                                        placeholder="List tools you use often (TypeScript, React, Google Sheets, Gmail), topics you care about, or project contexts..."
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
                                    />
                                </div>
                            </div>
                        )}

                        {/* STEP 4: Dislikes */}
                        {step === 4 && (
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-2">
                                        <PiProhibitLight className="w-4 h-4 text-red-400" />
                                        <span>Dislikes & Things to Avoid</span>
                                    </label>
                                    <textarea 
                                        rows={4}
                                        value={dislikes}
                                        onChange={e => setDislikes(e.target.value)}
                                        placeholder="What should Brahma avoid? (e.g. corporate jargon, overly lengthy preambles, unsolicited code refactors...)"
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
                                    />
                                </div>
                            </div>
                        )}

                        {/* STEP 5: Multiple-Choice Question (Confirmed Wording) */}
                        {step === 5 && (
                            <div className="flex flex-col gap-4">
                                <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-2">
                                    <PiChatCircleLight className="w-4 h-4 text-emerald-400" />
                                    <span>How would you like Brahma to interact with you?</span>
                                </label>

                                <div className="flex flex-col gap-3 mt-1">
                                    {[
                                        {
                                            id: 'analytical',
                                            title: '1) Analytical & Concise',
                                            desc: 'Direct, code-first, data-dense responses with minimal conversational filler.'
                                        },
                                        {
                                            id: 'conversational',
                                            title: '2) Conversational & Adaptive',
                                            desc: 'Collaborative, detailed explanations with Hinglish/tone warmth and active context updates.'
                                        },
                                        {
                                            id: 'executive',
                                            title: '3) Executive Summarizer',
                                            desc: 'High-level bullet points, action items, key takeaways, and minimal fluff.'
                                        }
                                    ].map(opt => (
                                        <div
                                            key={opt.id}
                                            onClick={() => setInteractionStyle(opt.id as any)}
                                            className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 flex items-start gap-3 ${
                                                interactionStyle === opt.id
                                                    ? 'bg-emerald-500/10 border-emerald-500/50 text-white shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                                                    : 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                                            }`}
                                        >
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 ${
                                                interactionStyle === opt.id
                                                    ? 'border-emerald-400 bg-emerald-400 text-black'
                                                    : 'border-zinc-600'
                                            }`}>
                                                {interactionStyle === opt.id && <PiCheckLight className="w-3.5 h-3.5 stroke-[3]" />}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-semibold text-white tracking-wide">
                                                    {opt.title}
                                                </span>
                                                <span className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                                                    {opt.desc}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-2">
                            {step > 1 ? (
                                <button
                                    type="button"
                                    onClick={() => setStep(step - 1)}
                                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-zinc-400 hover:text-white transition-all"
                                >
                                    Back
                                </button>
                            ) : <div />}

                            {step < 5 ? (
                                <button
                                    type="button"
                                    onClick={() => setStep(step + 1)}
                                    className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-[0.98] border border-white/10 text-xs font-semibold text-white flex items-center gap-2 transition-all cursor-pointer"
                                >
                                    <span>Next Step</span>
                                    <PiArrowRightLight className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs tracking-wide shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2"
                                >
                                    <span>Initialize Brahma</span>
                                    <PiSparkleLight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </motion.div>
                </form>
            </div>
        </div>
    );
};
