import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { OpenRouterModel } from '../../types';
import {
  Cpu,
  Search,
  Zap,
  MessageSquare,
  RefreshCw,
  ExternalLink,
  Layers,
  Eye,
  Check,
  X
} from 'lucide-react';

export const ModelExplorer: React.FC = () => {
  const {
    models,
    isLoadingModels,
    fetchModels,
    selectedModel,
    setSelectedModel,
    setActiveTab,
    createConversation,
    setNotification
  } = useAppStore();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (models.length <= 10) {
      fetchModels();
    }
  }, []);

  const handleSelectModel = (model: OpenRouterModel) => {
    setSelectedModel(model.id);
    createConversation(model.id);
    setActiveTab('chat');
    setNotification({
      message: `Active model switched to ${model.name}`,
      type: 'success'
    });
  };

  const categories = [
    { id: 'all', label: `All Free Models (${models.length})` },
    { id: 'gemini', label: 'Google Gemini' },
    { id: 'gemma', label: 'Google Gemma' },
    { id: 'nvidia', label: 'NVIDIA Nemotron' },
    { id: 'reasoning', label: 'Reasoning Models' },
    { id: 'vision', label: 'Multimodal Vision' },
    { id: 'code', label: 'Coding' }
  ];

  const filteredModels = models.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'gemini') return m.id.includes('gemini');
    if (selectedCategory === 'gemma') return m.id.includes('gemma');
    if (selectedCategory === 'nvidia') return m.id.startsWith('nvidia/');
    if (selectedCategory === 'reasoning') return m.id.includes('reason') || m.id.includes('thinking') || m.id.includes('laguna');
    if (selectedCategory === 'vision') return m.architecture?.modality?.includes('image') || m.id.includes('vl') || m.id.includes('vision') || m.id.includes('gemini');
    if (selectedCategory === 'code') return m.id.includes('code') || m.id.includes('inkling');

    return true;
  });

  const formatContext = (ctx?: number) => {
    if (!ctx) return '';
    if (ctx >= 1000000) return `${(ctx / 1000000).toFixed(0)}M ctx`;
    if (ctx >= 1000) return `${Math.round(ctx / 1000)}k ctx`;
    return `${ctx} ctx`;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#09090b] p-4 sm:p-6 space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-zinc-100 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-zinc-300" />
              Model Directory
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Browse, filter, and chat with 460+ open and proprietary foundation models
            </p>
          </div>

          <button
            onClick={() => {
              fetchModels();
              setNotification({ message: 'Syncing catalog...', type: 'info' });
            }}
            disabled={isLoadingModels}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-medium text-zinc-200 transition-colors self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingModels ? 'animate-spin' : ''}`} />
            <span>Sync Catalog ({models.length})</span>
          </button>
        </div>

        {/* Search & Category Pills */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Filter by name, provider, or architecture (e.g. Claude 3.5, DeepSeek R1, Llama 70b)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-900/90 border border-zinc-700/80 rounded-xl pl-9 pr-9 py-2 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-500 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Models Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredModels.slice(0, 90).map((model) => {
            const isSelected = model.id === selectedModel;
            const promptPrice = (parseFloat(model.pricing.prompt || '0') * 1000000).toFixed(2);

            return (
              <div
                key={model.id}
                className={`rounded-xl border p-3.5 flex flex-col justify-between transition-all ${
                  isSelected
                    ? 'bg-zinc-800/60 border-zinc-600'
                    : 'bg-[#121215] border-white/[0.08] hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xs font-medium text-zinc-100 truncate max-w-[200px]" title={model.name}>
                      {model.name}
                    </h3>
                    {model.is_free ? (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                        FREE
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700 shrink-0">
                        ${promptPrice}/1M
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] font-mono text-zinc-400 mt-1 truncate">
                    {model.id}
                  </p>

                  <p className="text-xs text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                    {model.description || 'OpenRouter high-performance language model.'}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-white/[0.04]">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-2.5">
                    <span className="flex items-center gap-1 font-mono">
                      <Layers className="w-3 h-3 text-zinc-500" />
                      {formatContext(model.context_length)}
                    </span>
                    {model.architecture?.modality && (
                      <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                        <Eye className="w-3 h-3" />
                        {model.architecture.modality.split('->')[0]}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleSelectModel(model)}
                    className={`w-full py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                      isSelected
                        ? 'bg-zinc-100 text-zinc-950 font-medium'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Active Model</span>
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Select & Chat</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredModels.length === 0 && (
          <div className="text-center py-16 border border-zinc-800/80 rounded-2xl bg-zinc-900/30">
            <Cpu className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-xs text-zinc-400 font-medium">No models found matching "{search}"</p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('all');
              }}
              className="mt-2 text-xs text-zinc-400 hover:text-white underline"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
