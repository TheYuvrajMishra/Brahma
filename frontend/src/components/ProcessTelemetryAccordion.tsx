import React, { useState } from 'react';
import { 
    PiCaretDownLight, 
    PiCaretRightLight, 
    PiClockLight, 
    PiCheckCircleLight,
    PiGlobeLight
} from 'react-icons/pi';
import type { TelemetryStep, WebLinkItem } from '../types';

interface ProcessTelemetryAccordionProps {
    telemetry: TelemetryStep[];
    isLive?: boolean;
    defaultExpanded?: boolean;
}

const WebLinksTable: React.FC<{ links: WebLinkItem[] }> = ({ links }) => {
    if (!links || links.length === 0) return null;

    return (
        <div className="my-2 border border-white/10 rounded-lg overflow-hidden bg-zinc-950/70 backdrop-blur-sm divide-y divide-white/5 max-w-xl shadow-lg">
            {links.map((link, idx) => {
                const isVisiting = link.status === 'visiting';
                const isCompleted = link.status === 'completed';

                return (
                    <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center justify-between gap-3 px-3 py-1.5 hover:bg-white/5 transition-colors group text-[11px] select-none ${
                            isVisiting ? 'bg-emerald-500/10' : ''
                        }`}
                    >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {/* Favicon with Circular Spinner Ring */}
                            <div className="relative flex items-center justify-center shrink-0 w-4 h-4">
                                {isVisiting && (
                                    <span className="absolute -inset-1 rounded-full border border-emerald-400 border-t-transparent animate-spin" />
                                )}
                                {link.favicon ? (
                                    <img src={link.favicon} className="w-3.5 h-3.5 rounded-sm object-contain relative z-10" alt="" />
                                ) : (
                                    <PiGlobeLight className="w-3.5 h-3.5 text-zinc-500 relative z-10" />
                                )}
                            </div>

                            {/* Article Title */}
                            <span className={`truncate font-sans ${
                                isVisiting 
                                    ? 'text-emerald-300 font-medium' 
                                    : 'text-zinc-300 group-hover:text-white font-normal'
                            }`}>
                                {link.title || link.domain}
                            </span>
                        </div>

                        {/* Domain Tag & Status Icon */}
                        <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-mono text-zinc-500 group-hover:text-zinc-300">
                                {link.domain}
                            </span>
                            {isVisiting && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            )}
                            {isCompleted && (
                                <PiCheckCircleLight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            )}
                        </div>
                    </a>
                );
            })}
        </div>
    );
};

export const ProcessTelemetryAccordion: React.FC<ProcessTelemetryAccordionProps> = ({
    telemetry,
    isLive = false,
    defaultExpanded = false
}) => {
    const [expanded, setExpanded] = useState(defaultExpanded);

    if (!telemetry || telemetry.length === 0) return null;

    const activeStep = telemetry[telemetry.length - 1];

    const getStepLinks = (step?: TelemetryStep): WebLinkItem[] | null => {
        if (!step) return null;
        if (step.links && Array.isArray(step.links)) return step.links;
        if (step.details && Array.isArray(step.details.links)) return step.details.links;
        return null;
    };

    const activeLinks = getStepLinks(activeStep);

    return (
        <div className="w-full my-1.5 text-xs font-sans">
            {/* Minimalist Single Line Pill */}
            <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="group inline-flex items-center gap-2 py-1 px-2.5 text-zinc-400 hover:text-zinc-200 transition-colors rounded-md hover:bg-white/[0.04] select-none cursor-pointer border border-transparent hover:border-white/5"
            >
                <div className="text-zinc-500 group-hover:text-zinc-300 transition-colors">
                    {expanded ? <PiCaretDownLight className="w-3 h-3 transition-transform duration-200" /> : <PiCaretRightLight className="w-3 h-3 transition-transform duration-200" />}
                </div>

                <div className="flex items-center gap-2 overflow-hidden">
                    {isLive ? (
                        <PiClockLight className="w-3.5 h-3.5 text-emerald-400 animate-spin shrink-0" />
                    ) : (
                        <PiCheckCircleLight className="w-3.5 h-3.5 text-white shrink-0" />
                    )}
                    
                    {/* Animated Step Label */}
                    <span 
                        key={isLive ? activeStep?.id || activeStep?.label : 'completed'} 
                        className="font-normal text-[13px] text-zinc-300 tracking-tight animate-fadeIn transition-all duration-300 truncate max-w-lg"
                    >
                        {isLive 
                            ? `Thinking... ${activeStep?.label || ''}` 
                            : 'Done'
                        }
                    </span>
                </div>
            </button>

            {/* Expanded Reasoning Output Block */}
            {expanded && (
                <div className="mt-2 ml-2 pl-3.5 border-l border-zinc-800/80 space-y-3 text-[12px] text-zinc-400 font-sans max-w-2xl animate-fadeIn transition-all duration-300">
                    {isLive ? (
                        /* Live Single Active Step View */
                        <div key={activeStep?.id} className="space-y-2 animate-fadeIn">
                            <div className="flex items-center gap-2 text-zinc-200 font-medium">
                                <PiClockLight className="w-3.5 h-3.5 text-emerald-400" />
                                <span>{activeStep?.stage}</span>
                            </div>
                            
                            <p className="text-zinc-300 text-[11px] leading-relaxed font-mono pl-5">
                                {activeStep?.label}
                            </p>

                            {/* Render Tabular Web Links Table if links are present */}
                            {activeLinks && activeLinks.length > 0 ? (
                                <div className="pl-5 pt-0.5">
                                    <WebLinksTable links={activeLinks} />
                                </div>
                            ) : activeStep?.details && typeof activeStep.details === 'string' ? (
                                <div className="pl-5 pt-1">
                                    <p className="text-[11px] text-zinc-400 font-mono">
                                        {activeStep.details}
                                    </p>
                                </div>
                            ) : null}
                        </div>
                    ) : (
                        /* Completed Full Thought Timeline */
                        <div className="space-y-3.5 py-1">
                            {telemetry.map((step, idx) => {
                                const stepLinks = getStepLinks(step);
                                return (
                                    <div key={step.id || idx} className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-zinc-300 font-medium text-[12px]">
                                            <PiClockLight className="w-3.5 h-3.5 text-zinc-400" />
                                            <span>{step.stage}</span>
                                        </div>
                                        
                                        <p className="text-zinc-400 text-[11px] leading-relaxed font-mono pl-5">
                                            {step.label}
                                        </p>

                                        {stepLinks && stepLinks.length > 0 && (
                                            <div className="pl-5 pt-0.5">
                                                <WebLinksTable links={stepLinks} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
