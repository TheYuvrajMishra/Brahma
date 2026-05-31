import React, { useState, useEffect } from 'react';
import { FiClock, FiPlay, FiPause, FiTrash2, FiPlus, FiAlertCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';

interface CronJob {
  jobId: string;
  name: string;
  cronExpression: string;
  prompt: string;
  status: 'ACTIVE' | 'PAUSED' | 'EXPIRED';
  createdOn: string;
  lastRun?: string;
  durationSec?: number;
  expiresAt?: string;
  executionsCount: number;
}

export default function CronJobs() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newJob, setNewJob] = useState({ name: '', cronExpression: '0 * * * *', prompt: '', durationSec: '' });

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 10000); // Auto-refresh for live status updates
    return () => clearInterval(interval);
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/cron');
      const data = await res.json();
      setJobs(data);
    } catch (err) {
      console.error('Failed to fetch cron jobs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleJobStatus = async (jobId: string) => {
    try {
      const res = await fetch(`http://localhost:3000/api/cron/${jobId}/toggle`, { method: 'PUT' });
      if (res.ok) fetchJobs();
    } catch (err) {
      console.error('Failed to toggle job status:', err);
    }
  };

  const deleteJob = async (jobId: string) => {
    if (!window.confirm('Are you sure you want to delete this scheduled job?')) return;
    try {
      const res = await fetch(`http://localhost:3000/api/cron/${jobId}`, { method: 'DELETE' });
      if (res.ok) fetchJobs();
    } catch (err) {
      console.error('Failed to delete job:', err);
    }
  };

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { ...newJob };
      if (payload.durationSec) {
        payload.durationSec = parseInt(payload.durationSec, 10);
      } else {
        delete payload.durationSec;
      }
      
      const res = await fetch('http://localhost:3000/api/cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setNewJob({ name: '', cronExpression: '0 * * * *', prompt: '', durationSec: '' });
        setShowAddForm(false);
        fetchJobs();
      } else {
        alert('Failed to add job');
      }
    } catch (err) {
      console.error('Failed to add job:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6 border-b border-[#222] pb-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-white tracking-tight flex items-center space-x-2">
            <FiClock className="text-emerald-500" />
            <span>Scheduled Jobs</span>
          </h2>
          <p className="text-sm text-[#888] mt-1 font-description">
            Autonomous chronos-based execution parameters.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 border border-emerald-500/20 px-4 py-2 rounded text-sm font-medium transition-colors flex items-center space-x-2"
        >
          <FiPlus />
          <span>New Schedule</span>
        </button>
      </div>

      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0a0a0a] border border-[#222] rounded p-6 shadow-xl"
        >
          <h3 className="text-lg text-white font-medium mb-4">Create New Cron Job</h3>
          <form onSubmit={handleAddJob} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-[#888] uppercase tracking-wider mb-2">Job Name</label>
                <input
                  type="text"
                  required
                  value={newJob.name}
                  onChange={e => setNewJob({ ...newJob, name: e.target.value })}
                  className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="e.g., Daily Summary"
                />
              </div>
              <div>
                <label className="block text-xs text-[#888] uppercase tracking-wider mb-2">Cron Expression</label>
                <input
                  type="text"
                  required
                  value={newJob.cronExpression}
                  onChange={e => setNewJob({ ...newJob, cronExpression: e.target.value })}
                  className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="e.g., */10 * * * * *"
                />
              </div>
              <div>
                <label className="block text-xs text-[#888] uppercase tracking-wider mb-2">Duration (Sec) [Optional]</label>
                <input
                  type="number"
                  min="1"
                  value={newJob.durationSec}
                  onChange={e => setNewJob({ ...newJob, durationSec: e.target.value })}
                  className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="e.g., 60 for 1 minute"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-[#888] uppercase tracking-wider mb-2">Instruction Prompt</label>
              <textarea
                required
                value={newJob.prompt}
                onChange={e => setNewJob({ ...newJob, prompt: e.target.value })}
                className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors h-24"
                placeholder="What should the AI do when this triggers?"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded text-sm text-[#888] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                Schedule Job
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {isLoading && jobs.length === 0 ? (
        <div className="flex justify-center p-12">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded p-12 text-center">
          <FiClock className="text-4xl text-[#333] mx-auto mb-4" />
          <h3 className="text-white text-lg font-medium mb-2">No Scheduled Jobs</h3>
          <p className="text-[#666] max-w-md mx-auto">
            You haven't set up any automated tasks yet. Create a new schedule or ask the AI to set one up for you.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <motion.div
              key={job.jobId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`bg-[#0a0a0a] border rounded p-5 transition-colors ${
                job.status === 'ACTIVE' ? 'border-[#333] hover:border-[#444]' : 'border-[#222] opacity-75'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-white font-medium">{job.name}</h3>
                    <span className="text-[10px] bg-[#111] border border-[#222] px-2 py-0.5 rounded font-mono text-[#888]">
                      {job.jobId}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      job.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' :
                      job.status === 'EXPIRED' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {job.status}
                    </span>
                    <span className="text-[10px] text-[#555] font-mono">
                      {job.executionsCount} executions
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <span className="text-[10px] text-[#666] uppercase tracking-wider block mb-1">Schedule</span>
                      <span className="text-sm text-emerald-400 font-mono bg-[#111] px-2 py-1 rounded inline-block">
                        {job.cronExpression}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#666] uppercase tracking-wider block mb-1">Last Executed</span>
                      <span className="text-sm text-[#bbb]">
                        {job.lastRun ? new Date(job.lastRun).toLocaleTimeString() : 'Never'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-[#666] uppercase tracking-wider block mb-1">Expiration / Duration</span>
                      <span className="text-sm text-[#bbb] flex items-center space-x-1">
                        {job.expiresAt ? (
                          <>
                            <FiAlertCircle className="text-amber-500 text-xs" />
                            <span>{new Date(job.expiresAt).toLocaleString()}</span>
                          </>
                        ) : 'Runs indefinitely'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-[#111] p-3 rounded border border-[#222]">
                    <span className="text-[10px] text-[#666] uppercase tracking-wider block mb-1">Instruction Prompt</span>
                    <p className="text-sm text-[#eee] whitespace-pre-wrap">{job.prompt}</p>
                  </div>
                </div>

                <div className="flex flex-col space-y-2 ml-6">
                  {job.status !== 'EXPIRED' && (
                    <button
                      onClick={() => toggleJobStatus(job.jobId)}
                      className={`p-2 rounded border transition-colors flex items-center justify-center w-10 h-10 ${
                        job.status === 'ACTIVE' 
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20' 
                          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20'
                      }`}
                      title={job.status === 'ACTIVE' ? 'Pause Schedule' : 'Resume Schedule'}
                    >
                      {job.status === 'ACTIVE' ? <FiPause /> : <FiPlay className="ml-0.5" />}
                    </button>
                  )}
                  <button
                    onClick={() => deleteJob(job.jobId)}
                    className="p-2 rounded border border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors flex items-center justify-center w-10 h-10"
                    title="Delete Job"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
