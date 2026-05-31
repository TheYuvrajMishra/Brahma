import React, { useState } from 'react';
import { FiSearch, FiPlus, FiCpu, FiTag, FiRefreshCw } from 'react-icons/fi';
import axios from 'axios';

interface Entity {
  entityId: string;
  name: string;
  category: string;
  scope: string;
  relationships: string;
}

interface EntityRegistryProps {
  entities: Entity[];
  onRefresh: () => void;
}

export default function EntityRegistry({ entities, onRefresh }: EntityRegistryProps) {
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // New Entity Form State
  const [entityId, setEntityId] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Framework');
  const [scope, setScope] = useState('');
  const [relationships, setRelationships] = useState('');

  const filteredEntities = entities.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.entityId.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entityId || !name || !scope || !relationships) return;

    setSubmitting(true);
    try {
      await axios.post('http://127.0.0.1:3000/api/zehn/entities', {
        entityId,
        name,
        category,
        scope,
        relationships,
      });
      setShowAddForm(false);
      // Reset form
      setEntityId('');
      setName('');
      setScope('');
      setRelationships('');
      onRefresh();
    } catch (err) {
      console.error('Error adding entity:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border border-[#1c1c1c] bg-[#090909] p-6 rounded flex flex-col space-y-4">
      <div className="flex justify-between items-center border-b border-[#1c1c1c] pb-3">
        <div className="flex items-center space-x-2">
          <FiCpu className="text-white text-sm" />
          <h2 className="font-heading text-lg font-bold text-white">Entity Index (EI)</h2>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1 border border-white/20 hover:border-white text-white hover:bg-white hover:text-black transition-all text-xs font-mono rounded flex items-center space-x-1 cursor-pointer"
        >
          <FiPlus className="text-xs" />
          <span>{showAddForm ? 'CANCEL' : 'INDEX ENTITY'}</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="p-4 border border-[#222222] bg-black rounded space-y-4 text-xs font-mono">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[#888888] mb-1">Entity ID (e.g. E-010)</label>
              <input
                type="text"
                placeholder="E-010"
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                className="w-full bg-[#111111] border border-[#222222] text-white p-2 rounded focus:outline-none focus:border-white"
                required
              />
            </div>
            <div>
              <label className="block text-[#888888] mb-1">Name</label>
              <input
                type="text"
                placeholder="entity_name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#111111] border border-[#222222] text-white p-2 rounded focus:outline-none focus:border-white"
                required
              />
            </div>
            <div>
              <label className="block text-[#888888] mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#111111] border border-[#222222] text-white p-2 rounded focus:outline-none focus:border-white"
              >
                <option value="Framework">Framework</option>
                <option value="Engine">Engine</option>
                <option value="File">File</option>
                <option value="Directory">Directory</option>
                <option value="User">User</option>
                <option value="Service">Service</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[#888888] mb-1">Scope / Definition</label>
            <input
              type="text"
              placeholder="System definition scope"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="w-full bg-[#111111] border border-[#222222] text-white p-2 rounded focus:outline-none focus:border-white"
              required
            />
          </div>
          <div>
            <label className="block text-[#888888] mb-1">Relationships & Dependencies</label>
            <input
              type="text"
              placeholder="E.g., Parent of Buddhi, dependency on Hunar"
              value={relationships}
              onChange={(e) => setRelationships(e.target.value)}
              className="w-full bg-[#111111] border border-[#222222] text-white p-2 rounded focus:outline-none focus:border-white"
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 bg-white text-black hover:bg-[#e5e5e5] transition-all text-xs font-mono font-bold rounded flex items-center justify-center space-x-1 cursor-pointer"
          >
            {submitting ? <FiRefreshCw className="animate-spin" /> : null}
            <span>{submitting ? 'RECORDING...' : 'COMMIT TO ZEHN INDEX'}</span>
          </button>
        </form>
      )}

      {/* Search Input */}
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555555]" />
        <input
          type="text"
          placeholder="Filter indexed entities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-black border border-[#1c1c1c] rounded p-2.5 pl-10 text-xs font-mono text-white placeholder-[#555555] focus:outline-none focus:border-white"
        />
      </div>

      {/* Grid of entities */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-[#1c1c1c] text-[#888888]">
              <th className="py-2.5 font-medium w-20">ID</th>
              <th className="py-2.5 font-medium w-40">Entity Name</th>
              <th className="py-2.5 font-medium w-28">Category</th>
              <th className="py-2.5 font-medium">Definition Scope & Relationships</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#121212]">
            {filteredEntities.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-[#555555] italic">No matching entities found in index</td>
              </tr>
            ) : (
              filteredEntities.map((e) => (
                <tr key={e.entityId} className="hover:bg-[#0c0c0c]/50 transition-colors group">
                  <td className="py-3 font-bold text-white">{e.entityId}</td>
                  <td className="py-3">
                    <code className="px-1.5 py-0.5 rounded bg-black border border-[#222222] text-[#e5e5e5] text-[11px]">{e.name}</code>
                  </td>
                  <td className="py-3">
                    <span className="inline-flex items-center space-x-1 text-[10px] uppercase font-sans tracking-wider text-[#888888]">
                      <FiTag className="text-[10px]" />
                      <span>{e.category}</span>
                    </span>
                  </td>
                  <td className="py-3">
                    <p className="text-[#888888] font-description text-sm leading-none tracking-wide">{e.scope}</p>
                    <p className="text-[10px] text-[#555555] mt-1">Deps: {e.relationships}</p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
