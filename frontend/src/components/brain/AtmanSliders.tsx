import React, { useState, useEffect } from 'react';
import { FiSliders, FiCheck, FiRefreshCw } from 'react-icons/fi';
import { motion } from 'framer-motion';
import axios from 'axios';

interface UserAlignment {
  preferenceId: string;
  observedPreference: string;
  adaptationRequired: string;
  confidenceScore: number;
}

interface AtmanData {
  directness: number;
  philosophicalDepth: number;
  advisoryProactivity: number;
  humanEmpathy: number;
  userAlignments: UserAlignment[];
}

export default function AtmanSliders() {
  const [atman, setAtman] = useState<AtmanData>({
    directness: 4,
    philosophicalDepth: 3,
    advisoryProactivity: 5,
    humanEmpathy: 4,
    userAlignments: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchAtman();
  }, []);

  const fetchAtman = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://127.0.0.1:3000/api/atman');
      setAtman(res.data);
    } catch (err) {
      console.error('Error fetching Atman personality:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSliderChange = (key: keyof Omit<AtmanData, 'userAlignments'>, val: number) => {
    setAtman((prev) => ({
      ...prev,
      [key]: val,
    }));
    setSaved(false);
  };

  const saveAtman = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await axios.post('http://127.0.0.1:3000/api/atman', {
        directness: atman.directness,
        philosophicalDepth: atman.philosophicalDepth,
        advisoryProactivity: atman.advisoryProactivity,
        humanEmpathy: atman.humanEmpathy,
      });
      setAtman(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error updating Atman personality:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="border border-[#1c1c1c] bg-[#090909] p-6 rounded flex flex-col items-center justify-center h-64 space-y-4">
        <FiRefreshCw className="text-white text-xl animate-spin" />
        <span className="text-xs text-[#888888] font-mono tracking-widest uppercase">Hydrating Atman Alignment...</span>
      </div>
    );
  }

  const traits = [
    { key: 'directness' as const, label: 'Cognitive Directness', desc: 'Determines severity vs politeness of reasoning traces' },
    { key: 'philosophicalDepth' as const, label: 'Philosophical Depth', desc: 'Sets propensity for foundational concepts' },
    { key: 'advisoryProactivity' as const, label: 'Advisory Proactivity', desc: 'Controls speed of suggesting optimization suggestions' },
    { key: 'humanEmpathy' as const, label: 'Human Empathy', desc: 'Controls conversational softness and user alignment tuning' },
  ];

  return (
    <div className="border border-[#1c1c1c] bg-[#090909] p-6 rounded flex flex-col justify-between h-full space-y-6">
      <div>
        <div className="flex items-center space-x-2 border-b border-[#1c1c1c] pb-3 mb-4">
          <FiSliders className="text-white text-sm" />
          <h2 className="font-heading text-lg font-bold text-white">Atman Personality Profile</h2>
        </div>
        <p className="text-xs text-[#888888] font-sans leading-relaxed mb-6">
          Calibrate the behavioral model sliders of Brahma. Adjusting these settings shifts the cognitive prioritization engine's routing filters.
        </p>

        <div className="space-y-6">
          {traits.map(({ key, label, desc }) => (
            <div key={key} className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-white font-medium">{label}</span>
                <span className="text-[#888888]">LVL {atman[key]} / 5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={atman[key]}
                onChange={(e) => handleSliderChange(key, parseInt(e.target.value))}
                className="w-full h-1 bg-[#222222] rounded-lg appearance-none cursor-pointer accent-white"
              />
              <p className="text-[10px] text-[#555555] font-sans italic">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-[#121212] flex items-center justify-between">
        <span className="text-[10px] text-[#444444] font-mono">V{atman.userAlignments.length > 0 ? '2' : '1'}.0 PERSISTENCE</span>
        <button
          onClick={saveAtman}
          disabled={saving}
          className="px-4 py-2 border border-white/20 hover:border-white bg-black text-white hover:bg-white hover:text-black transition-all text-xs font-mono rounded flex items-center space-x-2 cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <FiRefreshCw className="animate-spin text-xs" />
          ) : saved ? (
            <FiCheck className="text-xs" />
          ) : null}
          <span>{saving ? 'SYNCHRONIZING...' : saved ? 'SYNCHRONIZED' : 'COMMIT TRAITS'}</span>
        </button>
      </div>
    </div>
  );
}
