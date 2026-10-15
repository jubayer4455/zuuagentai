import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { OpenRouterModel } from '../../types';
import {
  Cpu,
  Search,
  Zap,
  DollarSign,
  MessageSquare,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Layers,
  Eye,
  Check
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
    { id: 'all', label: `All (${models.length})` },
    { id: 'free', label: `Free Models (${models.filter(m => m.is_free).length})` },
    { id: 'deepseek', label: 'DeepSeek (R1, V3)' },
    { id: 'openai', label: 'OpenAI (GPT-4o, Mini)' },
    { id: 'anthropic', label: 'Anthropic (Claude 3.5)' },
    { id: 'google', label: 'Google (Gemini 2.0)' },
    { id: 'meta', label: 'Meta (Llama 3.3)' },
    { id: 'vision', label: 'Multimodal Vision' }
  ];

  const filteredModels = models.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'free') return m.is_free;
    if (selectedCategory === 'openai') return m.id.startsWith('openai/');
    if (selectedCategory === 'anthropic') return m.id.startsWith('anthropic/');
    if (selectedCategory === 'google') return m.id.startsWith('google/');
    if (selectedCategory === 'deepseek') return m.id.startsWith('deepseek/');
    if (selectedCategory === 'meta') return m.id.startsWith('meta-llama/') || m.id.startsWith('meta/');
    if (selectedCategory === 'vision') return m.architecture?.modality?.includes('image');

    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-950 p-4 sm:p-6 space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Cpu className="w-6 h-6 text-emerald-400" />
              OpenRouter Model Hub
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              Browse, filter, and chat with 460+ cutting-edge AI models through your connected OpenRouter key.
            </p>
          </div>

          <button
            onClick={() => {
              fetchModels();
              setNotification({ message: 'Refreshing OpenRouter models catalog...', type: 'info' });
            }}
            disabled={isLoadingModels}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-xs font-semibold text-neutral-200 transition-all self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingModels ? 'animate-spin text-purple-400' : ''}`} />
            <span>Sync Models ({models.length})</span>
          </button>
        </div>

        {/* Search & Categories */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400" />
            <input
              type="text"
              placeholder="Search models by name, provider, or architecture (e.g. Claude 3.5, DeepSeek R1, Llama 70b, free)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-neutral-900 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-neutral-500 outline-none focus:border-emerald-500/50 shadow-md"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                    : 'bg-neutral-900 text-neutral-400 border-white/5 hover:text-white hover:bg-neutral-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Models Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModels.slice(0, 90).map((model) => {
            const isSelected = model.id === selectedModel;
            const promptPrice = (parseFloat(model.pricing.prompt || '0') * 1000000).toFixed(2);
            const compPrice = (parseFloat(model.pricing.completion || '0') * 1000000).toFixed(2);

            return (
              <div
                key={model.id}
                className={`rounded-2xl border p-4 flex flex-col justify-between transition-all shadow-lg ${
                  isSelected
                    ? 'bg-purple-950/20 border-purple-500/50 shadow-purple-500/10'
                    : 'bg-neutral-900/90 border-white/5 hover:border-white/20 hover:bg-neutral-900'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-white truncate max-w-[200px]" title={model.name}>
                      {model.name}
                    </h3>
                    {model.is_free ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                        FREE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-800 text-neutral-400 border border-white/5 shrink-0">
                        ${promptPrice} / 1M
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] font-mono text-purple-400/80 mt-1 truncate">
                    {model.id}
                  </p>

                  <p className="text-xs text-neutral-400 mt-2 line-clamp-2 leading-relaxed">
                    {model.description || 'OpenRouter high-performance language model.'}
                  </p>
                </div>

                <div className="pt-4 mt-3 border-t border-white/5">
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-3">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-neutral-500" />
                      Context: {Math.round(model.context_length / 1000)}k
                    </span>
                    {model.architecture?.modality && (
                      <span className="flex items-center gap-1 text-[10px] text-neutral-500">
                        <Eye className="w-3 h-3" />
                        {model.architecture.modality.split('->')[0]}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleSelectModel(model)}
                    className={`w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                        : 'bg-neutral-800 hover:bg-purple-600 hover:text-white text-neutral-200'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Active in Chat</span>
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat with this Model</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredModels.length === 0 && (
          <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl bg-neutral-900/30">
            <Cpu className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <p className="text-sm text-neutral-400">No models found matching "{search}"</p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('all');
              }}
              className="mt-3 text-xs text-purple-400 hover:underline"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
