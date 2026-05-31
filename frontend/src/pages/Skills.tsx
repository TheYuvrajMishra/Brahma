import { useState, useEffect } from 'react';
import { FiPlus, FiRefreshCw, FiLoader } from 'react-icons/fi';
import axios from 'axios';
import SkillGrid from '../components/skills/SkillGrid';
import CreateSkillModal from '../components/skills/CreateSkillModal';

export default function Skills() {
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchSkills = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:3000/api/skills');
      setSkills(res.data);
    } catch (err) {
      console.error('Error fetching skills:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#1c1c1c] pb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-white">Hunar Skill Registry</h1>
          <p className="text-xs text-[#888888] font-mono mt-1 tracking-wider uppercase">
            S-XXX Capabilities • Executable Code Sheets • Agent Integrations
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <button
            onClick={fetchSkills}
            className="px-4 py-2 border border-[#222222] hover:border-[#444444] text-xs font-mono rounded flex items-center space-x-2 text-[#888888] hover:text-white transition-all cursor-pointer bg-black"
          >
            <FiRefreshCw className="text-xs" />
          </button>
          <button
            onClick={() => setModalVisible(true)}
            className="px-4 py-2 bg-white text-black hover:bg-transparent hover:text-white border border-white transition-all text-xs font-mono font-bold rounded flex items-center space-x-2 cursor-pointer"
          >
            <FiPlus className="text-xs" />
            <span>REGISTER SKILL</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <FiLoader className="text-white text-2xl animate-spin" />
          <span className="text-xs text-[#888888] font-mono uppercase tracking-widest">Accessing Hunar Registry...</span>
        </div>
      ) : (
        <SkillGrid skills={skills} />
      )}

      {/* Register Skill Modal */}
      <CreateSkillModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreated={fetchSkills}
      />
    </div>
  );
}
