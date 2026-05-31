import { useState, useEffect } from 'react';
import { FiRefreshCw, FiLoader } from 'react-icons/fi';
import axios from 'axios';
import SystemStatusFeed from '../components/keymanager/SystemStatusFeed';
import KeySettingsForm from '../components/keymanager/KeySettingsForm';

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
    connected: boolean;
    mode: 'live' | 'mock';
    guildName?: string;
  };
}

export default function Keymanager() {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:3000/api/keys');
      setConfig(res.data);
    } catch (err) {
      console.error('Error fetching system config status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#1c1c1c] pb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-white">System Key & Status Manager</h1>
          <p className="text-xs text-[#888888] font-mono mt-1 tracking-wider uppercase">
            Service Credentials • Pipeline Heartbeat • Discord bot configuration
          </p>
        </div>
        <button
          onClick={fetchStatus}
          className="mt-4 md:mt-0 px-4 py-2 border border-[#222222] hover:border-white text-xs font-mono rounded flex items-center space-x-2 text-white transition-all cursor-pointer bg-black"
        >
          <FiRefreshCw className="text-xs" />
          <span>POLL HEARTBEAT</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <FiLoader className="text-white text-2xl animate-spin" />
          <span className="text-xs text-[#888888] font-mono uppercase tracking-widest">Hydrating Key Diagnostics...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            {config && <SystemStatusFeed config={config} loading={loading} />}
          </div>
          <div className="lg:col-span-2">
            <KeySettingsForm onRefresh={fetchStatus} />
          </div>
        </div>
      )}
    </div>
  );
}
