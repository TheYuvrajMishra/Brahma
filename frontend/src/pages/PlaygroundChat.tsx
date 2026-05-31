import { useState } from 'react';
import ChatTerminal from '../components/playground/ChatTerminal';
import RagSettings from '../components/playground/RagSettings';
import TraceInspector from '../components/playground/TraceInspector';

interface RagOptions {
  retrievalTopK: number;
  rerankTopK: number;
  finalTopK: number;
  maxTokenBudget: number;
  mmrLambda: number;
  skipHyDE: boolean;
  skipRewrite: boolean;
  temperature: number;
}

export default function PlaygroundChat() {
  const [ragOptions, setRagOptions] = useState<RagOptions>({
    retrievalTopK: 15,
    rerankTopK: 8,
    finalTopK: 5,
    maxTokenBudget: 3500,
    mmrLambda: 0.7,
    skipHyDE: false,
    skipRewrite: false,
    temperature: 0.7,
  });

  const [trace, setTrace] = useState<any>(null);
  const [traceVisible, setTraceVisible] = useState(false);

  const handleTrace = (newTrace: any) => {
    setTrace(newTrace);
    setTraceVisible(true);
  };

  const handleToggleTrace = () => {
    setTraceVisible(!traceVisible);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#1c1c1c] pb-4 mb-4">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-white">RAG Playground</h1>
          <p className="text-xs text-[#888888] font-mono mt-1 tracking-wider uppercase">
            8-Stage Retrieval-Augmented Generation • Semantic Context Verification
          </p>
        </div>
      </div>

      {/* Main split grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0 overflow-hidden">
        {/* Left Column: RAG Configuration */}
        <div className="lg:col-span-1 overflow-y-auto pr-1">
          <RagSettings options={ragOptions} onChange={setRagOptions} />
        </div>

        {/* Center/Right columns: Chat and Trace Panel */}
        <div className="lg:col-span-3 flex min-h-0 relative overflow-hidden border border-[#1c1c1c] rounded bg-[#050505]">
          {/* Chat Interface */}
          <div className="flex-1 min-w-0">
            <ChatTerminal
              ragOptions={ragOptions}
              onTrace={handleTrace}
              onToggleTrace={handleToggleTrace}
              traceVisible={traceVisible}
            />
          </div>

          {/* Collapsible Trace Panel */}
          <TraceInspector
            traceResult={trace}
            visible={traceVisible}
            onClose={() => setTraceVisible(false)}
          />
        </div>
      </div>
    </div>
  );
}
