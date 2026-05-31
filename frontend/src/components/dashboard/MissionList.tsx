import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import axios from 'axios';

// ─── MissionCard subcomponent ─────────────────────────────────────────────────

interface SubTask {
  subTaskId: string;
  title: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'BLOCKED';
  progress: number;
  description: string;
  assignedTo: string;
}

interface Mission {
  missionId: string;
  title: string;
  objective: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  overallProgress: number;
  subTasks: SubTask[];
  lastSync: Date;
}

interface MissionListProps {
  missions: Mission[];
  onRefresh: () => void;
}

const statusColors: Record<string, string> = {
  PENDING: 'text-[#888888] border-[#333333]',
  IN_PROGRESS: 'text-white border-white/40',
  COMPLETED: 'text-[#aaaaaa] border-[#444444]',
  FAILED: 'text-red-500 border-red-500/30',
  BLOCKED: 'text-yellow-500 border-yellow-500/30',
};

function SubTaskList({ tasks, missionId, onRefresh }: { tasks: SubTask[]; missionId: string; onRefresh: () => void }) {
  const [executing, setExecuting] = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);

  const executeNext = async () => {
    setExecuting(true);
    try {
      await axios.post(`http://127.0.0.1:3000/api/missions/${missionId}/execute-next`);
      onRefresh();
    } catch (err) {
      console.error('Execute failed', err);
    } finally {
      setExecuting(false);
    }
  };

  const completeTask = async (subTaskId: string) => {
    setCompleting(subTaskId);
    try {
      await axios.post(`http://127.0.0.1:3000/api/missions/${missionId}/complete-task`, { subTaskId });
      onRefresh();
    } catch (err) {
      console.error('Complete failed', err);
    } finally {
      setCompleting(null);
    }
  };

  return (
    <div className="mt-4 space-y-2">
      {tasks.map((task) => (
        <div key={task.subTaskId} className="flex items-start justify-between p-3 border border-[#1a1a1a] rounded bg-black group hover:border-[#333333] transition-colors">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <div className={`mt-0.5 w-2 h-2 shrink-0 rounded-full border ${
              task.status === 'COMPLETED' ? 'bg-white border-white' :
              task.status === 'IN_PROGRESS' ? 'border-white bg-transparent animate-pulse' :
              task.status === 'FAILED' ? 'border-red-500 bg-red-500' :
              'border-[#444444] bg-transparent'
            }`}></div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono text-white leading-tight truncate">{task.title}</p>
              <p className="text-[10px] text-[#666666] font-description mt-0.5 leading-tight line-clamp-2">{task.description}</p>
              <div className="flex items-center space-x-2 mt-1.5">
                <code className="text-[9px] text-[#555555] font-mono">{task.subTaskId}</code>
                <span className={`text-[9px] border px-1 rounded font-mono ${statusColors[task.status] || ''}`}>{task.status}</span>
              </div>
            </div>
          </div>
          {task.status === 'IN_PROGRESS' && (
            <button
              onClick={() => completeTask(task.subTaskId)}
              disabled={completing === task.subTaskId}
              className="ml-2 shrink-0 p-1 border border-white/20 hover:border-white text-[#888888] hover:text-white transition-all rounded cursor-pointer"
              title="Mark complete"
            >
              {completing === task.subTaskId ? <FiRefreshCw className="text-xs animate-spin" /> : <FiCheckCircle className="text-xs" />}
            </button>
          )}
        </div>
      ))}

      {tasks.some(t => t.status === 'PENDING') && (
        <button
          onClick={executeNext}
          disabled={executing}
          className="w-full mt-2 py-2 border border-[#222222] hover:border-white text-[#888888] hover:text-white transition-all text-[10px] font-mono uppercase tracking-wider rounded flex items-center justify-center space-x-2 cursor-pointer"
        >
          {executing && <FiRefreshCw className="animate-spin text-xs" />}
          <span>{executing ? 'Activating next sub-task...' : 'Execute Next Sub-Task →'}</span>
        </button>
      )}
    </div>
  );
}

function MissionCard({ mission, onRefresh }: { mission: Mission; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete mission "${mission.missionId}"?`)) return;
    setDeleting(true);
    try {
      await axios.delete(`http://127.0.0.1:3000/api/missions/${mission.missionId}`);
      onRefresh();
    } catch (err) {
      console.error('Delete failed', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="border border-[#1c1c1c] bg-[#090909] rounded overflow-hidden hover:border-[#2a2a2a] transition-colors">
      {/* Mission Header */}
      <div
        className="p-4 cursor-pointer flex items-start justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0 mr-4">
          <div className="flex items-center space-x-2 mb-1">
            <code className="text-[10px] font-mono text-[#888888]">{mission.missionId}</code>
            <span className={`text-[10px] border px-1.5 py-0.5 rounded font-mono ${statusColors[mission.status] || ''}`}>{mission.status}</span>
          </div>
          <h3 className="font-heading text-base font-bold text-white leading-tight">{mission.title}</h3>
          <p className="text-xs font-description text-[#888888] mt-1 leading-snug line-clamp-2">{mission.objective}</p>
        </div>
        <div className="shrink-0 flex flex-col items-end space-y-2">
          <div className="text-right">
            <p className="text-xl font-heading font-bold text-white leading-none">{mission.overallProgress}%</p>
            <p className="text-[10px] text-[#555555] font-mono">Complete</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4 pb-2">
        <div className="w-full h-px bg-[#1c1c1c] rounded overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-1000 ease-out"
            style={{ width: `${mission.overallProgress}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-1 text-[10px] font-mono text-[#555555]">
          <span>{mission.subTasks.filter(t => t.status === 'COMPLETED').length}/{mission.subTasks.length} subtasks</span>
          <span>{new Date(mission.lastSync).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Expanded Sub-Tasks */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-[#111111]">
          <SubTaskList tasks={mission.subTasks} missionId={mission.missionId} onRefresh={onRefresh} />
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-full mt-3 py-1.5 border border-red-500/20 hover:border-red-500/50 text-red-500/60 hover:text-red-500 transition-all text-[10px] font-mono uppercase tracking-wider rounded flex items-center justify-center space-x-1 cursor-pointer"
          >
            {deleting && <FiRefreshCw className="animate-spin text-xs" />}
            <span>{deleting ? 'Removing...' : 'Delete Mission'}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function MissionList({ missions, onRefresh }: MissionListProps) {
  if (missions.length === 0) {
    return (
      <div className="border border-[#1c1c1c] bg-[#090909] rounded p-12 text-center">
        <FiAlertTriangle className="text-[#444444] text-3xl mx-auto mb-3" />
        <p className="text-sm text-[#555555] font-mono">No active missions in Dharma ledger</p>
        <p className="text-xs text-[#444444] font-description mt-1">Decompose a mission above to seed the execution ledger</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {missions.map((m) => (
        <MissionCard key={m.missionId} mission={m} onRefresh={onRefresh} />
      ))}
    </div>
  );
}
