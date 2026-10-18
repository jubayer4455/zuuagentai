import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { OpenRouterModel } from '../../types';
import {
  Search,
  X,
  Check,
  Cpu,
  Zap,
  Eye,
  Code2,
  Brain,
  SlidersHorizontal
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
    { id: 'featured', label: 'Featured', icon: Zap },
    { id: 'free', label: '100% Free', icon: Check },
    { id: 'reasoning', label: 'Reasoning', icon: Brain },
    { id: 'vision', label: 'Vision', icon: Eye },
    { id: 'code', label: 'Coding', icon: Code2 },
    { id: 'all', label: `All (${models.length})`, icon: Cpu },
  ] as const;

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
      message: `Switched model to ${model.name}`,
      type: 'success'
    });
    onClose();
  };

  const getProviderTag = (modelId: string) => {
    if (modelId.startsWith('anthropic/')) return 'Anthropic';
    if (modelId.startsWith('openai/')) return 'OpenAI';
    if (modelId.startsWith('deepseek/')) return 'DeepSeek';
    if (modelId.startsWith('google/')) return 'Google';
    if (modelId.startsWith('meta-llama/') || modelId.startsWith('meta/')) return 'Meta';
    if (modelId.startsWith('liquid/')) return 'Liquid AI';
    if (modelId.startsWith('mistralai/')) return 'Mistral';
    return modelId.split('/')[0] || 'AI';
  };

  const formatContext = (ctx?: number) => {
    if (!ctx) return '';
    if (ctx >= 1000000) return `${(ctx / 1000000).toFixed(0)}M ctx`;
    if (ctx >= 1000) return `${Math.round(ctx / 1000)}k ctx`;
    return `${ctx} ctx`;
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-[#121215] border border-white/[0.09] rounded-2xl w-full max-w-3xl max-h-[82vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-zinc-300">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                Select Model
              </h2>
              <p className="text-xs text-zinc-400">
                Choose an active LLM for chat completions and multimodal vision
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar & Categories */}
        <div className="p-4 border-b border-white/[0.06] bg-[#0c0c0e]/60 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, provider, or architecture (e.g. Claude 3.5, DeepSeek R1, GPT-4o)..."
              className="w-full bg-zinc-900/90 border border-zinc-700/80 rounded-xl pl-9 pr-9 py-2 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-500 transition-colors"
              autoFocus
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

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Models List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 divide-y divide-white/[0.04]">
          {filteredModels.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-xs text-zinc-500">No models match your query.</p>
            </div>
          ) : (
            filteredModels.map((model) => {
              const isSelected = selectedModel === model.id;
              const provider = getProviderTag(model.id);
              const isFree = model.is_free || model.id.endsWith(':free');

              return (
                <div
                  key={model.id}
                  onClick={() => handleSelect(model)}
                  className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-zinc-800/80 border border-zinc-700/80'
                      : 'hover:bg-zinc-800/40 border border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1 pr-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-zinc-100 group-hover:text-white transition-colors">
                          {model.name}
                        </span>

                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                          {provider}
                        </span>

                        {isFree ? (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Free
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                            Pro
                          </span>
                        )}

                        {model.context_length && (
                          <span className="text-[10px] font-mono text-zinc-500">
                            {formatContext(model.context_length)}
                          </span>
                        )}
                      </div>

                      {model.description && (
                        <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                          {model.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                        <Check className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/[0.08] bg-[#0c0c0e] flex items-center justify-between text-[11px] text-zinc-500">
          <span>Showing {filteredModels.length} models</span>
          <span>Click any model to switch instantly</span>
        </div>
      </div>
    </div>
  );
};
