import React, { useState } from 'react';
import { PiCaretDownLight, PiCaretRightLight, PiSparkleLight, PiCheckCircleLight } from 'react-icons/pi';
import type { TelemetryStep } from '../types';

interface ProcessTelemetryAccordionProps {
    telemetry: TelemetryStep[];
    isLive?: boolean;
    defaultExpanded?: boolean;
}

export const ProcessTelemetryAccordion: React.FC<ProcessTelemetryAccordionProps> = ({
    telemetry,
    isLive = false,
    defaultExpanded = false
}) => {
    const [expanded, setExpanded] = useState(defaultExpanded);

    if (!telemetry || telemetry.length === 0) return null;

    const firstTime = telemetry[0]?.timestamp ? new Date(telemetry[0].timestamp).getTime() : Date.now();
    const lastTime = telemetry[telemetry.length - 1]?.timestamp ? new Date(telemetry[telemetry.length - 1].timestamp).getTime() : Date.now();
    const durationSec = Math.max(1, Math.round((lastTime - firstTime) / 1000));

    const activeStep = telemetry[telemetry.length - 1];

    return (
        <div className="w-full my-1.5 text-xs font-sans">
            {/* Claude-style Minimal Single Line Pill */}
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
                        <PiSparkleLight className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
                    ) : (
                        <PiCheckCircleLight className="w-3.5 h-3.5 text-emerald-400/90 shrink-0" />
                    )}
                    
                    {/* Animated Step Label */}
                    <span 
                        key={isLive ? activeStep?.id || activeStep?.label : 'completed'} 
                        className="font-normal text-[13px] text-zinc-300 tracking-tight animate-fadeIn transition-all duration-300 truncate max-w-lg"
                    >
                        {isLive 
                            ? `Thinking... ${activeStep?.label || ''}` 
                            : `Thought for ${durationSec} second${durationSec > 1 ? 's' : ''}`
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
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                                <span>{activeStep?.stage}</span>
                            </div>
                            <p className="text-zinc-300 text-[11px] leading-relaxed font-mono pl-3.5">
                                {activeStep?.label}
                            </p>

                            {activeStep?.details && (
                                <div className="pl-3.5 pt-1">
                                    <pre className="p-2.5 rounded-lg bg-zinc-950/90 border border-white/5 text-[10px] text-zinc-300 overflow-x-auto whitespace-pre-wrap font-mono max-h-44">
                                        {typeof activeStep.details === 'string' ? activeStep.details : JSON.stringify(activeStep.details, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Completed Full Thought Timeline */
                        <div className="space-y-3.5 py-1">
                            {telemetry.map((step, idx) => (
                                <div key={step.id || idx} className="space-y-1">
                                    <div className="flex items-center gap-2 text-zinc-300 font-medium text-[12px]">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80"></span>
                                        <span>{step.stage}</span>
                                    </div>
                                    
                                    <p className="text-zinc-400 text-[11px] leading-relaxed font-mono pl-3.5">
                                        {step.label}
                                    </p>

                                    {step.details && (
                                        <details className="pl-3.5 mt-1">
                                            <summary className="text-[10px] text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors">
                                                View step payload
                                            </summary>
                                            <pre className="mt-1.5 p-2.5 rounded-lg bg-zinc-950/90 border border-white/5 text-[10px] text-zinc-300 overflow-x-auto whitespace-pre-wrap font-mono max-h-44">
                                                {typeof step.details === 'string' ? step.details : JSON.stringify(step.details, null, 2)}
                                            </pre>
                                        </details>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};



