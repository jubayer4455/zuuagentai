import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ImageService, IMAGE_MODELS, ASPECT_RATIOS, STYLE_PRESETS } from '../../services/imageService';
import { OpenRouterService } from '../../services/openrouter';
import { GeneratedImage } from '../../types';
import {
  Sparkles,
  Download,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Maximize2,
  X,
  Sliders,
  Image as ImageIcon,
  Layers,
  Wand2
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

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    setNotification({ message: 'Enhancing prompt with OpenRouter AI...', type: 'info' });
    try {
      const enhanced = await OpenRouterService.enhancePrompt(prompt, 'image', settings.openRouterApiKey);
      setPrompt(enhanced);
      setNotification({ message: 'Prompt enhanced successfully!', type: 'success' });
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
        seed: seed !== '' ? Number(seed) : undefined
      });
      addImage(generated);
      setNotification({ message: 'Image generated successfully!', type: 'success' });
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
    <div className="flex-1 overflow-y-auto bg-neutral-950 p-4 sm:p-6 space-y-8">
      {/* Top Banner */}
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-pink-500" />
              AI Image Studio
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              Generate photorealistic, anime, 3D, and cinematic artwork using Flux 1.1 Pro and Pollinations AI.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Unlimited Free Generations</span>
          </div>
        </div>

        {/* Prompt Input Box */}
        <div className="mt-6 bg-neutral-900 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
          <div className="relative">
            <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
              Image Description / Prompt:
            </label>
            <div className="relative">
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to create (e.g. A cybernetic samurai in Tokyo rain, neon reflections, highly detailed 8k photography)..."
                className="w-full bg-neutral-950 border border-white/10 rounded-xl p-3.5 pr-28 text-xs sm:text-sm text-white placeholder-neutral-500 outline-none focus:border-pink-500/50 resize-none"
              />
              <button
                onClick={handleEnhancePrompt}
                disabled={!prompt.trim() || isEnhancing}
                className="absolute right-3 bottom-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 border border-pink-500/30 text-xs font-medium transition-all disabled:opacity-40"
              >
                {isEnhancing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Wand2 className="w-3.5 h-3.5" />
                )}
                <span>AI Enhance</span>
              </button>
            </div>
          </div>

          {/* Configuration Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Model Selector */}
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-pink-400" />
                Model Engine:
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-pink-500/50"
              >
                {IMAGE_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Aspect Ratio */}
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1.5 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-pink-400" />
                Aspect Ratio:
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {Object.entries(ASPECT_RATIOS).map(([key, item]) => {
                  const isSelected = selectedRatio === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedRatio(key)}
                      className={`py-2 px-1 rounded-xl text-[11px] font-medium border text-center transition-all ${
                        isSelected
                          ? 'bg-pink-600/20 border-pink-500/50 text-white shadow-sm'
                          : 'bg-neutral-950 border-white/5 text-neutral-400 hover:text-white hover:bg-neutral-800'
                      }`}
                    >
                      {key}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Style Selector */}
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                Artistic Style:
              </label>
              <select
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
                className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-pink-500/50"
              >
                {Object.entries(STYLE_PRESETS).map(([key, style]) => (
                  <option key={key} value={key}>
                    {style.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Generate Button */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={isGeneratingImage || !prompt.trim()}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-pink-600/30 transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGeneratingImage ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Image...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Image</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Gallery Section */}
        <div className="mt-10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-pink-400" />
              Your Creations ({images.length})
            </h3>
          </div>

          {images.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl bg-neutral-900/30">
              <ImageIcon className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
              <p className="text-sm text-neutral-400">No images created yet.</p>
              <p className="text-xs text-neutral-500 mt-1">Enter a prompt above to start generating!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="group relative bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden shadow-lg hover:border-pink-500/40 transition-all flex flex-col"
                >
                  <div
                    className="relative aspect-square overflow-hidden bg-neutral-950 cursor-pointer"
                    onClick={() => setPreviewImage(img)}
                  >
                    <img
                      src={img.imageUrl}
                      alt={img.prompt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewImage(img);
                        }}
                        className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md"
                        title="View Fullscreen"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(img.imageUrl, img.prompt);
                        }}
                        className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <p className="text-xs text-neutral-200 line-clamp-2 leading-relaxed">
                      {img.prompt}
                    </p>
                    <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-white/5 text-[11px] text-neutral-400">
                      <span className="capitalize">{img.model} • {img.aspectRatio}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopyPrompt(img.prompt, img.id)}
                          className="p-1 hover:text-white"
                          title="Copy prompt"
                        >
                          {copiedId === img.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => deleteImage(img.id)}
                          className="p-1 hover:text-rose-400"
                          title="Delete image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-neutral-900 border border-white/20 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-white/10">
              <span className="text-xs font-semibold text-neutral-300 truncate max-w-md">
                {previewImage.prompt}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(previewImage.imageUrl, previewImage.prompt)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center p-2 bg-black">
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
