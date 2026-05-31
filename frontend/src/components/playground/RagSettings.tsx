import React from 'react';
import { FiSettings, FiMinus, FiPlus } from 'react-icons/fi';

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

interface RagSettingsProps {
  options: RagOptions;
  onChange: (opts: RagOptions) => void;
}

function NumControl({ label, value, min, max, step = 1, onChange }: {
  label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-mono text-[#888888]">{label}</span>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onChange(Math.max(min, parseFloat((value - step).toFixed(2))))}
          className="w-5 h-5 border border-[#333333] hover:border-white text-[#888888] hover:text-white flex items-center justify-center rounded cursor-pointer transition-colors"
        >
          <FiMinus className="text-[10px]" />
        </button>
        <span className="text-xs font-mono text-white w-10 text-center">{value}</span>
        <button
          onClick={() => onChange(Math.min(max, parseFloat((value + step).toFixed(2))))}
          className="w-5 h-5 border border-[#333333] hover:border-white text-[#888888] hover:text-white flex items-center justify-center rounded cursor-pointer transition-colors"
        >
          <FiPlus className="text-[10px]" />
        </button>
      </div>
    </div>
  );
}

export default function RagSettings({ options, onChange }: RagSettingsProps) {
  const update = (key: keyof RagOptions, value: number | boolean) =>
    onChange({ ...options, [key]: value });

  return (
    <div className="border border-[#1c1c1c] bg-[#090909] rounded p-4 space-y-4">
      <div className="flex items-center space-x-2 pb-2 border-b border-[#1c1c1c]">
        <FiSettings className="text-white text-sm" />
        <h3 className="text-xs font-mono font-bold text-white uppercase tracking-widest">RAG Pipeline Config</h3>
      </div>

      {/* Numeric controls */}
      <div className="space-y-3">
        <p className="text-[9px] text-[#555555] font-mono uppercase tracking-widest">Retrieval Params</p>
        <NumControl label="Retrieval Top-K" value={options.retrievalTopK} min={5} max={50} onChange={(v) => update('retrievalTopK', v)} />
        <NumControl label="Rerank Top-K" value={options.rerankTopK} min={3} max={30} onChange={(v) => update('rerankTopK', v)} />
        <NumControl label="Final Top-K (MMR)" value={options.finalTopK} min={1} max={15} onChange={(v) => update('finalTopK', v)} />
        <NumControl label="Token Budget" value={options.maxTokenBudget} min={256} max={4096} step={128} onChange={(v) => update('maxTokenBudget', v)} />
        <NumControl label="MMR λ (div/rel)" value={options.mmrLambda} min={0} max={1} step={0.1} onChange={(v) => update('mmrLambda', v)} />
        <NumControl label="Temperature" value={options.temperature} min={0} max={2} step={0.1} onChange={(v) => update('temperature', v)} />
      </div>

      {/* Boolean toggles */}
      <div className="space-y-2 pt-2 border-t border-[#111111]">
        <p className="text-[9px] text-[#555555] font-mono uppercase tracking-widest">Pipeline Stages</p>
        {[
          { key: 'skipHyDE' as const, label: 'Skip HyDE Expansion' },
          { key: 'skipRewrite' as const, label: 'Skip Query Rewrite' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => update(key, !options[key])}
            className={`w-full flex items-center justify-between px-3 py-2 rounded border transition-colors cursor-pointer ${
              options[key]
                ? 'border-white/30 bg-black text-white'
                : 'border-[#1c1c1c] bg-transparent text-[#666666] hover:border-[#333333]'
            }`}
          >
            <span className="text-[10px] font-mono">{label}</span>
            <span className={`text-[9px] font-mono px-1.5 py-0.5 border rounded ${options[key] ? 'border-white/30 text-white' : 'border-[#333333] text-[#555555]'}`}>
              {options[key] ? 'OFF' : 'ON'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
