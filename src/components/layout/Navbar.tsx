import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
  MessageSquare,
  Image as ImageIcon,
  Video as VideoIcon,
  Cpu,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  CheckCircle2,
  ChevronDown,
  Layers
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isSidebarOpen,
    toggleSidebar,
    selectedModel,
    models,
    settings
  } = useAppStore();

  const currentModel = models.find(m => m.id === selectedModel);
  const isFree = currentModel?.is_free || selectedModel.endsWith(':free');
  const shortModelName = currentModel?.name?.split(':')[0]?.replace('OpenAI: ', '') || selectedModel.split('/').pop() || 'Model';

  const navItems = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'image', label: 'Image Studio', icon: ImageIcon },
    { id: 'video', label: 'Video Studio', icon: VideoIcon },
    { id: 'models', label: 'Models', icon: Cpu, badge: models.length ? `${models.length}` : '460+' },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <header className="h-14 border-b border-white/[0.08] bg-[#09090b]/90 backdrop-blur-xl sticky top-0 z-40 px-3 sm:px-5 flex items-center justify-between">
      {/* Left: Brand & Sidebar toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors"
          title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          aria-label="Toggle sidebar"
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-4 h-4" />
          ) : (
            <PanelLeftOpen className="w-4 h-4" />
          )}
        </button>

        {/* Brand Mark */}
        <div
          onClick={() => setActiveTab('chat')}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-zinc-100 shadow-sm group-hover:border-zinc-500 transition-colors">
            <Layers className="w-4 h-4 text-zinc-200" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm tracking-tight text-zinc-100">
              ZUU
            </span>
            <span className="text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
              Studio
            </span>
          </div>
        </div>
      </div>

      {/* Center: Clean Segmented Navigation Control */}
      <nav className="hidden md:flex items-center gap-1 bg-zinc-900/80 border border-white/[0.06] p-1 rounded-xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/80 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
              {'badge' in item && item.badge && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Right: Active Model Chip & API Indicator */}
      <div className="flex items-center gap-2">
        {/* Model Indicator Chip */}
        <button
          onClick={() => setActiveTab('models')}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800/80 border border-white/[0.08] hover:border-zinc-600 transition-all text-xs font-medium text-zinc-300"
          title="Switch Model"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="truncate max-w-[120px] sm:max-w-[180px] text-zinc-200">
            {shortModelName}
          </span>
          {isFree ? (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Free
            </span>
          ) : (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
              Pro
            </span>
          )}
          <ChevronDown className="w-3 h-3 text-zinc-500" />
        </button>

        {/* Quick Settings Icon */}
        <button
          onClick={() => setActiveTab('settings')}
          className={`p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors ${
            activeTab === 'settings' ? 'bg-zinc-800 text-zinc-100' : ''
          }`}
          title="Settings & API Keys"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
