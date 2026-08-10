import React, { useState } from 'react';
import { 
    PiCaretDownLight, 
    PiCaretRightLight, 
    PiClockLight, 
    PiCheckCircleLight, 
    PiGlobeLight,
    PiArrowUpRightLight,
    PiCheckLight
} from 'react-icons/pi';
import type { TelemetryStep } from '../types';

interface ProcessTelemetryAccordionProps {
    telemetry: TelemetryStep[];
    isLive?: boolean;
    defaultExpanded?: boolean;
}

const FaviconWithSpinner: React.FC<{ 
    faviconUrl?: string; 
    domain?: string; 
    url?: string; 
    isLoading?: boolean;
}> = ({ faviconUrl, domain, url, isLoading }) => {
    const [imgError, setImgError] = useState(false);

    let cleanDomain = domain || '';
    if (!cleanDomain && url) {
        try {
            cleanDomain = new URL(url).hostname.replace(/^www\./, '');
        } catch {
            cleanDomain = '';
        }
    }

    const src = faviconUrl || (cleanDomain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(cleanDomain)}&sz=32` : '');

    return (
        <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
            {isLoading && (
                <div className="absolute -inset-0.5 rounded-full border-2 border-emerald-400/20 border-t-emerald-400 animate-spin" />
            )}
            {src && !imgError ? (
                <img 
                    src={src} 
                    onError={() => setImgError(true)}
                    className="w-3.5 h-3.5 rounded object-contain relative z-10" 
                    alt="" 
                />
            ) : (
                <PiGlobeLight className="w-3.5 h-3.5 text-zinc-400 relative z-10" />
            )}
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

    // Filter web research steps (steps with URL, domain, or research stage)
    const researchSteps = telemetry.filter(step => 
        step.url || 
        step.domain || 
        (step.details && (step.details.url || step.details.domain)) ||
        step.event === 'LIVE_RESEARCH_PROGRESS' ||
        step.stage.toLowerCase().includes('research') ||
        step.stage.toLowerCase().includes('search')
    );

    const activeStep = telemetry[telemetry.length - 1];
    const activeResearchStep = researchSteps.length > 0 ? researchSteps[researchSteps.length - 1] : null;

    const hasResearchLinks = researchSteps.length > 0;

    return (
        <div className="w-full my-2 text-xs font-sans select-none">
            {/* Minimalist Header Pill */}
            <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="group inline-flex items-center gap-2 py-1.5 px-3 text-zinc-300 hover:text-white transition-colors rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-white/10 shadow-sm cursor-pointer"
            >
                <div className="text-zinc-500 group-hover:text-zinc-300 transition-colors">
                    {expanded ? (
                        <PiCaretDownLight className="w-3 h-3 transition-transform duration-200" />
                    ) : (
                        <PiCaretRightLight className="w-3 h-3 transition-transform duration-200" />
                    )}
                </div>

                <div className="flex items-center gap-2 overflow-hidden">
                    {isLive ? (
                        activeResearchStep ? (
                            <FaviconWithSpinner 
                                faviconUrl={activeResearchStep.favicon} 
                                domain={activeResearchStep.domain} 
                                url={activeResearchStep.url}
                                isLoading={true} 
                            />
                        ) : (
                            <PiClockLight className="w-3.5 h-3.5 text-zinc-300 animate-spin shrink-0" />
                        )
                    ) : (
                        <PiCheckCircleLight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                    
                    {/* Header Label */}
                    <span className="font-medium text-[12px] text-zinc-200 tracking-tight truncate max-w-md">
                        {isLive ? (
                            activeResearchStep ? (
                                `Visiting ${activeResearchStep.domain || activeResearchStep.title || 'sources'}...`
                            ) : (
                                `Thinking... ${activeStep?.label || ''}`
                            )
                        ) : (
                            hasResearchLinks ? `Searched ${researchSteps.length} web sources` : 'Thought process complete'
                        )}
                    </span>
                </div>
            </button>

            {/* Expanded Content View */}
            {expanded && (
                <div className="mt-2.5 max-w-xl animate-fadeIn transition-all duration-300">
                    {hasResearchLinks ? (
                        /* Compact Tabular Web Research Links List */
                        <div className="rounded-xl bg-[#09090b]/90 border border-white/10 overflow-hidden divide-y divide-white/5 shadow-xl backdrop-blur-md">
                            <div className="px-3.5 py-2 bg-white/[0.02] flex items-center justify-between text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                                <span>Web Source & Article Title</span>
                                <span>Domain</span>
                            </div>

                            {researchSteps.map((step, idx) => {
                                const isLast = idx === researchSteps.length - 1;
                                const isCurrent = isLive && isLast;

                                const rawUrl = step.url || (step.details && step.details.url);
                                const rawDomain = step.domain || (step.details && step.details.domain) || (rawUrl ? new URL(rawUrl).hostname.replace(/^www\./, '') : 'web');
                                const rawTitle = step.title || (step.details && step.details.title) || step.label || rawDomain;
                                const rawFavicon = step.favicon || (step.details && step.details.favicon);

                                // Clean title formatting (strip raw JSON prefix if present)
                                let displayTitle = typeof rawTitle === 'string' ? rawTitle : rawDomain;
                                displayTitle = displayTitle.replace(/^Visiting article \(\d+\/\d+\):\s*/i, '').trim();

                                return (
                                    <a
                                        key={step.id || idx}
                                        href={rawUrl || '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`flex items-center justify-between gap-3 px-3.5 py-2.5 text-[11px] transition-all hover:bg-white/[0.06] group ${isCurrent ? 'bg-emerald-500/[0.05]' : ''}`}
                                    >
                                        {/* Left Side: Spinner + Favicon + Clean Title */}
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <FaviconWithSpinner 
                                                faviconUrl={rawFavicon} 
                                                domain={rawDomain} 
                                                url={rawUrl}
                                                isLoading={isCurrent} 
                                            />
                                            
                                            <span className="font-normal text-zinc-200 truncate group-hover:text-white transition-colors leading-tight">
                                                {displayTitle}
                                            </span>
                                        </div>

                                        {/* Right Side: Domain Pill + Status Indicator */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-zinc-400 font-mono group-hover:border-white/20 group-hover:text-zinc-300 transition-all">
                                                {rawDomain}
                                            </span>
                                            
                                            {isCurrent ? (
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                            ) : (
                                                <PiArrowUpRightLight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors" />
                                            )}
                                        </div>
                                    </a>
                                );
                            })}
                        </div>
                    ) : (
                        /* Standard Timeline View for Non-Search Events */
                        <div className="pl-3.5 border-l border-zinc-800 space-y-2.5 py-1 text-[11px] text-zinc-400 font-mono">
                            {telemetry.map((step, idx) => (
                                <div key={step.id || idx} className="flex items-center gap-2">
                                    <PiCheckLight className="w-3 h-3 text-emerald-400 shrink-0" />
                                    <span className="text-zinc-300">{step.stage}:</span>
                                    <span className="text-zinc-400 truncate">{step.label}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
