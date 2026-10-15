import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { OpenRouterModel } from '../../types';
import {
  Search,
  X,
  Check,
  Sparkles,
  Zap,
  BrainCircuit,
  Eye,
  Code2,
  Layers,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface ModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModelSelectorModal: React.FC<ModelSelectorModalProps> = ({ isOpen, onClose }) => {
  const { models, selectedModel, setSelectedModel, setNotification } = useAppStore();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<'featured' | 'free' | 'reasoning' | 'vision' | 'code' | 'all'>('featured');

  const categories = [
    { id: 'featured', label: '🌟 Featured', desc: 'Top-tier models' },
    { id: 'free', label: '⚡ 100% Free', desc: 'Zero cost daily quota' },
    { id: 'reasoning', label: '🧠 Reasoning', desc: 'DeepSeek R1, o1 chain-of-thought' },
    { id: 'vision', label: '👁️ Vision', desc: 'Multimodal image analysis' },
    { id: 'code', label: '💻 Coding', desc: 'Software engineering & agents' },
    { id: 'all', label: `🌐 All (${models.length})`, desc: 'Full OpenRouter catalog' },
  ];

  const filteredModels = useMemo(() => {
    let list = models;

    if (activeCategory === 'featured') {
      const featuredIds = [
        'liquid/lfm-2.5-2.6b:free',
        'poolside/laguna-s-2.1:free',
        'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
        'deepseek/deepseek-r1',
        'deepseek/deepseek-chat',
        'meta-llama/llama-3.3-70b-instruct',
        'google/gemini-2.0-flash-001',
        'openai/gpt-4o',
        'openai/gpt-4o-mini',
        'anthropic/claude-3-5-sonnet-20241022'
      ];
      list = models.filter(m => featuredIds.includes(m.id) || m.is_free || m.id.endsWith(':free'));
    } else if (activeCategory === 'free') {
      list = models.filter(m => m.is_free || m.id.endsWith(':free'));
    } else if (activeCategory === 'reasoning') {
      list = models.filter(m => m.id.includes('r1') || m.id.includes('reason') || m.id.includes('o1') || m.description?.toLowerCase().includes('reasoning'));
    } else if (activeCategory === 'vision') {
      list = models.filter(m => m.architecture?.modality?.includes('image') || m.id.includes('vision') || m.id.includes('4o') || m.id.includes('sonnet'));
    } else if (activeCategory === 'code') {
      list = models.filter(m => m.id.includes('coder') || m.id.includes('code') || m.id.includes('sonnet') || m.id.includes('deepseek'));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = models.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        (m.description && m.description.toLowerCase().includes(q))
      );
    }

    return list;
  }, [models, activeCategory, search]);

  if (!isOpen) return null;

  const handleSelect = (model: OpenRouterModel) => {
    setSelectedModel(model.id);
    setNotification({
      message: `Active model switched to ${model.name}`,
      type: 'success'
    });
    onClose();
  };

  const getProviderBadge = (modelId: string) => {
    if (modelId.startsWith('anthropic/')) {
      return { name: 'Anthropic', bg: 'bg-orange-500/10 text-orange-400 border-orange-500/20' };
    }
    if (modelId.startsWith('openai/')) {
      return { name: 'OpenAI', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
    }
    if (modelId.startsWith('deepseek/')) {
      return { name: 'DeepSeek', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
    }
    if (modelId.startsWith('google/')) {
      return { name: 'Google', bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' };
    }
    if (modelId.startsWith('meta-llama/') || modelId.startsWith('meta/')) {
      return { name: 'Meta', bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' };
    }
    if (modelId.startsWith('liquid/')) {
      return { name: 'Liquid AI', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
    }
    return { name: modelId.split('/')[0] || 'AI', bg: 'bg-neutral-800 text-neutral-400 border-white/5' };
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Select AI Model
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Choose from {models.length} state-of-the-art models for chat, coding, reasoning, and vision.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Categories */}
        <div className="p-4 border-b border-white/5 bg-neutral-950/40 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, provider, or architecture (e.g. Claude 3.5, DeepSeek R1, GPT-4o, free)..."
              className="w-full bg-neutral-950 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-neutral-500 outline-none focus:border-purple-500/50"
              autoFocus
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-3 text-neutral-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id as any);
                  setSearch('');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  activeCategory === cat.id
                    ? 'bg-purple-600/20 border-purple-500/40 text-purple-300 shadow-sm'
                    : 'bg-neutral-900 border-white/5 text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Models List */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-3 scrollbar-thin scrollbar-thumb-white/10">
          {filteredModels.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-neutral-500 text-xs">
              No models match "{search}". Try searching another name or reset filters.
            </div>
          ) : (
            filteredModels.map((model) => {
              const isSelected = model.id === selectedModel;
              const provider = getProviderBadge(model.id);
              const promptPrice = (parseFloat(model.pricing.prompt || '0') * 1000000).toFixed(2);

              return (
                <div
                  key={model.id}
                  onClick={() => handleSelect(model)}
                  className={`group relative rounded-xl border p-3.5 cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-purple-600/15 border-purple-500/50 shadow-md shadow-purple-600/10'
                      : 'bg-neutral-950/70 border-white/5 hover:border-white/20 hover:bg-neutral-800/60'
                  }`}
                >
                  <div>
                    {/* Top row: Name & Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${provider.bg}`}>
                            {provider.name}
                          </span>
                          {model.is_free && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              FREE
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-white mt-1.5 truncate group-hover:text-purple-300 transition-colors">
                          {model.name}
                        </h4>
                      </div>

                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-white/10 group-hover:border-purple-500/50 flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white" />
                        </div>
                      )}
                    </div>

                    {/* Model ID & Description */}
                    <p className="text-[11px] font-mono text-neutral-500 mt-1 truncate">
                      {model.id}
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-1.5 line-clamp-2 leading-relaxed">
                      {model.description || 'High-performance OpenRouter model for versatile text and coding tasks.'}
                    </p>
                  </div>

                  {/* Footer Stats */}
                  <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-white/5 text-[10px] text-neutral-400">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3 text-neutral-500" />
                      Context: {Math.round(model.context_length / 1000)}k
                    </span>

                    {!model.is_free ? (
                      <span className="font-mono text-neutral-400">
                        ${promptPrice} / 1M tokens
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-semibold">
                        Free tier daily quota
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-white/10 bg-neutral-950 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Currently Active: <strong className="text-white">{selectedModel}</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
