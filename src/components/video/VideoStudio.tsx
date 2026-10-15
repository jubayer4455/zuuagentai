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
  Video,
  Play,
  Download,
  Trash2,
  Sparkles,
  RefreshCw,
  Wand2,
  UserCheck,
  Mic,
  Maximize2,
  Film,
  Layers,
  ChevronRight
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

  const [activeSubTab, setActiveSubTab] = useState<'heygen' | 'motion'>('heygen');

  // HeyGen Avatar State
  const [topic, setTopic] = useState('');
  const [script, setScript] = useState('');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(POPULAR_HEYGEN_AVATARS[0].avatar_id);
  const [selectedVoice, setSelectedVoice] = useState(POPULAR_HEYGEN_VOICES[0].voice_id);
  const [scriptLanguage, setScriptLanguage] = useState('English');
  const [scriptTone, setScriptTone] = useState('Professional');
  const [scriptDuration, setScriptDuration] = useState(30);
  const [heygenRatio, setHeygenRatio] = useState<'16:9' | '9:16'>('16:9');

  // Motion Video State
  const [motionPrompt, setMotionPrompt] = useState('');
  const [motionPreset, setMotionPreset] = useState(VIDEO_MOTION_PRESETS[0].id);
  const [isEnhancingMotion, setIsEnhancingMotion] = useState(false);

  // Active Video Player Modal
  const [activeVideoModal, setActiveVideoModal] = useState<GeneratedVideo | null>(null);

  // AI Script Generation with OpenRouter
  const handleGenerateScript = async () => {
    if (!topic.trim()) {
      setNotification({ message: 'Please enter a video topic or concept', type: 'error' });
      return;
    }

    setIsGeneratingScript(true);
    setNotification({ message: 'Generating script with OpenRouter AI...', type: 'info' });
    try {
      const generatedScript = await VideoService.generateScript({
        topic: topic.trim(),
        tone: scriptTone,
        language: scriptLanguage,
        durationSeconds: scriptDuration,
        apiKey: settings.openRouterApiKey
      });
      setScript(generatedScript);
      setNotification({ message: 'Video script ready!', type: 'success' });
    } catch (err: any) {
      setNotification({ message: err.message || 'Script generation failed', type: 'error' });
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Create HeyGen Video
  const handleRenderHeyGenVideo = async () => {
    if (!script.trim()) {
      setNotification({ message: 'Please write or generate a script first', type: 'error' });
      return;
    }

    setIsGeneratingVideo(true);
    setNotification({ message: 'Rendering HeyGen avatar video...', type: 'info' });
    try {
      const newVideo = await VideoService.createHeyGenVideo({
        script: script.trim(),
        avatarId: selectedAvatar,
        voiceId: selectedVoice,
        aspectRatio: heygenRatio,
        apiKey: settings.heyGenApiKey,
        title: topic || script.slice(0, 30)
      });
      addVideo(newVideo);
      setNotification({ message: 'HeyGen video created successfully!', type: 'success' });
    } catch (err: any) {
      setNotification({ message: err.message || 'HeyGen render failed', type: 'error' });
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  // Enhance Motion Prompt
  const handleEnhanceMotionPrompt = async () => {
    if (!motionPrompt.trim()) return;
    setIsEnhancingMotion(true);
    setNotification({ message: 'Directing cinematic video scene with AI...', type: 'info' });
    try {
      const enhanced = await OpenRouterService.enhancePrompt(motionPrompt, 'video', settings.openRouterApiKey);
      setMotionPrompt(enhanced);
      setNotification({ message: 'Prompt enhanced!', type: 'success' });
    } catch {
      setNotification({ message: 'Failed to enhance motion prompt', type: 'error' });
    } finally {
      setIsEnhancingMotion(false);
    }
  };

  // Render Motion Video
  const handleRenderMotionVideo = async () => {
    if (!motionPrompt.trim()) {
      setNotification({ message: 'Please enter a video prompt', type: 'error' });
      return;
    }

    setIsGeneratingVideo(true);
    setNotification({ message: 'Synthesizing AI video frames...', type: 'info' });
    try {
      const video = await VideoService.generateMotionVideo({
        prompt: motionPrompt.trim(),
        motionPreset
      });
      addVideo(video);
      setNotification({ message: 'AI video synthesized successfully!', type: 'success' });
    } catch (err: any) {
      setNotification({ message: err.message || 'Video generation failed', type: 'error' });
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-950 p-4 sm:p-6 space-y-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Video className="w-6 h-6 text-blue-500" />
              AI Video & HeyGen Studio
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              Create speaking AI avatar presenters with HeyGen or generate dynamic cinematic video clips with AI motion.
            </p>
          </div>

          {/* Sub-tab Switcher */}
          <div className="flex items-center gap-1 bg-neutral-900 border border-white/10 p-1 rounded-xl">
            <button
              onClick={() => setActiveSubTab('heygen')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'heygen'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              HeyGen Avatar Presenter
            </button>
            <button
              onClick={() => setActiveSubTab('motion')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'motion'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              AI Motion Video (Text-to-Video)
            </button>
          </div>
        </div>

        {/* Tab 1: HeyGen Avatar Creator */}
        {activeSubTab === 'heygen' && (
          <div className="mt-6 space-y-6">
            {/* Step 1: AI Scriptwriter */}
            <div className="bg-neutral-900 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  Step 1: AI Script Generator (Powered by OpenRouter)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <label className="text-xs text-neutral-400 block mb-1">Topic / Concept:</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. 5 AI tools that will save you 10 hours a week"
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none focus:border-blue-500/50"
                  />
                </div>

                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Language:</label>
                  <select
                    value={scriptLanguage}
                    onChange={(e) => setScriptLanguage(e.target.value)}
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500/50"
                  >
                    <option value="English">English</option>
                    <option value="Bengali (বাংলা)">Bengali (বাংলা)</option>
                    <option value="Spanish">Spanish</option>
                    <option value="Hindi">Hindi</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Tone & Length:</label>
                  <div className="flex gap-2">
                    <select
                      value={scriptTone}
                      onChange={(e) => setScriptTone(e.target.value)}
                      className="w-1/2 bg-neutral-950 border border-white/10 rounded-xl px-2 py-2 text-xs text-white outline-none"
                    >
                      <option value="Professional">Professional</option>
                      <option value="Energetic">Energetic</option>
                      <option value="Storyteller">Storyteller</option>
                    </select>
                    <select
                      value={scriptDuration}
                      onChange={(e) => setScriptDuration(Number(e.target.value))}
                      className="w-1/2 bg-neutral-950 border border-white/10 rounded-xl px-2 py-2 text-xs text-white outline-none"
                    >
                      <option value={15}>15 sec</option>
                      <option value={30}>30 sec</option>
                      <option value={60}>60 sec</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleGenerateScript}
                  disabled={!topic.trim() || isGeneratingScript}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-medium transition-all disabled:opacity-40"
                >
                  {isGeneratingScript ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Wand2 className="w-3.5 h-3.5" />
                  )}
                  <span>Write Script with AI</span>
                </button>
              </div>

              {/* Script Text Area */}
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Script to Speak:</label>
                <textarea
                  rows={4}
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder="The generated script will appear here. You can also paste your own text directly..."
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-neutral-500 outline-none focus:border-blue-500/50 resize-none"
                />
              </div>
            </div>

            {/* Step 2: Avatar & Voice Selection */}
            <div className="bg-neutral-900 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-400" />
                Step 2: Choose HeyGen Avatar & Voice
              </h3>

              {/* Avatars Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {POPULAR_HEYGEN_AVATARS.map((avatar) => {
                  const isSelected = selectedAvatar === avatar.avatar_id;
                  return (
                    <div
                      key={avatar.avatar_id}
                      onClick={() => setSelectedAvatar(avatar.avatar_id)}
                      className={`cursor-pointer rounded-2xl p-2.5 border transition-all text-center flex flex-col items-center ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500/60 shadow-lg shadow-blue-500/20'
                          : 'bg-neutral-950 border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="w-20 h-20 rounded-full overflow-hidden mb-2 border border-white/10 bg-neutral-900">
                        <img
                          src={avatar.preview_image_url}
                          alt={avatar.avatar_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-xs font-semibold text-white truncate max-w-full">
                        {avatar.avatar_name}
                      </span>
                      <span className="text-[10px] text-neutral-400">{avatar.gender}</span>
                    </div>
                  );
                })}
              </div>

              {/* Voice & Aspect Ratio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs text-neutral-400 block mb-1 flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-blue-400" />
                    Speaking Voice:
                  </label>
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500/50"
                  >
                    {POPULAR_HEYGEN_VOICES.map((v) => (
                      <option key={v.voice_id} value={v.voice_id}>
                        {v.name} ({v.language})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-neutral-400 block mb-1 flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-blue-400" />
                    Video Format:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setHeygenRatio('16:9')}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                        heygenRatio === '16:9'
                          ? 'bg-blue-600/20 border-blue-500 text-white'
                          : 'bg-neutral-950 border-white/5 text-neutral-400'
                      }`}
                    >
                      16:9 Landscape (YouTube)
                    </button>
                    <button
                      onClick={() => setHeygenRatio('9:16')}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                        heygenRatio === '9:16'
                          ? 'bg-blue-600/20 border-blue-500 text-white'
                          : 'bg-neutral-950 border-white/5 text-neutral-400'
                      }`}
                    >
                      9:16 Vertical (Reels / TikTok)
                    </button>
                  </div>
                </div>
              </div>

              {/* Render Button */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleRenderHeyGenVideo}
                  disabled={isGeneratingVideo || !script.trim()}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isGeneratingVideo ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Synthesizing Avatar Video...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      <span>Generate HeyGen Video</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: AI Motion Video (Text-to-Video) */}
        {activeSubTab === 'motion' && (
          <div className="mt-6 bg-neutral-900 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Film className="w-4 h-4 text-purple-400" />
              Text-to-Video Studio (AI Motion Diffusion)
            </h3>

            <div className="relative">
              <label className="text-xs text-neutral-400 block mb-1">Scene Description:</label>
              <textarea
                rows={3}
                value={motionPrompt}
                onChange={(e) => setMotionPrompt(e.target.value)}
                placeholder="Describe your video scene (e.g. Futuristic flying cars over neo-Tokyo skyline at sunset, hyper-realistic, dramatic lighting)..."
                className="w-full bg-neutral-950 border border-white/10 rounded-xl p-3 pr-28 text-xs sm:text-sm text-white placeholder-neutral-500 outline-none focus:border-purple-500/50 resize-none"
              />
              <button
                onClick={handleEnhanceMotionPrompt}
                disabled={!motionPrompt.trim() || isEnhancingMotion}
                className="absolute right-3 bottom-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-medium transition-all disabled:opacity-40"
              >
                {isEnhancingMotion ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Wand2 className="w-3.5 h-3.5" />
                )}
                <span>Direct Scene</span>
              </button>
            </div>

            <div>
              <label className="text-xs text-neutral-400 block mb-1.5">Camera Movement:</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {VIDEO_MOTION_PRESETS.map((preset) => {
                  const isSelected = motionPreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => setMotionPreset(preset.id)}
                      className={`p-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                        isSelected
                          ? 'bg-purple-600/20 border-purple-500 text-white'
                          : 'bg-neutral-950 border-white/5 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {preset.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleRenderMotionVideo}
                disabled={isGeneratingVideo || !motionPrompt.trim()}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-purple-600/30 transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGeneratingVideo ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Rendering Motion Frames...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Render Motion Video</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Video Gallery */}
        <div className="mt-10 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Film className="w-4 h-4 text-blue-400" />
            Generated Videos ({videos.length})
          </h3>

          {videos.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl bg-neutral-900/30">
              <Film className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
              <p className="text-sm text-neutral-400">No videos generated yet.</p>
              <p className="text-xs text-neutral-500 mt-1">Create an AI avatar video or motion video above!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((vid) => (
                <div
                  key={vid.id}
                  className="group relative bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden shadow-lg hover:border-blue-500/40 transition-all flex flex-col"
                >
                  <div
                    className="relative aspect-video bg-black cursor-pointer overflow-hidden"
                    onClick={() => setActiveVideoModal(vid)}
                  >
                    {vid.thumbnailUrl ? (
                      <img
                        src={vid.thumbnailUrl}
                        alt={vid.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-neutral-950">
                        <Film className="w-8 h-8 text-neutral-600" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-white truncate">{vid.title}</h4>
                      <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2">
                        {vid.script || vid.prompt}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/5 text-[11px] text-neutral-500">
                      <span>{vid.model} • {vid.duration || 15}s</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveVideoModal(vid)}
                          className="p-1 hover:text-white"
                          title="Watch video"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteVideo(vid.id)}
                          className="p-1 hover:text-rose-400"
                          title="Delete video"
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

      {/* Video Player Modal */}
      {activeVideoModal && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setActiveVideoModal(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-neutral-900 border border-white/20 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3.5 border-b border-white/10">
              <span className="text-xs font-semibold text-white truncate max-w-md">
                {activeVideoModal.title}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={activeVideoModal.videoUrl}
                  download="zuu_ai_video.mp4"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download MP4
                </a>
                <button
                  onClick={() => setActiveVideoModal(null)}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-2 bg-black flex items-center justify-center">
              <video
                src={activeVideoModal.videoUrl}
                controls
                autoPlay
                loop
                className="max-h-[65vh] w-full rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
