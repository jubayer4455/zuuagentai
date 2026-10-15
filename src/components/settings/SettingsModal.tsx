import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
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
  ShieldCheck,
  Video
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
  const [heyGenKey, setHeyGenKey] = useState(settings.heyGenApiKey);
  const [temperature, setTemperature] = useState(settings.temperature);
  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<{
    valid: boolean;
    label?: string;
    isFree?: boolean;
    freeLimitRemaining?: number;
    usage?: number;
  } | null>(null);

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

  useEffect(() => {
    checkOpenRouterKey(settings.openRouterApiKey);
  }, []);

  const handleSave = () => {
    updateSettings({
      openRouterApiKey: openRouterKey.trim(),
      heyGenApiKey: heyGenKey.trim(),
      temperature
    });
    setNotification({ message: 'Settings saved successfully!', type: 'success' });
    checkOpenRouterKey(openRouterKey.trim());
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to delete all chat history?')) {
      conversations.forEach((c) => deleteConversation(c.id));
      setNotification({ message: 'Chat history cleared.', type: 'info' });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-950 p-4 sm:p-6 space-y-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="pb-6 border-b border-white/10">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-purple-400" />
            API Connections & Settings
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Manage your OpenRouter API key, HeyGen credentials, and studio parameters.
          </p>
        </div>

        {/* OpenRouter API Key Section */}
        <div className="bg-neutral-900 border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">OpenRouter API Key</h3>
            </div>
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              Get OpenRouter Key <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div>
            <input
              type="password"
              value={openRouterKey}
              onChange={(e) => setOpenRouterKey(e.target.value)}
              placeholder="sk-or-v1-..."
              className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-white placeholder-neutral-500 outline-none focus:border-purple-500/50"
            />
          </div>

          {/* Validation Status Badge */}
          <div className="flex items-center justify-between pt-1 text-xs">
            {isValidatingKey ? (
              <div className="flex items-center gap-2 text-neutral-400">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Checking API key validity...</span>
              </div>
            ) : keyStatus?.valid ? (
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Connected to OpenRouter! Daily free quota: {keyStatus.freeLimitRemaining ?? 50} requests remaining.</span>
              </div>
            ) : keyStatus?.valid === false ? (
              <div className="flex items-center gap-2 text-rose-400 font-medium">
                <AlertCircle className="w-4 h-4" />
                <span>Invalid or expired OpenRouter API key.</span>
              </div>
            ) : (
              <span className="text-neutral-500">Enter your key above to connect.</span>
            )}

            <button
              onClick={() => checkOpenRouterKey(openRouterKey)}
              className="text-xs text-neutral-400 hover:text-white"
            >
              Test Key
            </button>
          </div>
        </div>

        {/* HeyGen API Key Section */}
        <div className="bg-neutral-900 border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white">HeyGen API Key (Video Avatars)</h3>
            </div>
            <a
              href="https://app.heygen.com/settings?nav=API"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              Get HeyGen Key <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <p className="text-xs text-neutral-400">
            Used to render custom video presenters. If not provided, you can still test with our interactive instant avatar demo!
          </p>

          <div>
            <input
              type="password"
              value={heyGenKey}
              onChange={(e) => setHeyGenKey(e.target.value)}
              placeholder="Paste HeyGen API key..."
              className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-white placeholder-neutral-500 outline-none focus:border-blue-500/50"
            />
          </div>
        </div>

        {/* Model Parameters */}
        <div className="bg-neutral-900 border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-pink-400" />
            <h3 className="text-sm font-bold text-white">Generation Parameters</h3>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-neutral-300 mb-2">
              <span>Creativity / Temperature:</span>
              <span className="font-mono text-pink-400">{temperature}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-pink-500"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 mt-1">
              <span>0.0 (Precise & Factual)</span>
              <span>0.7 (Balanced)</span>
              <span>1.0 (Highly Creative)</span>
            </div>
          </div>
        </div>

        {/* Cloud Database Sync */}
        <div className="bg-neutral-900 border border-white/10 rounded-2xl p-5 shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Database className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white">Supabase Cloud Database</h4>
              <p className="text-[11px] text-neutral-400">
                Connected to project <span className="font-mono text-emerald-400">zlotgghqdfrbxeuinjjy</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-xs text-emerald-300 font-semibold">Active</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All History
          </button>

          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-purple-600/30 transition-all active:scale-98"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
