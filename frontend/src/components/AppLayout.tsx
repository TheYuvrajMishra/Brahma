import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiActivity, FiMessageSquare, FiCpu, FiLayers, FiKey, FiTerminal } from 'react-icons/fi';
import { motion } from 'framer-motion';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: FiActivity, desc: 'Mission & Task Ledger' },
    { name: 'Playground', path: '/playground', icon: FiMessageSquare, desc: 'Advanced RAG Chat' },
    { name: 'Brahma Brain', path: '/brain', icon: FiCpu, desc: 'Context & Decay Engine' },
    { name: 'Skill Registry', path: '/skills', icon: FiLayers, desc: 'Hunar Executables' },
    { name: 'Credentials', path: '/keys', icon: FiKey, desc: 'LLM & DB Configurations' },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] flex flex-col font-description tracking-wide selection:bg-white selection:text-black">
      {/* Top Decorative Header */}
      <header className="border-b border-[#1c1c1c] bg-[#090909]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded border border-white/20 flex items-center justify-center bg-black">
            <FiTerminal className="text-white text-sm" />
          </div>
          <div>
            <h1 className="font-heading text-lg font-bold text-white leading-none tracking-tight">BRAHMA</h1>
            <p className="text-[10px] uppercase text-[#666666] tracking-[0.2em] font-sans">Cognitive Core System v2.0</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-3 py-1 rounded bg-[#111111] border border-[#222222]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-mono tracking-widest text-[#888888] uppercase">CORE ACTIVE</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 border-r border-[#1c1c1c] bg-[#080808] p-4 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="px-2 py-1">
              <span className="text-[10px] text-[#555555] uppercase tracking-[0.2em] font-sans font-bold">Workspace Navigation</span>
            </div>
            
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                
                return (
                  <Link key={item.path} to={item.path}>
                    <motion.div
                      whileHover={{ x: 4 }}
                      className={`relative flex items-center space-x-3 px-3 py-3 rounded transition-colors group cursor-pointer ${
                        isActive 
                          ? 'bg-[#111111] text-white border border-[#222222]' 
                          : 'text-[#888888] hover:text-[#e5e5e5] hover:bg-[#0a0a0a]'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/4 bottom-1/4 w-[2px] bg-white rounded-r"></div>
                      )}
                      <Icon className={`text-base shrink-0 transition-colors ${isActive ? 'text-white' : 'text-[#666666] group-hover:text-white'}`} />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium leading-none text-white">{item.name}</span>
                        <span className="text-[10px] text-[#555555] group-hover:text-[#888888] mt-0.5 font-sans leading-none">{item.desc}</span>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer Info */}
          <div className="mt-8 pt-4 border-t border-[#121212] px-2 text-[10px] font-sans text-[#444444]">
            <p className="font-mono">SECURE AGENTIC LINK // OK</p>
            <p className="mt-1">Last sync: {new Date().toLocaleDateString()}</p>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 bg-[#050505] p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
