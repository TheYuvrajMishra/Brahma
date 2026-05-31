import React, { useState, useEffect, useRef } from 'react';
import { FiSend, FiRefreshCw, FiTerminal, FiZap } from 'react-icons/fi';
import { motion } from 'framer-motion';
import axios from 'axios';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

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

interface TraceResult {
  stages: Record<string, unknown>;
  sources: unknown[];
  tokenEstimate: number;
  contextBlock: string;
}

interface ChatTerminalProps {
  ragOptions: RagOptions;
  onTrace: (trace: TraceResult) => void;
  onToggleTrace: () => void;
  traceVisible: boolean;
}

export default function ChatTerminal({ ragOptions, onTrace, onToggleTrace, traceVisible }: ChatTerminalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async () => {
    const query = input.trim();
    if (!query || loading) return;

    const userMsg: Message = { role: 'user', content: query, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('http://127.0.0.1:3000/api/playground/query', {
        query,
        options: ragOptions,
        messages: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      });

      const assistantMsg: Message = {
        role: 'assistant',
        content: res.data.answer,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (res.data.rag) {
        onTrace(res.data.rag as TraceResult);
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || err.message || 'Request failed';
      setError(errMsg);
      const assistantMsg: Message = {
        role: 'assistant',
        content: `⚠ Error: ${errMsg}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050505]">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1c1c1c] bg-[#090909]">
        <div className="flex items-center space-x-2">
          <FiTerminal className="text-white text-sm" />
          <span className="text-xs font-mono text-[#888888]">
            brahma<span className="text-white">::</span>playground
            <span className="text-[#555555]"> — {messages.length} messages</span>
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleTrace}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded border text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${
              traceVisible
                ? 'border-white/30 bg-black text-white'
                : 'border-[#1c1c1c] text-[#666666] hover:border-[#333333] hover:text-white'
            }`}
          >
            <FiZap className="text-[10px]" />
            <span>RAG Trace</span>
          </button>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="px-3 py-1 rounded border border-[#1c1c1c] text-[10px] font-mono text-[#555555] hover:border-[#333333] hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-20 space-y-3">
            <FiTerminal className="text-[#333333] text-4xl" />
            <p className="font-heading text-2xl text-[#333333]">Brahma Playground</p>
            <p className="text-xs text-[#444444] font-description max-w-sm leading-relaxed">
              Queries pass through the full 8-stage Advanced RAG pipeline — query rewrite, HyDE, hybrid retrieval, reranking, MMR, and contextual compression — before reaching the LLM.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {[
                'How does mission decomposition work?',
                'What skills are registered in Hunar?',
                'Explain the Brahma Loop architecture.',
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="px-3 py-1.5 border border-[#1c1c1c] hover:border-[#333333] text-[10px] text-[#666666] hover:text-white font-mono rounded transition-colors cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] space-y-1 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
              <div className={`flex items-center space-x-2 text-[9px] font-mono text-[#555555]`}>
                <span>{msg.role === 'user' ? 'YOU' : 'BRAHMA'}</span>
                <span>{msg.timestamp.toLocaleTimeString()}</span>
              </div>
              <div className={`rounded p-3 text-sm font-description leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-white text-black'
                  : 'bg-[#0d0d0d] border border-[#1c1c1c] text-[#e5e5e5]'
              }`}>
                <pre className="whitespace-pre-wrap font-description text-sm leading-relaxed">{msg.content}</pre>
              </div>
            </div>
          </motion.div>
        ))}

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-[#0d0d0d] border border-[#1c1c1c] rounded p-3 flex items-center space-x-2">
              <FiRefreshCw className="text-[#888888] text-xs animate-spin" />
              <span className="text-xs font-mono text-[#888888]">Processing RAG pipeline...</span>
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[#1c1c1c] bg-[#090909]">
        {error && (
          <div className="mb-3 px-3 py-2 border border-red-500/20 bg-red-500/5 rounded text-[10px] text-red-400 font-mono">
            {error}
          </div>
        )}
        <div className="flex items-end space-x-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder="Query Brahma... (Enter to send, Shift+Enter for new line)"
            className="flex-1 bg-black border border-[#222222] focus:border-[#444444] text-white text-sm font-description p-3 rounded resize-none focus:outline-none placeholder-[#444444] leading-relaxed"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-4 py-3 bg-white text-black hover:bg-[#e5e5e5] transition-all rounded flex items-center space-x-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            {loading ? <FiRefreshCw className="animate-spin text-sm" /> : <FiSend className="text-sm" />}
          </button>
        </div>
        <p className="text-[9px] text-[#444444] font-mono mt-2">
          Advanced RAG: TopK={ragOptions.retrievalTopK} → Rerank={ragOptions.rerankTopK} → MMR={ragOptions.finalTopK} → Budget={ragOptions.maxTokenBudget}t
        </p>
      </div>
    </div>
  );
}
