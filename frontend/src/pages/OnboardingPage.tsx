import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    PiUserLight, 
    PiMapPinLight, 
    PiSlidersHorizontalLight, 
    PiChatCircleLight,
    PiCheckLight,
    PiArrowRightLight,
    PiCopyLight
} from 'react-icons/pi';
import type { UserProfile } from '../types';

interface OnboardingPageProps {
    user: UserProfile;
    onOnboardingComplete: () => void;
}

const DEFAULT_EXTRACTION_PROMPT = `Please analyze my background, working style, tech stack, preferences, and things I dislike. Write a clean, self-contained summary covering:
- Key tools, programming languages, and tech stack I use frequently.
- My preferred working style, interaction expectations, and communication preferences.
- Things I dislike, friction points, and output patterns to avoid.

CRITICAL INSTRUCTIONS:
- Word Limit: 100 to 200 words maximum.
- Format: Write as flowing paragraphs only. Do NOT use bullet points, numbered lists, or markdown headings.`;

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ user, onOnboardingComplete }) => {
    const [step, setStep] = useState<number>(1);

    // Form fields
    const [displayName, setDisplayName] = useState(user.name || '');
    const [role, setRole] = useState('');
    const [location, setLocation] = useState('');
    const [preferredHandle, setPreferredHandle] = useState(user.email || '');
    const [preferences, setPreferences] = useState('');
    const [interactionStyle, setInteractionStyle] = useState<'analytical' | 'conversational' | 'executive'>('conversational');

    const [copiedPrompt, setCopiedPrompt] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCopyPrompt = () => {
        navigator.clipboard.writeText(DEFAULT_EXTRACTION_PROMPT);
        setCopiedPrompt(true);
        setTimeout(() => setCopiedPrompt(false), 2000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsInitializing(true);
        setError(null);

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
                    dislikes: '',
                    interactionStyle
                })
            });

            const data = await res.json();

            if (data.success) {
                setTimeout(() => {
                    onOnboardingComplete();
                }, 600);
            } else {
                setError(data.error || 'Failed to complete onboarding.');
                setIsInitializing(false);
            }
        } catch (err: any) {
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
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-3 px-6 py-4"
                >
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span className="text-sm font-medium tracking-wide text-white">
                        Initializing Brahma...
                    </span>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-[#09090b] text-white flex flex-col items-center justify-center relative overflow-hidden font-sans py-12 px-4">
            <div className="noise-overlay" />

            <div className="w-full max-w-xl">
                {/* Header & Step dots */}
                <div className="flex items-center justify-between mb-6 px-1">
                    <h1 className="text-xl font-display font-semibold text-white">
                        {step === 1 && 'Basic Profile Details'}
                        {step === 2 && 'Contact & Location Info'}
                        {step === 3 && 'Profile & Preferences'}
                        {step === 4 && 'Interaction & Tone Style'}
                    </h1>

                    {/* Minimalist White Dots */}
                    <div className="flex items-center gap-2">
                        {[1, 2, 3, 4].map(s => (
                            <div 
                                key={s} 
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                    s === step 
                                        ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]' 
                                        : 'bg-white/20'
                                }`} 
                            />
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
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
                                        <PiUserLight className="w-4 h-4 text-white" />
                                        <span>Display Name / What should Brahma call you?</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        value={displayName}
                                        onChange={e => setDisplayName(e.target.value)}
                                        placeholder="e.g. Alex, Yuvraj, Sarah"
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-all"
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
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        {/* STEP 2: Contact Details */}
                        {step === 2 && (
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-2">
                                        <PiMapPinLight className="w-4 h-4 text-white" />
                                        <span>Location / Timezone</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        value={location}
                                        onChange={e => setLocation(e.target.value)}
                                        placeholder="e.g. San Francisco, CA (PST) / New Delhi (IST)"
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-all"
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
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-all"
                                    />
                                    <p className="text-[10px] text-zinc-500 mt-1">
                                        * Note: Phone numbers are excluded for privacy & security.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: Combined Profile, Preferences & LLM Output Extraction */}
                        {step === 3 && (
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-2">
                                        <PiSlidersHorizontalLight className="w-4 h-4 text-white" />
                                        <span>Profile, Tools, Stack & Dislikes</span>
                                    </label>
                                    <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
                                        You can copy the prompt below into ChatGPT or Claude to extract your full profile, stack, working preferences, and dislikes, then paste the response into the box.
                                    </p>

                                    {/* Prompt Copy Card */}
                                    <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col gap-2.5 mb-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                                                LLM Profile Extraction Prompt
                                            </span>
                                            <button
                                                type="button"
                                                onClick={handleCopyPrompt}
                                                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-[11px] font-medium text-white flex items-center gap-1.5 transition-all cursor-pointer"
                                            >
                                                {copiedPrompt ? (
                                                    <>
                                                        <PiCheckLight className="w-3.5 h-3.5" />
                                                        <span>Copied!</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <PiCopyLight className="w-3.5 h-3.5" />
                                                        <span>Copy Prompt</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        <pre className="text-[11px] font-mono text-zinc-300 bg-black/40 p-3 rounded-xl whitespace-pre-wrap border border-white/5 max-h-28 overflow-y-auto">
                                            {DEFAULT_EXTRACTION_PROMPT}
                                        </pre>
                                    </div>

                                    {/* Textarea for pasted / typed preferences */}
                                    <textarea 
                                        rows={5}
                                        value={preferences}
                                        onChange={e => setPreferences(e.target.value)}
                                        placeholder="Paste output from ChatGPT/Claude here, or list your tools, stack, preferences, and things to avoid directly..."
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-all resize-none font-sans"
                                    />
                                </div>
                            </div>
                        )}

                        {/* STEP 4: Multiple-Choice Interaction Style */}
                        {step === 4 && (
                            <div className="flex flex-col gap-4">
                                <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-2">
                                    <PiChatCircleLight className="w-4 h-4 text-white" />
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
                                                    ? 'bg-white/10 border-white/30 text-white'
                                                    : 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                                            }`}
                                        >
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 ${
                                                interactionStyle === opt.id
                                                    ? 'border-white bg-white text-black'
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
                                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-zinc-400 hover:text-white transition-all cursor-pointer"
                                >
                                    Back
                                </button>
                            ) : <div />}

                            {step < 4 ? (
                                <button
                                    type="button"
                                    onClick={() => setStep(step + 1)}
                                    className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-[0.98] border border-white/20 text-xs font-semibold text-white flex items-center gap-2 transition-all cursor-pointer"
                                >
                                    <span>Next Step</span>
                                    <PiArrowRightLight className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs tracking-wide active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2 shadow-md"
                                >
                                    <span>Initialize Brahma</span>
                                </button>
                            )}
                        </div>
                    </motion.div>
                </form>
            </div>
        </div>
    );
};
