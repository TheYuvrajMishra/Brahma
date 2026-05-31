import React from 'react';
import { FiActivity, FiCheckCircle, FiClock, FiAlertTriangle, FiTarget } from 'react-icons/fi';

interface Mission {
  missionId: string;
  status: string;
  overallProgress: number;
  subTasks: { status: string }[];
}

interface MissionOverviewProps {
  missions: Mission[];
}

export default function MissionOverview({ missions }: MissionOverviewProps) {
  const total = missions.length;
  const completed = missions.filter((m) => m.status === 'COMPLETED').length;
  const inProgress = missions.filter((m) => m.status === 'IN_PROGRESS').length;
  const pending = missions.filter((m) => m.status === 'PENDING').length;
  const failed = missions.filter((m) => m.status === 'FAILED').length;

  const totalSubTasks = missions.reduce((acc, m) => acc + m.subTasks.length, 0);
  const completedSubTasks = missions.reduce(
    (acc, m) => acc + m.subTasks.filter((t) => t.status === 'COMPLETED').length,
    0
  );
  const avgProgress =
    total > 0
      ? Math.round(missions.reduce((acc, m) => acc + m.overallProgress, 0) / total)
      : 0;

  const stats = [
    {
      label: 'Total Missions',
      value: total,
      icon: FiTarget,
      desc: 'Dharma ledger entries',
    },
    {
      label: 'In Progress',
      value: inProgress,
      icon: FiActivity,
      desc: `${pending} pending, ${failed} failed`,
      highlight: inProgress > 0,
    },
    {
      label: 'Completed',
      value: completed,
      icon: FiCheckCircle,
      desc: `${completedSubTasks} / ${totalSubTasks} sub-tasks`,
    },
    {
      label: 'Avg Progress',
      value: `${avgProgress}%`,
      icon: FiClock,
      desc: 'Across all missions',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map(({ label, value, icon: Icon, desc, highlight }) => (
        <div
          key={label}
          className={`border rounded p-4 bg-[#090909] flex flex-col justify-between space-y-3 ${
            highlight ? 'border-white/20' : 'border-[#1c1c1c]'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-mono text-[#666666] uppercase tracking-widest">{label}</p>
              <p className={`text-3xl font-heading font-bold mt-1 ${highlight ? 'text-white' : 'text-[#e5e5e5]'}`}>
                {value}
              </p>
            </div>
            <div className={`p-2 rounded border ${highlight ? 'border-white/20 text-white' : 'border-[#1c1c1c] text-[#555555]'}`}>
              <Icon className="text-sm" />
            </div>
          </div>
          <p className="text-[10px] text-[#555555] font-description">{desc}</p>
        </div>
      ))}
    </div>
  );
}
