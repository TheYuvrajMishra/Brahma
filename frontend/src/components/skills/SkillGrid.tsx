import React, { useState } from 'react';
import { FiSearch, FiLayers, FiTag, FiClock } from 'react-icons/fi';

interface Skill {
  skillId: string;
  category: string;
  name: string;
  status: 'ACTIVE' | 'DEPRECATED';
  description: string;
  fileLink: string;
  createdOn: Date;
  lastModified: Date;
}

interface SkillGridProps {
  skills: Skill[];
}

export default function SkillGrid({ skills }: SkillGridProps) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'DEPRECATED'>('ALL');

  const filtered = skills.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.skillId.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex flex-col space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555555] text-sm" />
          <input
            type="text"
            placeholder="Search skills by name, category, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#090909] border border-[#1c1c1c] rounded p-2.5 pl-9 text-xs font-mono text-white placeholder-[#555555] focus:outline-none focus:border-[#444444]"
          />
        </div>
        <div className="flex rounded overflow-hidden border border-[#1c1c1c]">
          {(['ALL', 'ACTIVE', 'DEPRECATED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-2 text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                filterStatus === status
                  ? 'bg-white text-black'
                  : 'bg-[#090909] text-[#666666] hover:text-white hover:bg-[#111111]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <p className="text-[10px] text-[#555555] font-mono">
        Showing {filtered.length} of {skills.length} registered skills
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="border border-[#1c1c1c] rounded p-12 text-center bg-[#090909]">
          <FiLayers className="text-[#444444] text-3xl mx-auto mb-3" />
          <p className="text-sm text-[#555555] font-mono">No skills match the current filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((skill) => (
            <div
              key={skill.skillId}
              className={`border rounded p-4 bg-[#090909] flex flex-col space-y-3 hover:border-[#333333] transition-colors group ${
                skill.status === 'DEPRECATED' ? 'border-[#1c1c1c] opacity-50' : 'border-[#1c1c1c]'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <code className="text-[10px] font-mono text-[#888888]">{skill.skillId}</code>
                    <span className={`text-[9px] border px-1.5 py-0.5 rounded font-mono ${
                      skill.status === 'ACTIVE' ? 'border-white/20 text-white' : 'border-[#333333] text-[#555555]'
                    }`}>
                      {skill.status}
                    </span>
                  </div>
                  <code className="text-sm text-white font-mono block truncate group-hover:text-white">
                    {skill.name}
                  </code>
                </div>
                <div className="shrink-0 p-1.5 border border-[#1c1c1c] rounded text-[#555555]">
                  <FiLayers className="text-xs" />
                </div>
              </div>

              {/* Category badge */}
              <div className="flex items-center space-x-1">
                <FiTag className="text-[#555555] text-[10px]" />
                <span className="text-[10px] text-[#888888] font-sans uppercase tracking-wider">{skill.category}</span>
              </div>

              {/* Description */}
              <p className="text-xs text-[#888888] font-description leading-relaxed flex-1 line-clamp-3">
                {skill.description}
              </p>

              {/* Footer */}
              <div className="flex items-center space-x-1 pt-2 border-t border-[#111111]">
                <FiClock className="text-[#444444] text-[10px]" />
                <span className="text-[9px] text-[#555555] font-mono">
                  Modified {new Date(skill.lastModified).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
