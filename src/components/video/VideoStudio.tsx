import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
  VideoService,
  POPULAR_HEYGEN_AVATARS,
  POPULAR_HEYGEN_VOICES,
  VIDEO_MOTION_PRESETS
} from '../../services/videoService';
import { OpenRouterService } from '../../services/openrouter';
import { GeneratedVideo } from '../../types';
import {
  Video as VideoIcon,
  Play,
  Download,
  Trash2,
  RefreshCw,
  Sparkles,
  Maximize2,
  Sliders,
  Check,
  X,
  Layers,
  ArrowRight,
  UserCheck,
  Film,
  Camera
} from 'lucide-react';

export const VideoStudio: React.FC = () => {
  const {
    videos,
    addVideo,
    deleteVideo,
    isGeneratingVideo,
    setIsGeneratingVideo,
    settings,
    setNotification
  } = useAppStore();

  const [activeSubTab, setActiveSubTab] = useState<'motion' | 'heygen'>('motion');

  // Motion Video State
  const [motionPrompt, setMotionPrompt] = useState('');
  const [motionPreset, setMotionPreset] = useState(VIDEO_MOTION_PRESETS[0].id);
  const [motionRatio, setMotionRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [generationPhase, setGenerationPhase] = useState<string>('');
  const [generationPercent, setGenerationPercent] = useState<number>(0);

  // HeyGen Avatar State
  const [topic, setTopic] = useState('');
  const [script, setScript] = useState('');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(POPULAR_HEYGEN_AVATARS[0].avatar_id);
  const [selectedVoice, setSelectedVoice] = useState(POPULAR_HEYGEN_VOICES[0].voice_id);
  const [scriptLanguage, setScriptLanguage] = useState('Bengali (বাংলা)');
  const [scriptTone, setScriptTone] = useState('Professional');
  const [scriptDuration, setScriptDuration] = useState(30);
  const [heygenRatio, setHeygenRatio] = useState<'16:9' | '9:16'>('16:9');

  // Active Video Lightbox Modal
  const [activeVideoModal, setActiveVideoModal] = useState<GeneratedVideo | null>(null);

  // AI Script Generation with OpenRouter
  const handleGenerateScript = async () => {
    if (!topic.trim()) {
      setNotification({ message: 'Please enter a video topic or hook', type: 'error' });
      return;
    }

    setIsGeneratingScript(true);
    setNotification({ message: 'Generating script...', type: 'info' });
    try {
      const generatedScript = await VideoService.generateScript({
        topic: topic.trim(),
        tone: scriptTone,
        language: scriptLanguage,
        durationSeconds: scriptDuration,
        apiKey: settings.openRouterApiKey
      });
      setScript(generatedScript);
      setNotification({ message: 'Script ready', type: 'success' });
    } catch (err: any) {
      setNotification({ message: err.message || 'Script generation failed', type: 'error' });
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Render Motion Video
  const handleRenderMotionVideo = async () => {
    if (!motionPrompt.trim()) {
      setNotification({ message: 'Please describe the scene for your video', type: 'error' });
      return;
    }

    setIsGeneratingVideo(true);
    setGenerationPercent(10);
    setGenerationPhase('Connecting to neural diffusion engine...');

    try {
      const videoResult = await VideoService.generateMotionVideo({
        prompt: motionPrompt.trim(),
        motionPreset: motionPreset,
        aspectRatio: motionRatio,
        onProgress: (percent: number, status: string) => {
          setGenerationPhase(status);
          setGenerationPercent(percent);
        }
      });

      addVideo(videoResult);
      setNotification({ message: 'Video rendered successfully', type: 'success' });
    } catch (err: any) {
      setNotification({ message: err.message || 'Video rendering failed', type: 'error' });
    } finally {
      setIsGeneratingVideo(false);
      setGenerationPercent(0);
      setGenerationPhase('');
    }
  };

  // Render HeyGen Avatar
  const handleRenderHeyGen = async () => {
    if (!script.trim()) {
      setNotification({ message: 'Please write or generate a script first', type: 'error' });
      return;
    }

    if (!settings.heyGenApiKey) {
      setNotification({ message: 'Please configure your HeyGen API key in Settings first', type: 'error' });
      return;
    }

    setIsGeneratingVideo(true);
    setNotification({ message: 'Dispatching to HeyGen cloud...', type: 'info' });

    try {
      const videoResult = await VideoService.createHeyGenVideo({
        script: script.trim(),
        avatarId: selectedAvatar,
        voiceId: selectedVoice,
        aspectRatio: heygenRatio,
        apiKey: settings.heyGenApiKey
      });

      addVideo(videoResult);
      setNotification({ message: 'HeyGen render job initiated', type: 'success' });
    } catch (err: any) {
      setNotification({ message: err.message || 'HeyGen render failed', type: 'error' });
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleDownload = (videoUrl: string, title: string) => {
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `${title.slice(0, 30).replace(/[^a-z0-9]/gi, '_')}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-[#09090b] overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="pb-4 border-b border-white/[0.08] flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-zinc-100 flex items-center gap-2">
              <Film className="w-4 h-4 text-zinc-300" />
              Video Studio
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Synthesize 30 FPS neural motion videos or render photorealistic talking avatars
            </p>
          </div>

          {/* Sub-Tabs Segmented Switcher */}
          <div className="flex items-center gap-1 bg-zinc-900 border border-white/[0.08] p-1 rounded-xl">
            <button
              onClick={() => setActiveSubTab('motion')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeSubTab === 'motion'
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Motion Camera Video</span>
            </button>
            <button
              onClick={() => setActiveSubTab('heygen')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeSubTab === 'heygen'
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>HeyGen Avatar</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Motion Video Engine */}
        {activeSubTab === 'motion' && (
          <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            {/* Prompt */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Scene Description</label>
              <textarea
                value={motionPrompt}
                onChange={(e) => setMotionPrompt(e.target.value)}
                placeholder="Describe the cinematic shot (e.g. Drone flyover above misty emerald pine forest, dramatic cinematic lighting, ultra-realistic 4K textures)..."
                rows={3}
                className="w-full bg-zinc-900/90 border border-zinc-700/80 rounded-xl p-3 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-500 resize-none transition-colors"
              />
            </div>

            {/* Camera Motion & Aspect Ratio Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Motion Presets */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Camera Movement</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {VIDEO_MOTION_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setMotionPreset(preset.id)}
                      className={`p-2 rounded-xl text-left border transition-all ${
                        motionPreset === preset.id
                          ? 'bg-zinc-800 text-zinc-100 border-zinc-600 shadow-sm'
                          : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      <div className="text-xs font-semibold truncate">{preset.name}</div>
                      <div className="text-[10px] text-zinc-500 truncate">{preset.id}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Format</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['16:9', '9:16', '1:1'] as const).map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setMotionRatio(ratio)}
                      className={`py-2 rounded-lg text-xs font-mono border transition-all text-center ${
                        motionRatio === ratio
                          ? 'bg-zinc-800 text-zinc-100 border-zinc-600'
                          : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Progress Indicator */}
            {isGeneratingVideo && (
              <div className="bg-zinc-900/90 border border-zinc-700/80 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-200 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                    {generationPhase || 'Synthesizing scene keyframes...'}
                  </span>
                  <span className="font-mono text-zinc-400">{generationPercent}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-zinc-200 transition-all duration-300"
                    style={{ width: `${generationPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Render Button */}
            <div className="pt-2 flex justify-end border-t border-white/[0.06]">
              <button
                onClick={handleRenderMotionVideo}
                disabled={isGeneratingVideo || !motionPrompt.trim()}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs transition-all shadow-sm active:scale-[0.99] disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {isGeneratingVideo ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Rendering Scene...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Render Motion Video</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: HeyGen Avatar Studio */}
        {activeSubTab === 'heygen' && (
          <div className="space-y-4">
            {/* Step 1: Script */}
            <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-zinc-200">
                  Step 1: AI Scriptwriter
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <label className="text-xs text-zinc-400 block mb-1">Topic / Hook</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. ৫টি এআই টুল যা আপনার সময় বাঁচাবে..."
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Language</label>
                  <select
                    value={scriptLanguage}
                    onChange={(e) => setScriptLanguage(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none focus:border-zinc-500"
                  >
                    <option value="Bengali (বাংলা)">Bengali (বাংলা)</option>
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Length</label>
                  <select
                    value={scriptDuration}
                    onChange={(e) => setScriptDuration(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none focus:border-zinc-500"
                  >
                    <option value={15}>15 seconds</option>
                    <option value={30}>30 seconds</option>
                    <option value={60}>60 seconds</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleGenerateScript}
                  disabled={isGeneratingScript || !topic.trim()}
                  className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-600 transition-colors disabled:opacity-40 flex items-center gap-1.5"
                >
                  {isGeneratingScript ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Writing script...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-zinc-300" />
                      <span>Generate Script</span>
                    </>
                  )}
                </button>
              </div>

              {/* Script Textarea */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400">Final Spoken Script</label>
                <textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder="The script the avatar will speak aloud..."
                  rows={4}
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl p-3 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-500"
                />
              </div>
            </div>

            {/* Step 2: Avatar & Voice */}
            <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-semibold text-zinc-200">
                Step 2: Choose Presenter & Voice
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {POPULAR_HEYGEN_AVATARS.map((av) => (
                  <div
                    key={av.avatar_id}
                    onClick={() => setSelectedAvatar(av.avatar_id)}
                    className={`cursor-pointer rounded-xl overflow-hidden border p-2 transition-all ${
                      selectedAvatar === av.avatar_id
                        ? 'bg-zinc-800 border-zinc-500'
                        : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="aspect-square rounded-lg overflow-hidden bg-zinc-950 mb-1.5">
                      <img src={av.preview_image_url} alt={av.avatar_name} className="w-full h-full object-cover" />
                    </div>
                    <div className="text-xs font-medium text-zinc-200 truncate">{av.avatar_name}</div>
                    <div className="text-[10px] text-zinc-500">{av.gender}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Voice Profile</label>
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none"
                  >
                    {POPULAR_HEYGEN_VOICES.map((v) => (
                      <option key={v.voice_id} value={v.voice_id}>
                        {v.name} ({v.language} - {v.gender})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Video Aspect Ratio</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => setHeygenRatio('16:9')}
                      className={`py-2 rounded-xl text-xs font-medium border ${
                        heygenRatio === '16:9' ? 'bg-zinc-800 text-white border-zinc-600' : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                      }`}
                    >
                      16:9 Landscape
                    </button>
                    <button
                      onClick={() => setHeygenRatio('9:16')}
                      className={`py-2 rounded-xl text-xs font-medium border ${
                        heygenRatio === '9:16' ? 'bg-zinc-800 text-white border-zinc-600' : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                      }`}
                    >
                      9:16 Portrait (Reels)
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end border-t border-white/[0.06]">
                <button
                  onClick={handleRenderHeyGen}
                  disabled={isGeneratingVideo || !script.trim()}
                  className="px-5 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs transition-all shadow-sm active:scale-[0.99] disabled:opacity-40 flex items-center gap-2"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Render Avatar Video</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Video Creations Gallery */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-200">
              Creations ({videos.length})
            </h3>
          </div>

          {videos.length === 0 ? (
            <div className="text-center py-16 border border-zinc-800/80 rounded-2xl bg-zinc-900/30">
              <Film className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-xs text-zinc-400 font-medium">No videos generated yet</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">Enter a scene description above to synthesize video</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {videos.map((vid) => (
                <div
                  key={vid.id}
                  className="group relative bg-[#121215] border border-white/[0.08] hover:border-zinc-600 rounded-xl overflow-hidden transition-all flex flex-col shadow-sm"
                >
                  <div
                    className="relative aspect-video bg-zinc-950 cursor-pointer overflow-hidden"
                    onClick={() => setActiveVideoModal(vid)}
                  >
                    <video
                      src={vid.videoUrl}
                      poster={vid.thumbnailUrl}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      onMouseEnter={(e) => (e.target as HTMLVideoElement).play().catch(() => {})}
                      onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
                    />

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveVideoModal(vid);
                        }}
                        className="p-2 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-white"
                        title="Play Fullscreen"
                      >
                        <Play className="w-4 h-4 fill-current" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(vid.videoUrl, vid.title);
                        }}
                        className="p-2 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-white"
                        title="Download MP4"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/70 text-zinc-300 backdrop-blur-sm">
                      {vid.duration || 4}s • 30 FPS
                    </div>
                  </div>

                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-medium text-zinc-200 line-clamp-1">{vid.title}</h4>
                      <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">{vid.prompt}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-white/[0.04] text-[10px] text-zinc-400">
                      <span className="capitalize">{vid.model}</span>
                      <button
                        onClick={() => deleteVideo(vid.id)}
                        className="p-1 hover:text-rose-400"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Video Modal */}
      {activeVideoModal && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setActiveVideoModal(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-[#121215] border border-white/[0.1] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
              <span className="text-xs text-zinc-200 font-medium truncate max-w-md">
                {activeVideoModal.title}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(activeVideoModal.videoUrl, activeVideoModal.title)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download MP4</span>
                </button>
                <button
                  onClick={() => setActiveVideoModal(null)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-3 bg-black flex items-center justify-center">
              <video
                src={activeVideoModal.videoUrl}
                controls
                autoPlay
                className="max-h-[70vh] w-full rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
