import React, { useState, useEffect } from 'react';
import { FiTerminal, FiLoader, FiZap, FiRefreshCw } from 'react-icons/fi';
import axios from 'axios';
import MissionOverview from '../components/dashboard/MissionOverview';
import MissionList from '../components/dashboard/MissionList';

export default function Dashboard() {
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [objective, setObjective] = useState('');

  const fetchMissions = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:3000/api/missions');
      setMissions(res.data);
    } catch (err) {
      console.error('Error fetching missions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissions();
  }, []);

  const handleDecompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !objective) return;
    setSubmitting(true);
    try {
      await axios.post('http://127.0.0.1:3000/api/missions/decompose', {
        title,
        objective,
      });
      setTitle('');
      setObjective('');
      fetchMissions();
    } catch (err) {
      console.error('Decomposition failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#1c1c1c] pb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-white">Dharma Ledger</h1>
          <p className="text-xs text-[#888888] font-mono mt-1 tracking-wider uppercase">
            Mission Decomposition • Task Orchestrator • Agent Lifecycle
          </p>
        </div>
        <button
          onClick={fetchMissions}
          className="mt-4 md:mt-0 px-4 py-2 border border-[#222222] hover:border-white text-xs font-mono rounded flex items-center space-x-2 text-white transition-all cursor-pointer bg-black"
        >
          <FiRefreshCw className="text-xs" />
          <span>POLL DHARMA STATUS</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <FiLoader className="text-white text-2xl animate-spin" />
          <span className="text-xs text-[#888888] font-mono uppercase tracking-widest">Accessing Ledger...</span>
        </div>
      ) : (
        <>
          {/* Stats overview */}
          <MissionOverview missions={missions} />

          {/* Dual columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Mission Decomposer */}
            <div className="lg:col-span-1">
              <div className="border border-[#1c1c1c] bg-[#090909] p-6 rounded space-y-5">
                <div className="flex items-center space-x-2 border-b border-[#1c1c1c] pb-3">
                  <FiTerminal className="text-white text-sm" />
                  <h2 className="font-heading text-base font-bold text-white">Decompose New Mission</h2>
                </div>
                <form onSubmit={handleDecompose} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[#888888] uppercase tracking-wider">Mission Title</label>
                    <input
                      type="text"
                      placeholder="e.g. DEPLOY_EMERGENCY_PATCH_88"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="w-full bg-black border border-[#1c1c1c] focus:border-white px-3 py-2 text-xs font-mono text-white rounded outline-none transition-all placeholder-[#444444]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[#888888] uppercase tracking-wider">Strategic Objective</label>
                    <textarea
                      placeholder="Specify high-level intent, constraints, and success factors..."
                      value={objective}
                      onChange={(e) => setObjective(e.target.value)}
                      required
                      rows={4}
                      className="w-full bg-black border border-[#1c1c1c] focus:border-white px-3 py-2 text-xs font-sans text-white rounded outline-none transition-all placeholder-[#444444] resize-none leading-relaxed"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2 bg-white text-black hover:bg-transparent hover:text-white border border-white transition-all text-xs font-mono rounded flex items-center justify-center space-x-2 cursor-pointer font-bold disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <FiLoader className="animate-spin text-xs" />
                        <span>ORCHESTRATING...</span>
                      </>
                    ) : (
                      <>
                        <FiZap className="text-xs" />
                        <span>DECOMPOSE PLAN</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Active Ledger */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between border-b border-[#1c1c1c] pb-3 mb-2">
                <span className="text-xs font-mono text-white uppercase tracking-wider">Active Execution ledger</span>
                <span className="text-[10px] font-mono text-[#555555]">
                  {missions.filter((m) => m.status === 'IN_PROGRESS').length} PROCESSING
                </span>
              </div>
              <MissionList missions={missions} onRefresh={fetchMissions} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
