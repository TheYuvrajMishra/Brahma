import React from 'react';
import { FiZap, FiSearch, FiFilter, FiGrid, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

interface RagStages {
  rewrite?: string;
  expandedQueries?: string[];
  hyde?: string;
  retrievedCount?: number;
  rerankedCount?: number;
  finalCount?: number;
  tokenEstimate?: number;
}

interface RagSource {
  docId?: string;
  docType?: string;
  score?: number;
  content?: string;
}

interface TraceResult {
  stages: RagStages;
  sources: RagSource[];
  tokenEstimate: number;
  contextBlock: string;
}

interface TraceInspectorProps {
  traceResult: TraceResult | null;
  visible: boolean;
  onClose: () => void;
}

export default function TraceInspector({ traceResult, visible, onClose }: TraceInspectorProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 right-0 h-full w-full md:w-[420px] bg-[#090909] border-l border-[#1c1c1c] z-50 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1c1c1c]">
            <div className="flex items-center space-x-2">
              <FiZap className="text-white text-sm" />
              <h2 className="font-heading text-base font-bold text-white">RAG Trace Inspector</h2>
            </div>
            <button onClick={onClose} className="text-[#888888] hover:text-white transition-colors cursor-pointer">
              <FiX className="text-sm" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-mono">
            {!traceResult ? (
              <div className="text-center py-20 text-[#555555]">
                <FiSearch className="text-3xl mx-auto mb-3 opacity-30" />
                <p>No trace available.</p>
                <p className="text-[10px] mt-1">Submit a query to see pipeline stages.</p>
              </div>
            ) : (
              <>
                {/* Token Estimate Banner */}
                <div className="border border-white/10 bg-black rounded p-3 flex justify-between items-center">
                  <span className="text-[#888888]">Compressed Context</span>
                  <span className="text-white font-bold">~{traceResult.tokenEstimate} tokens</span>
                </div>

                {/* Stage: Rewrite */}
                {traceResult.stages?.rewrite && (
                  <Section icon={<FiFilter />} label="[1] Query Rewrite">
                    <p className="text-[#e5e5e5] leading-relaxed font-description text-sm">{traceResult.stages.rewrite}</p>
                  </Section>
                )}

                {/* Stage: Expanded Queries */}
                {traceResult.stages?.expandedQueries && traceResult.stages.expandedQueries.length > 0 && (
                  <Section icon={<FiGrid />} label="[2] Multi-Query Expansion">
                    <ul className="space-y-1">
                      {traceResult.stages.expandedQueries.map((q, i) => (
                        <li key={i} className="flex space-x-2 text-[#e5e5e5] font-description text-sm">
                          <span className="text-[#555555] shrink-0">v{i + 1}.</span>
                          <span className="leading-snug">{q}</span>
                        </li>
                      ))}
                    </ul>
                  </Section>
                )}

                {/* Stage: HyDE */}
                {traceResult.stages?.hyde && (
                  <Section icon={<FiZap />} label="[3] HyDE Hypothetical Doc">
                    <p className="text-[#e5e5e5] leading-relaxed font-description text-sm line-clamp-5">{traceResult.stages.hyde}</p>
                  </Section>
                )}

                {/* Pipeline counts */}
                <Section icon={<FiSearch />} label="[4–7] Retrieval Pipeline">
                  <div className="space-y-2">
                    {[
                      { label: 'Hybrid Retrieved', value: traceResult.stages?.retrievedCount },
                      { label: 'After Reranking', value: traceResult.stages?.rerankedCount },
                      { label: 'After MMR Dedup', value: traceResult.stages?.finalCount },
                    ].map(({ label, value }) => (
                      value !== undefined ? (
                        <div key={label} className="flex justify-between text-[10px]">
                          <span className="text-[#888888]">{label}</span>
                          <span className="text-white">{value} chunks</span>
                        </div>
                      ) : null
                    ))}
                  </div>
                </Section>

                {/* Sources */}
                {traceResult.sources?.length > 0 && (
                  <Section icon={<FiGrid />} label={`[8] Final Sources (${traceResult.sources.length})`}>
                    <div className="space-y-2">
                      {traceResult.sources.map((src, idx) => (
                        <div key={idx} className="border border-[#1c1c1c] bg-black rounded p-2 space-y-1">
                          <div className="flex justify-between text-[9px]">
                            <code className="text-[#aaaaaa] truncate max-w-[200px]">{src.docId ?? `chunk-${idx}`}</code>
                            <div className="flex space-x-2">
                              <span className="text-[#555555]">{src.docType}</span>
                              {src.score !== undefined && <span className="text-white">{src.score.toFixed(4)}</span>}
                            </div>
                          </div>
                          {src.content && (
                            <p className="text-[10px] text-[#888888] font-description leading-snug line-clamp-3">{src.content}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Context Block Preview */}
                <Section icon={<FiFilter />} label="Compressed Context Block">
                  <pre className="text-[10px] text-[#888888] font-mono whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">{traceResult.contextBlock}</pre>
                </Section>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Section({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="border border-[#1c1c1c] rounded p-3 space-y-2">
      <div className="flex items-center space-x-1.5 text-[#888888] text-[10px] uppercase tracking-widest pb-2 border-b border-[#111111]">
        <span className="text-[10px]">{icon}</span>
        <span>{label}</span>
      </div>
      {children}
    </div>
  );
}
