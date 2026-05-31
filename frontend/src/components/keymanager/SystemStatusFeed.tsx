import React from 'react';
import { FiDatabase, FiCpu, FiMessageSquare, FiKey, FiActivity } from 'react-icons/fi';

interface SystemConfig {
  llmModel: string;
  llmApiUrl: string;
  embeddingModel: string;
  hasApiKey: boolean;
  dbStatus: {
    connected: boolean;
    uri: string;
  };
  discordStatus: {
    mode: string;
    guildName?: string;
  };
}

interface SystemStatusFeedProps {
  config: SystemConfig | null;
  loading: boolean;
}

export default function SystemStatusFeed({ config, loading }: SystemStatusFeedProps) {
  if (loading || !config) {
    return (
      <div className="border border-[#1c1c1c] bg-[#090909] rounded p-6 space-y-4 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <div className="h-3 w-32 bg-[#1c1c1c] rounded"></div>
            <div className="h-3 w-20 bg-[#1c1c1c] rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const rows = [
    {
      label: 'Database',
      icon: FiDatabase,
      value: config.dbStatus.connected ? 'CONNECTED' : 'DISCONNECTED',
      sub: config.dbStatus.uri?.replace(/\/\/.*@/, '//***@') || 'N/A',
      ok: config.dbStatus.connected,
    },
    {
      label: 'LLM Model',
      icon: FiCpu,
      value: config.llmModel,
      sub: config.llmApiUrl?.replace(/https?:\/\//, ''),
      ok: true,
    },
    {
      label: 'API Key',
      icon: FiKey,
      value: config.hasApiKey ? 'CONFIGURED' : 'NOT SET',
      sub: config.hasApiKey ? 'Bearer auth active' : 'Unauthenticated mode',
      ok: config.hasApiKey,
    },
    {
      label: 'Embedding Model',
      icon: FiActivity,
      value: config.embeddingModel,
      sub: config.embeddingModel.includes('MiniLM') || config.embeddingModel === 'local-fallback'
        ? 'Local all-MiniLM-L6-v2 fallback'
        : 'Remote embedding API',
      ok: true,
    },
    {
      label: 'Discord Bot',
      icon: FiMessageSquare,
      value: config.discordStatus.mode === 'live' ? 'LIVE' : 'MOCK',
      sub: config.discordStatus.guildName || 'Simulator mode',
      ok: config.discordStatus.mode === 'live',
    },
  ];

  return (
    <div className="border border-[#1c1c1c] bg-[#090909] rounded p-6 space-y-3">
      <div className="pb-3 border-b border-[#1c1c1c]">
        <h3 className="font-heading text-base font-bold text-white">System Status Feed</h3>
        <p className="text-[10px] text-[#555555] font-sans mt-0.5">Live connectivity indicators for all integrated services.</p>
      </div>

      {rows.map(({ label, icon: Icon, value, sub, ok }) => (
        <div key={label} className="flex items-center justify-between py-2 border-b border-[#0d0d0d] last:border-0">
          <div className="flex items-center space-x-3">
            <div className={`p-1.5 rounded border ${ok ? 'border-white/10 text-white' : 'border-red-500/20 text-red-500'}`}>
              <Icon className="text-xs" />
            </div>
            <div>
              <p className="text-xs font-mono text-white">{label}</p>
              <p className="text-[10px] text-[#555555] font-description">{sub}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            <span className={`text-[10px] font-mono ${ok ? 'text-[#aaaaaa]' : 'text-red-400'}`}>{value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
