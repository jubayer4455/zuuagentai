import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ImageService, IMAGE_MODELS, ASPECT_RATIOS, STYLE_PRESETS } from '../../services/imageService';
import { OpenRouterService } from '../../services/openrouter';
import { GeneratedImage } from '../../types';
import {
  Download,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Maximize2,
  X,
  Sliders,
  Image as ImageIcon,
  Sparkles,
  ArrowRight,
  ChevronDown
} from 'lucide-react';

export const ImageStudio: React.FC = () => {
  const {
    images,
    addImage,
    deleteImage,
    isGeneratingImage,
    setIsGeneratingImage,
    settings,
    setNotification
  } = useAppStore();

  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('flux');
  const [selectedRatio, setSelectedRatio] = useState('1:1');
  const [selectedStyle, setSelectedStyle] = useState('photorealistic');
  const [seed, setSeed] = useState<number | ''>('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [previewImage, setPreviewImage] = useState<GeneratedImage | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    setNotification({ message: 'Enhancing prompt...', type: 'info' });
    try {
      const enhanced = await OpenRouterService.enhancePrompt(prompt, 'image', settings.openRouterApiKey);
      setPrompt(enhanced);
      setNotification({ message: 'Prompt enhanced', type: 'success' });
    } catch {
      setNotification({ message: 'Failed to enhance prompt', type: 'error' });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setNotification({ message: 'Please enter a prompt', type: 'error' });
      return;
    }

    setIsGeneratingImage(true);
    try {
      const generated = await ImageService.generateImage({
        prompt: prompt.trim(),
        negativePrompt: negativePrompt.trim() || undefined,
        model: selectedModel,
        aspectRatio: selectedRatio,
        style: selectedStyle,
        seed: seed !== '' ? Number(seed) : undefined,
        geminiApiKey: settings.geminiApiKey
      });
      addImage(generated);
      setNotification({ message: 'Image rendered successfully', type: 'success' });
    } catch (err: any) {
      setNotification({ message: err.message || 'Image generation failed', type: 'error' });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleCopyPrompt = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = async (imageUrl: string, filename: string) => {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename.slice(0, 30).replace(/[^a-z0-9]/gi, '_')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(imageUrl, '_blank');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-[#09090b] overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="pb-4 border-b border-white/[0.08] flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-zinc-100 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-zinc-300" />
              Image Studio
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Photorealistic synthesis with Flux 1.1 Pro & SDXL Turbo
            </p>
          </div>
        </div>

        {/* Studio Control Panel */}
        <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          {/* Prompt input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-300">Prompt</label>
              <button
                onClick={handleEnhancePrompt}
                disabled={isEnhancing || !prompt.trim()}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-40"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isEnhancing ? 'Enhancing...' : 'Enhance Prompt'}</span>
              </button>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleGenerate();
                }
              }}
              placeholder="Describe your vision in detail (e.g. Cinematic portrait of an architect in an open glass modernist pavilion at golden hour, 35mm photography, subtle grain)..."
              rows={3}
              className="w-full bg-zinc-900/90 border border-zinc-700/80 rounded-xl p-3 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-500 resize-none transition-colors"
            />
          </div>

          {/* Model and Settings Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Model Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Model Engine</label>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(IMAGE_MODELS).map(([key, model]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedModel(key)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                      selectedModel === key
                        ? 'bg-zinc-800 text-zinc-100 border-zinc-600 shadow-sm'
                        : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    <div className="font-semibold text-xs truncate">{model.name}</div>
                    <div className="text-[10px] text-zinc-400 line-clamp-1">{model.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Aspect Ratio</label>
              <div className="grid grid-cols-3 gap-1">
                {Object.entries(ASPECT_RATIOS).map(([ratio, meta]) => (
                  <button
                    key={ratio}
                    onClick={() => setSelectedRatio(ratio)}
                    className={`px-2 py-1.5 rounded-lg text-xs font-mono border transition-all text-center ${
                      selectedRatio === ratio
                        ? 'bg-zinc-800 text-zinc-100 border-zinc-600'
                        : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    <span>{ratio}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Style Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Style</label>
              <select
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none focus:border-zinc-500"
              >
                {Object.entries(STYLE_PRESETS).map(([key, style]) => (
                  <option key={key} value={key}>
                    {style.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Advanced toggle */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 py-1"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{showAdvanced ? 'Hide advanced settings' : 'Show advanced settings (Seed, Negative prompt)'}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>

            {showAdvanced && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 mt-2 border-t border-white/[0.06]">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-400">Negative Prompt</label>
                  <input
                    type="text"
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    placeholder="blurry, distorted, low quality..."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-zinc-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-400">Seed (Optional)</label>
                  <input
                    type="number"
                    value={seed}
                    onChange={(e) => setSeed(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Random"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-zinc-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Render Action Button */}
          <div className="pt-2 flex items-center justify-between border-t border-white/[0.06]">
            <span className="text-xs text-zinc-400 font-mono hidden sm:inline">
              Press ⌘ + Return to render
            </span>

            <button
              onClick={handleGenerate}
              disabled={isGeneratingImage || !prompt.trim()}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs transition-all shadow-sm active:scale-[0.99] disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {isGeneratingImage ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <span>Render Image</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Gallery Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-200">
              Creations ({images.length})
            </h3>
          </div>

          {images.length === 0 ? (
            <div className="text-center py-16 border border-zinc-800/80 rounded-2xl bg-zinc-900/30">
              <ImageIcon className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-xs text-zinc-400 font-medium">No images rendered yet</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">Enter a prompt above to generate</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="group relative bg-[#121215] border border-white/[0.08] hover:border-zinc-600 rounded-xl overflow-hidden transition-all flex flex-col shadow-sm"
                >
                  <div
                    className="relative aspect-square overflow-hidden bg-zinc-950 cursor-pointer"
                    onClick={() => setPreviewImage(img)}
                  >
                    <img
                      src={img.imageUrl}
                      alt={img.prompt}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                      loading="lazy"
                    />

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewImage(img);
                        }}
                        className="p-1.5 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 text-white"
                        title="Expand"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(img.imageUrl, img.prompt);
                        }}
                        className="p-1.5 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 text-white"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-2.5 flex-1 flex flex-col justify-between">
                    <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                      {img.prompt}
                    </p>
                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-white/[0.04] text-[10px] text-zinc-400">
                      <span className="capitalize">{img.model} • {img.aspectRatio}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopyPrompt(img.prompt, img.id)}
                          className="p-1 hover:text-zinc-200"
                          title="Copy prompt"
                        >
                          {copiedId === img.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        <button
                          onClick={() => deleteImage(img.id)}
                          className="p-1 hover:text-rose-400"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-[#121215] border border-white/[0.1] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
              <span className="text-xs text-zinc-200 font-medium truncate max-w-md">
                {previewImage.prompt}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(previewImage.imageUrl, previewImage.prompt)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center p-3 bg-black">
              <img
                src={previewImage.imageUrl}
                alt={previewImage.prompt}
                className="max-h-[75vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
