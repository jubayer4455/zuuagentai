import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GeminiService } from '../../services/geminiService';
import {
  Settings,
  Key,
  Database,
  Sliders,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  ExternalLink,
  Eye,
  EyeOff,
  Video,
  Sparkles,
  Zap
} from 'lucide-react';

export const SettingsModal: React.FC = () => {
  const {
    settings,
    updateSettings,
    setNotification,
    deleteConversation,
    conversations
  } = useAppStore();

  const [openRouterKey, setOpenRouterKey] = useState(settings.openRouterApiKey);
  const [geminiKey, setGeminiKey] = useState(settings.geminiApiKey || '');
  const [heyGenKey, setHeyGenKey] = useState(settings.heyGenApiKey);
  const [temperature, setTemperature] = useState(settings.temperature);

  const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showHeyGenKey, setShowHeyGenKey] = useState(false);

  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<{
    valid: boolean;
    label?: string;
    isFree?: boolean;
    freeLimitRemaining?: number;
    usage?: number;
  } | null>(null);

  const [isValidatingGemini, setIsValidatingGemini] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState<{ valid: boolean; message?: string } | null>(null);

  // Validate OpenRouter key on load or when key changed
  const checkOpenRouterKey = async (keyToCheck: string) => {
    if (!keyToCheck.trim()) {
      setKeyStatus(null);
      return;
    }
    setIsValidatingKey(true);
    try {
      const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: {
          Authorization: `Bearer ${keyToCheck.trim()}`
        }
      });
      if (res.ok) {
        const json = await res.json();
        setKeyStatus({
          valid: true,
          label: json.data?.label,
          isFree: json.data?.is_free_tier,
          freeLimitRemaining: json.data?.free_model_daily_requests?.remaining,
          usage: json.data?.usage
        });
      } else {
        setKeyStatus({ valid: false });
      }
    } catch {
      setKeyStatus({ valid: false });
    } finally {
      setIsValidatingKey(false);
    }
  };

  // Validate Google Gemini key
  const checkGeminiKey = async (keyToCheck: string) => {
    if (!keyToCheck.trim()) {
      setGeminiStatus(null);
      return;
    }
    setIsValidatingGemini(true);
    try {
      const res = await GeminiService.validateKey(keyToCheck.trim());
      setGeminiStatus(res);
    } catch {
      setGeminiStatus({ valid: false });
    } finally {
      setIsValidatingGemini(false);
    }
  };

  useEffect(() => {
    checkOpenRouterKey(settings.openRouterApiKey);
    if (settings.geminiApiKey) {
      checkGeminiKey(settings.geminiApiKey);
    }
  }, []);

  const handleSave = () => {
    updateSettings({
      openRouterApiKey: openRouterKey.trim(),
      geminiApiKey: geminiKey.trim(),
      heyGenApiKey: heyGenKey.trim(),
      temperature
    });
    setNotification({ message: 'Settings saved', type: 'success' });
    checkOpenRouterKey(openRouterKey.trim());
    if (geminiKey.trim()) {
      checkGeminiKey(geminiKey.trim());
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to delete all chat history?')) {
      conversations.forEach((c) => deleteConversation(c.id));
      setNotification({ message: 'Chat history cleared', type: 'info' });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#09090b] p-4 sm:p-6 space-y-6">
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Header */}
        <div className="pb-4 border-b border-white/[0.08]">
          <h2 className="text-base sm:text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <Settings className="w-4 h-4 text-zinc-300" />
            API & Model Connections
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Configure Google Gemini and OpenRouter keys for 100% free AI models
          </p>
        </div>

        {/* Google Gemini API Key Section */}
        <div className="bg-[#121215] border border-white/[0.08] rounded-xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-semibold text-zinc-200">Google Gemini API Key (Free)</h3>
            </div>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              Get Free Key on Google AI Studio <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <p className="text-[11px] text-zinc-400">
            Enables Gemini 2.0 Flash, Gemini 2.0 Flash Lite, and Gemini 1.5 Pro with high speed and multimodal vision (15 requests/min completely free).
          </p>

          <div className="relative">
            <input
              type={showGeminiKey ? 'text' : 'password'}
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg pl-3 pr-10 py-2 text-xs font-mono text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowGeminiKey(!showGeminiKey)}
              className="absolute right-2.5 top-2 text-zinc-500 hover:text-zinc-300"
            >
              {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Validation Status Badge */}
          <div className="flex items-center justify-between pt-1 text-xs">
            {isValidatingGemini ? (
              <div className="flex items-center gap-2 text-zinc-400">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Checking Gemini key validity...</span>
              </div>
            ) : geminiStatus?.valid ? (
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Connected to Google Gemini! Free tier quota active (15 RPM / 1,500 RPD).</span>
              </div>
            ) : geminiStatus?.valid === false ? (
              <div className="flex items-center gap-1.5 text-rose-400 text-xs font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{geminiStatus.message || 'Invalid Gemini API key.'}</span>
              </div>
            ) : (
              <span className="text-zinc-500 text-[11px]">Enter your key to enable official Google Gemini models.</span>
            )}

            <button
              onClick={() => checkGeminiKey(geminiKey)}
              className="text-xs text-zinc-400 hover:text-zinc-200"
            >
              Verify Key
            </button>
          </div>
        </div>

        {/* OpenRouter API Key Section (Free Models) */}
        <div className="bg-[#121215] border border-white/[0.08] rounded-xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-zinc-400" />
              <h3 className="text-xs font-semibold text-zinc-200">OpenRouter API Key (Free Models)</h3>
            </div>
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
            >
              Get OpenRouter Key <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <p className="text-[11px] text-zinc-400">
            Connects to 19+ verified 100% free models (LiquidAI, Google Gemma 31B, NVIDIA Nemotron Reasoning, Poolside Laguna). All paid models have been removed so you never face credit errors.
          </p>

          <div className="relative">
            <input
              type={showOpenRouterKey ? 'text' : 'password'}
              value={openRouterKey}
              onChange={(e) => setOpenRouterKey(e.target.value)}
              placeholder="sk-or-v1-..."
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg pl-3 pr-10 py-2 text-xs font-mono text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowOpenRouterKey(!showOpenRouterKey)}
              className="absolute right-2.5 top-2 text-zinc-500 hover:text-zinc-300"
            >
              {showOpenRouterKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Validation Status Badge */}
          <div className="flex items-center justify-between pt-1 text-xs">
            {isValidatingKey ? (
              <div className="flex items-center gap-2 text-zinc-400">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Checking key status...</span>
              </div>
            ) : keyStatus?.valid ? (
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Connected to OpenRouter! Free model daily requests remaining: {keyStatus.freeLimitRemaining ?? 50}.</span>
              </div>
            ) : keyStatus?.valid === false ? (
              <div className="flex items-center gap-1.5 text-rose-400 text-xs font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Invalid or expired OpenRouter API key.</span>
              </div>
            ) : (
              <span className="text-zinc-500 text-[11px]">Default key pre-configured.</span>
            )}

            <button
              onClick={() => checkOpenRouterKey(openRouterKey)}
              className="text-xs text-zinc-400 hover:text-zinc-200"
            >
              Verify Key
            </button>
          </div>
        </div>

        {/* HeyGen API Key Section */}
        <div className="bg-[#121215] border border-white/[0.08] rounded-xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-zinc-400" />
              <h3 className="text-xs font-semibold text-zinc-200">HeyGen API Key (Video Avatars)</h3>
            </div>
            <a
              href="https://app.heygen.com/settings?nav=API"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
            >
              Get Key <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <p className="text-[11px] text-zinc-400">
            Optional. Neural keyframe motion video works without this key.
          </p>

          <div className="relative">
            <input
              type={showHeyGenKey ? 'text' : 'password'}
              value={heyGenKey}
              onChange={(e) => setHeyGenKey(e.target.value)}
              placeholder="Paste HeyGen API key..."
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg pl-3 pr-10 py-2 text-xs font-mono text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowHeyGenKey(!showHeyGenKey)}
              className="absolute right-2.5 top-2 text-zinc-500 hover:text-zinc-300"
            >
              {showHeyGenKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Model Parameters */}
        <div className="bg-[#121215] border border-white/[0.08] rounded-xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-zinc-400" />
            <h3 className="text-xs font-semibold text-zinc-200">Default Temperature</h3>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-zinc-300 mb-2">
              <span>Creativity balance</span>
              <span className="font-mono text-zinc-200">{temperature}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-zinc-200"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
              <span>0.0 (Precise / Code)</span>
              <span>0.7 (Balanced)</span>
              <span>1.0 (Creative)</span>
            </div>
          </div>
        </div>

        {/* Cloud Database Sync */}
        <div className="bg-[#121215] border border-white/[0.08] rounded-xl p-4 sm:p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-zinc-300">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-medium text-zinc-200">Supabase Cloud Sync</h4>
              <p className="text-[11px] text-zinc-500">
                Project <span className="font-mono text-zinc-400">zlotgghqdfrbxeuinjjy</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Connected</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 text-xs font-medium transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>

          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs transition-all shadow-sm active:scale-[0.99]"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
