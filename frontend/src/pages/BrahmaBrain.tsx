import { useState, useEffect } from 'react';
import axios from 'axios';
import AtmanSliders from '../components/brain/AtmanSliders';
import EntityRegistry from '../components/brain/EntityRegistry';
import SessionTimeline from '../components/brain/SessionTimeline';

export default function BrahmaBrain() {
  const [zehnData, setZehnData] = useState<any>(null);
  const [_loading, setLoading] = useState(true);

  const fetchZehn = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:3000/api/zehn');
      setZehnData(res.data);
    } catch (err) {
      console.error('Error fetching Zehn memory graph:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZehn();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#1c1c1c] pb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-white">Brahma Brain</h1>
          <p className="text-xs text-[#888888] font-mono mt-1 tracking-wider uppercase">
            Cognitive State • Adaptive Personality • Zehn Semantic Graph
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 h-full">
          <AtmanSliders />
        </div>
        <div className="lg:col-span-2 space-y-8">
          <SessionTimeline zehnData={zehnData} />
          <EntityRegistry
            entities={zehnData?.entities || []}
            onRefresh={fetchZehn}
          />
        </div>
      </div>
    </div>
  );
}
