import React from 'react';
import { FiClock, FiDatabase, FiAlertTriangle } from 'react-icons/fi';

interface Session {
  sessionId: string;
  date: Date;
  focus: string;
  fileLink: string;
  tokenWeight: string;
}

interface ZehnMeta {
  memoryDecayStatus: string;
  indexedEntitiesCount: number;
  chronologicalSessionsCount: number;
  sessions: Session[];
}

interface SessionTimelineProps {
  zehnData: ZehnMeta | null;
}

export default function SessionTimeline({ zehnData }: SessionTimelineProps) {
  if (!zehnData) {
    return (
      <div className="border border-[#1c1c1c] bg-[#090909] p-6 rounded flex items-center justify-center h-64">
        <span className="text-xs text-[#555555] font-mono uppercase tracking-widest">No session data available</span>
      </div>
    );
  }

  const weightColor = (weight: string) => {
    if (weight.includes('HIGH')) return 'text-white border-white/40';
    if (weight.includes('MEDIUM') || weight.includes('MED')) return 'text-[#aaaaaa] border-white/20';
    return 'text-[#888888] border-[#222222]';
  };

  const isDecayWarning = zehnData.memoryDecayStatus !== 'NOMINAL';

  return (
    <div className="border border-[#1c1c1c] bg-[#090909] p-6 rounded flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1c1c1c] pb-3">
        <div className="flex items-center space-x-2">
          <FiClock className="text-white text-sm" />
          <h2 className="font-heading text-lg font-bold text-white">Session Index (CSI)</h2>
        </div>
        <div className="flex items-center space-x-3 text-[10px] font-mono">
          <div className="flex items-center space-x-1.5">
            <FiDatabase className="text-[#888888]" />
            <span className="text-[#888888]">{zehnData.chronologicalSessionsCount} sessions</span>
          </div>
          <div className={`flex items-center space-x-1 px-2 py-1 border rounded ${isDecayWarning ? 'border-yellow-500/30 text-yellow-500 bg-yellow-500/5' : 'border-[#1c1c1c] text-[#888888]'}`}>
            {isDecayWarning && <FiAlertTriangle className="text-[10px]" />}
            <span>{zehnData.memoryDecayStatus}</span>
          </div>
        </div>
      </div>

      {/* Decay stats row */}
      <div className="grid grid-cols-2 gap-3 py-2">
        <div className="border border-[#1c1c1c] rounded p-3 bg-black">
          <p className="text-[10px] text-[#555555] font-mono uppercase tracking-wider mb-1">Indexed Entities</p>
          <p className="text-2xl font-heading font-bold text-white">{zehnData.indexedEntitiesCount}</p>
        </div>
        <div className="border border-[#1c1c1c] rounded p-3 bg-black">
          <p className="text-[10px] text-[#555555] font-mono uppercase tracking-wider mb-1">Session Records</p>
          <p className="text-2xl font-heading font-bold text-white">{zehnData.chronologicalSessionsCount}</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative overflow-y-auto max-h-72 pr-1 space-y-0">
        {zehnData.sessions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-[#555555] font-mono italic">No chronological session records yet</p>
          </div>
        ) : (
          zehnData.sessions.map((session, idx) => (
            <div key={session.sessionId} className="relative flex items-start space-x-4 py-3 group">
              {/* Timeline line */}
              {idx < zehnData.sessions.length - 1 && (
                <div className="absolute left-[5px] top-6 bottom-0 w-px bg-[#1c1c1c] group-hover:bg-[#333333] transition-colors"></div>
              )}

              {/* Dot */}
              <div className="shrink-0 mt-1 w-2.5 h-2.5 rounded-full border border-[#444444] bg-[#090909] group-hover:border-white transition-colors z-10"></div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <code className="text-[10px] font-mono text-white bg-[#111111] border border-[#1c1c1c] px-1.5 py-0.5 rounded">{session.sessionId}</code>
                  <span className={`text-[10px] font-mono border px-1.5 py-0.5 rounded ${weightColor(session.tokenWeight)}`}>{session.tokenWeight}</span>
                </div>
                <p className="text-sm font-description text-[#e5e5e5] mt-1 leading-snug truncate">{session.focus}</p>
                <p className="text-[10px] text-[#555555] mt-1 font-mono">
                  {session.date ? new Date(session.date).toLocaleDateString() : 'Unknown date'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
