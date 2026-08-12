import React, { useState } from 'react';
import { PiCaretDownLight, PiCaretRightLight, PiClockLight, PiCheckCircleLight } from 'react-icons/pi';
import type { TelemetryStep } from '../types';

interface ProcessTelemetryAccordionProps {
    telemetry: TelemetryStep[];
    isLive?: boolean;
    defaultExpanded?: boolean;
}

const parseDetailsData = (details: unknown): unknown => {
    if (!details) return null;
    if (typeof details === 'object') return details;
    if (typeof details === 'string') {
        const trimmed = details.trim();
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
            try {
                return JSON.parse(trimmed);
            } catch {
                return details;
            }
        }
    }
    return details;
};

const FormattedTelemetryDetails: React.FC<{ details: unknown }> = ({ details }) => {
    const [showRaw, setShowRaw] = useState(false);
    const parsed = parseDetailsData(details);

    if (!parsed) return null;

    const renderKeyValuePills = (obj: Record<string, unknown>) => {
        const entries = Object.entries(obj).filter(([k, v]) => v !== undefined && v !== null && k !== '_dependency_context');
        if (entries.length === 0) return null;

        return (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
                {entries.map(([key, val]) => {
                    const isLong = typeof val === 'string' && val.length > 50;
                    const displayVal = typeof val === 'object' 
                        ? JSON.stringify(val) 
                        : isLong ? `${val.substring(0, 50)}...` : String(val);

                    return (
                        <div key={key} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.07] text-[11px] font-mono text-zinc-300">
                            <span className="text-zinc-500 font-sans font-medium text-[10px] uppercase tracking-wider">{key}:</span>
                            <span className="text-zinc-200 truncate max-w-[240px]" title={String(val)}>{displayVal}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    // Case 1: Array of DAG Plan Steps
    if (Array.isArray(parsed)) {
        return (
            <div className="mt-1.5 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                    <span>Execution Plan ({parsed.length} Steps)</span>
                    <button
                        type="button"
                        onClick={() => setShowRaw(!showRaw)}
                        className="hover:text-zinc-300 transition-colors cursor-pointer"
                    >
                        {showRaw ? 'Hide Raw' : 'Raw JSON'}
                    </button>
                </div>

                {showRaw ? (
                    <pre className="p-2.5 rounded-xl bg-zinc-950/80 border border-white/10 text-[10px] text-zinc-300 overflow-x-auto whitespace-pre-wrap font-mono max-h-48">
                        {JSON.stringify(parsed, null, 2)}
                    </pre>
                ) : (
                    <div className="space-y-1.5">
                        {(parsed as Record<string, unknown>[]).map((stepItem: Record<string, unknown>, idx: number) => (
                            <div key={idx} className="p-2 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px] font-semibold">
                                            Step {String(stepItem.step || idx + 1)}
                                        </span>
                                        <span className="text-[11px] font-medium text-zinc-200">
                                            {String(stepItem.action || stepItem.tool || '')}
                                        </span>
                                    </div>
                                    {Boolean(stepItem.tool) && (
                                        <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono text-[10px]">
                                            {String(stepItem.tool)}
                                        </span>
                                    )}
                                </div>
                                {Boolean(stepItem.params) && renderKeyValuePills(stepItem.params as Record<string, unknown>)}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Case 2: Structured Object
    if (typeof parsed === 'object' && parsed !== null) {
        const obj = parsed as Record<string, unknown>;
        const hasTool = obj.tool || obj.intent || obj.action;
        return (
            <div className="mt-1.5 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                    <span>Step Parameters</span>
                    <button
                        type="button"
                        onClick={() => setShowRaw(!showRaw)}
                        className="hover:text-zinc-300 transition-colors cursor-pointer"
                    >
                        {showRaw ? 'Hide Raw' : 'Raw JSON'}
                    </button>
                </div>

                {showRaw ? (
                    <pre className="p-2.5 rounded-xl bg-zinc-950/80 border border-white/10 text-[10px] text-zinc-300 overflow-x-auto whitespace-pre-wrap font-mono max-h-48">
                        {JSON.stringify(parsed, null, 2)}
                    </pre>
                ) : (
                    <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                        {Boolean(hasTool) && (
                            <div className="flex items-center gap-2">
                                {Boolean(obj.tool) && (
                                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono text-[10px] font-medium">
                                        Tool: {String(obj.tool)}
                                    </span>
                                )}
                                {Boolean(obj.intent) && (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px] font-medium">
                                        Intent: {String(obj.intent)}
                                    </span>
                                )}
                                {Boolean(obj.status) && (
                                    <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-medium ${
                                        obj.status === 'success' 
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    }`}>
                                        {String(obj.status)}
                                    </span>
                                )}
                            </div>
                        )}
                        {obj.params ? renderKeyValuePills(obj.params as Record<string, unknown>) : renderKeyValuePills(obj)}
                    </div>
                )}
            </div>
        );
    }

    // Case 3: Plain Text / String
    return (
        <div className="mt-1.5 p-2 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap max-h-44 overflow-y-auto select-text">
            {String(parsed)}
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

    const getFavicon = (step: TelemetryStep) => {
        const detailsObj = step.details && typeof step.details === 'object' ? (step.details as Record<string, string>) : null;
        return step.favicon || detailsObj?.favicon;
    };

    const getUrl = (step: TelemetryStep) => {
        const detailsObj = step.details && typeof step.details === 'object' ? (step.details as Record<string, string>) : null;
        return step.url || detailsObj?.url;
    };

    const activeFavicon = activeStep ? getFavicon(activeStep) : null;

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
                        activeFavicon ? (
                            <img src={activeFavicon} className="w-3.5 h-3.5 rounded shrink-0 object-contain" alt="" />
                        ) : (
                            <PiClockLight className="w-3.5 h-3.5 text-zinc-300 animate-spin shrink-0" />
                        )
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
                        <div key={activeStep?.id} className="space-y-1.5 animate-fadeIn">
                            <div className="flex items-center gap-2 text-zinc-200 font-medium">
                                {activeFavicon ? (
                                    <img src={activeFavicon} className="w-3.5 h-3.5 rounded shrink-0 object-contain" alt="" />
                                ) : (
                                    <PiClockLight className="w-3.5 h-3.5 text-zinc-400" />
                                )}
                                <span>{activeStep?.stage}</span>
                            </div>
                            <div className="text-zinc-300 text-[11px] leading-relaxed font-mono pl-5 flex items-center gap-2 flex-wrap">
                                <span>{activeStep?.label}</span>
                                {getUrl(activeStep) && (
                                    <a
                                        href={getUrl(activeStep)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-emerald-400 border border-white/10 transition-colors text-[10px]"
                                    >
                                        {activeFavicon && <img src={activeFavicon} className="w-3 h-3 rounded" alt="" />}
                                        <span className="truncate max-w-[200px]">{activeStep.domain || getUrl(activeStep)}</span>
                                    </a>
                                )}
                            </div>

                            {Boolean(activeStep?.details) && (
                                <div className="pl-5 pt-1">
                                    <FormattedTelemetryDetails details={activeStep.details} />
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Completed Full Thought Timeline */
                        <div className="space-y-3.5 py-1">
                            {telemetry.map((step, idx) => {
                                const favicon = getFavicon(step);
                                const url = getUrl(step);
                                return (
                                    <div key={step.id || idx} className="space-y-1">
                                        <div className="flex items-center gap-2 text-zinc-300 font-medium text-[12px]">
                                            {favicon ? (
                                                <img src={favicon} className="w-3.5 h-3.5 rounded shrink-0 object-contain" alt="" />
                                            ) : (
                                                <PiClockLight className="w-3.5 h-3.5 text-zinc-400" />
                                            )}
                                            <span>{step.stage}</span>
                                        </div>
                                        
                                        <div className="text-zinc-400 text-[11px] leading-relaxed font-mono pl-5 flex items-center gap-2 flex-wrap">
                                            <span>{step.label}</span>
                                            {url && (
                                                <a
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-emerald-400 border border-white/10 transition-colors text-[10px]"
                                                >
                                                    {favicon && <img src={favicon} className="w-3 h-3 rounded" alt="" />}
                                                    <span className="truncate max-w-[200px]">{step.domain || url}</span>
                                                </a>
                                            )}
                                        </div>

                                        {Boolean(step.details) && (
                                            <div className="pl-5 pt-1">
                                                <FormattedTelemetryDetails details={step.details} />
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
