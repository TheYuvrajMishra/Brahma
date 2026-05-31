import React, { useState } from 'react';
import { FiX, FiRefreshCw, FiLayers } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

interface CreateSkillModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const CATEGORIES = ['orchestration', 'memory', 'retrieval', 'execution', 'discord', 'utility'];

export default function CreateSkillModal({ visible, onClose, onCreated }: CreateSkillModalProps) {
  const [skillName, setSkillName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [paramSpec, setParamSpec] = useState('{"key": "value"}');
  const [triggersText, setTriggersText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!skillName || !description || !triggersText) {
      setError('All fields are required.');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post('http://127.0.0.1:3000/api/skills', {
        skillName,
        description,
        category,
        paramSpec,
        triggers: triggersText,
      });
      onCreated();
      onClose();
      // Reset
      setSkillName('');
      setDescription('');
      setParamSpec('{"key": "value"}');
      setTriggersText('');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create skill.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed inset-x-0 top-1/2 -translate-y-1/2 mx-auto w-full max-w-xl z-50 bg-[#090909] border border-[#2a2a2a] rounded p-6 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center space-x-2">
                <FiLayers className="text-white" />
                <h2 className="font-heading text-lg font-bold text-white">Register New Skill</h2>
              </div>
              <button onClick={onClose} className="text-[#888888] hover:text-white transition-colors cursor-pointer">
                <FiX />
              </button>
            </div>

            <p className="text-xs text-[#666666] font-description mb-5 leading-relaxed">
              A new Skill Sheet will be auto-generated in <code className="text-[#aaaaaa]">skills/brahma/</code> and registered with a unique <code className="text-[#aaaaaa]">S-XXX</code> ID in Hunar.md.
            </p>

            {error && (
              <div className="mb-4 px-4 py-2 border border-red-500/30 bg-red-500/5 rounded text-xs text-red-400 font-mono">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[#888888] mb-1.5">Skill Name</label>
                  <input
                    type="text"
                    value={skillName}
                    onChange={(e) => setSkillName(e.target.value)}
                    placeholder="e.g., Summarize Document"
                    className="w-full bg-black border border-[#222222] text-white p-2.5 rounded focus:outline-none focus:border-white placeholder-[#444444]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[#888888] mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-black border border-[#222222] text-white p-2.5 rounded focus:outline-none focus:border-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#888888] mb-1.5">Keyword Triggers</label>
                  <input
                    type="text"
                    value={triggersText}
                    onChange={(e) => setTriggersText(e.target.value)}
                    placeholder="e.g., summarize, condense"
                    className="w-full bg-black border border-[#222222] text-white p-2.5 rounded focus:outline-none focus:border-white placeholder-[#444444]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#888888] mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What this skill does and when it should be invoked..."
                  rows={3}
                  className="w-full bg-black border border-[#222222] text-white p-2.5 rounded focus:outline-none focus:border-white placeholder-[#444444] resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[#888888] mb-1.5">Param Spec (JSON)</label>
                <textarea
                  value={paramSpec}
                  onChange={(e) => setParamSpec(e.target.value)}
                  rows={3}
                  className="w-full bg-black border border-[#222222] text-white p-2.5 rounded focus:outline-none focus:border-white font-mono text-[11px] resize-none"
                />
              </div>

              <div className="pt-3 border-t border-[#1c1c1c] flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 border border-[#222222] hover:border-[#444444] text-[#888888] hover:text-white transition-all rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-white text-black hover:bg-[#e5e5e5] transition-all rounded font-bold flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
                >
                  {submitting && <FiRefreshCw className="animate-spin text-xs" />}
                  <span>{submitting ? 'REGISTERING...' : 'REGISTER SKILL'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
