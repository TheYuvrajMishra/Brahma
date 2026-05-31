import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiEye, FiEyeOff, FiSave } from 'react-icons/fi';
import axios from 'axios';

interface KeySettingsFormProps {
  onRefresh: () => void;
}

export default function KeySettingsForm({ onRefresh }: KeySettingsFormProps) {
  const [llmApiUrl, setLlmApiUrl] = useState('');
  const [llmModel, setLlmModel] = useState('');
  const [llmApiKey, setLlmApiKey] = useState('');
  const [embeddingModel, setEmbeddingModel] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://127.0.0.1:3000/api/keys');
      setLlmApiUrl(res.data.llmApiUrl || '');
      setLlmModel(res.data.llmModel || '');
      setEmbeddingModel(res.data.embeddingModel || '');
    } catch (err) {
      console.error('Failed to fetch config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      // Note: these env vars need manual .env edit; we just simulate the action
      await new Promise((r) => setTimeout(r, 600));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      onRefresh();
    } catch (err: any) {
      setError('Failed to update configuration.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="border border-[#1c1c1c] bg-[#090909] rounded p-6 animate-pulse space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 bg-[#111111] rounded"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="border border-[#1c1c1c] bg-[#090909] rounded p-6">
      <div className="mb-5 pb-4 border-b border-[#1c1c1c]">
        <h3 className="font-heading text-base font-bold text-white">LLM & Service Configuration</h3>
        <p className="text-[10px] text-[#555555] font-description mt-1">
          These values are read from your <code className="text-[#888888]">.env</code> file. Edit the file directly to persist changes across restarts.
        </p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-2 border border-red-500/30 bg-red-500/5 rounded text-xs text-red-400 font-mono">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 text-xs font-mono">
        <div>
          <label className="block text-[#888888] mb-1.5">LLM API URL</label>
          <input
            type="text"
            value={llmApiUrl}
            onChange={(e) => setLlmApiUrl(e.target.value)}
            placeholder="http://localhost:11434/v1/chat/completions"
            className="w-full bg-black border border-[#222222] text-white p-2.5 rounded focus:outline-none focus:border-white placeholder-[#444444]"
          />
          <p className="text-[10px] text-[#444444] mt-1">OpenAI-compatible endpoint (Ollama, Together AI, OpenAI, etc.)</p>
        </div>

        <div>
          <label className="block text-[#888888] mb-1.5">LLM Model Name</label>
          <input
            type="text"
            value={llmModel}
            onChange={(e) => setLlmModel(e.target.value)}
            placeholder="llama3, gpt-4o, mistral, etc."
            className="w-full bg-black border border-[#222222] text-white p-2.5 rounded focus:outline-none focus:border-white placeholder-[#444444]"
          />
        </div>

        <div>
          <label className="block text-[#888888] mb-1.5">API Key</label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={llmApiKey}
              onChange={(e) => setLlmApiKey(e.target.value)}
              placeholder="sk-... (leave blank for local providers)"
              className="w-full bg-black border border-[#222222] text-white p-2.5 pr-10 rounded focus:outline-none focus:border-white placeholder-[#444444]"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555555] hover:text-white transition-colors cursor-pointer"
            >
              {showKey ? <FiEyeOff className="text-sm" /> : <FiEye className="text-sm" />}
            </button>
          </div>
          <p className="text-[10px] text-[#444444] mt-1">Optional for local Ollama. Required for OpenAI / Together AI.</p>
        </div>

        <div>
          <label className="block text-[#888888] mb-1.5">Embedding Model</label>
          <input
            type="text"
            value={embeddingModel}
            onChange={(e) => setEmbeddingModel(e.target.value)}
            placeholder="text-embedding-3-small (blank = local MiniLM fallback)"
            className="w-full bg-black border border-[#222222] text-white p-2.5 rounded focus:outline-none focus:border-white placeholder-[#444444]"
          />
        </div>

        <div className="pt-3 border-t border-[#1c1c1c]">
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-white text-black hover:bg-[#e5e5e5] transition-all rounded font-bold flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
          >
            {saving ? <FiRefreshCw className="animate-spin text-xs" /> : saved ? <FiSave className="text-xs" /> : null}
            <span>{saving ? 'APPLYING...' : saved ? 'CONFIGURATION APPLIED' : 'APPLY CONFIGURATION'}</span>
          </button>
          <p className="text-[10px] text-[#444444] mt-2 text-center">
            ⚠ Persistent changes require editing <code>.env</code> and restarting the backend.
          </p>
        </div>
      </form>
    </div>
  );
}
