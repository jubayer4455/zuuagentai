import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Sparkles, MessageSquare, Image, Video, Cpu, Settings, Menu, Zap } from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    toggleSidebar,
    selectedModel,
    models,
    settings
  } = useAppStore();

  const currentModel = models.find(m => m.id === selectedModel);
  const isFree = currentModel?.is_free || selectedModel.endsWith(':free');

  return (
    <header className="h-16 border-b border-white/10 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-40 px-4 flex items-center justify-between">
      {/* Left: Brand & Mobile Menu */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-white/5 text-neutral-400 hover:text-white transition-colors"
          title="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('chat')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-neutral-200 to-neutral-400 leading-none">
              ZUU AI STUDIO
            </h1>
            <span className="text-[10px] text-purple-400 font-medium tracking-wider uppercase">
              Omni AI Platform
            </span>
          </div>
        </div>
      </div>

      {/* Center: Main Navigation Tabs */}
      <nav className="hidden md:flex items-center gap-1 bg-neutral-900/90 border border-white/5 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'chat'
              ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30 shadow-sm'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          AI Chat
        </button>

        <button
          onClick={() => setActiveTab('image')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'image'
              ? 'bg-pink-600/30 text-pink-300 border border-pink-500/30 shadow-sm'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Image className="w-4 h-4" />
          Image Studio
        </button>

        <button
          onClick={() => setActiveTab('video')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'video'
              ? 'bg-blue-600/30 text-blue-300 border border-blue-500/30 shadow-sm'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Video className="w-4 h-4" />
          Video & HeyGen
        </button>

        <button
          onClick={() => setActiveTab('models')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'models'
              ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 shadow-sm'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Cpu className="w-4 h-4" />
          Model Hub ({models.length || '460+'})
        </button>
      </nav>

      {/* Right: Active Model Badge & Settings */}
      <div className="flex items-center gap-2.5">
        <div
          onClick={() => setActiveTab('models')}
          className="cursor-pointer hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-white/5 hover:border-white/20 transition-all text-xs"
          title="Click to change model"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-neutral-300 font-medium truncate max-w-[150px]">
            {currentModel?.name || selectedModel.split('/').pop()}
          </span>
          {isFree ? (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              FREE
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              PRO
            </span>
          )}
        </div>

        <button
          onClick={() => setActiveTab('settings')}
          className={`p-2 rounded-lg transition-colors ${
            activeTab === 'settings'
              ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
          title="API Keys & Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
