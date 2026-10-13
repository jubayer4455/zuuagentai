import React, { useState } from 'react';
import { 
  Share2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink, 
  ShieldCheck, 
  Plus, 
  Send,
  Eye,
  KeyRound,
  Trash2,
  Copy
} from 'lucide-react';
import { useIntegrationStore } from '../store/useIntegrationStore';
import { useAgentStore } from '../store/useAgentStore';

export const FacebookPagesPage: React.FC = () => {
  const { integrations, testFacebookConnection, saveFacebookCredentials, isVerifying } = useIntegrationStore();
  const { agents } = useAgentStore();

  const fbIntegration = integrations.find(i => i.provider === 'meta_facebook') || integrations[0];

  const [pageId, setPageId] = useState(fbIntegration?.accountIdentifier || '109847291834910');
  const [token, setToken] = useState(fbIntegration?.settings?.pageAccessToken || '');
  const [pageName, setPageName] = useState(fbIntegration?.settings?.pageName || 'Trollogiya Official');
  const [verifyStatus, setVerifyStatus] = useState<{ message: string; success?: boolean } | null>(null);
  const [testPostText, setTestPostText] = useState('বৃষ্টির দিনে ঢাকার ট্রাফিক জ্যাম আর গরম খিচুড়ির টান! #Trollogiya #TestPost');
  const [testPostResult, setTestPostResult] = useState<any | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTestVerify = async () => {
    setVerifyStatus(null);
    const res = await testFacebookConnection(fbIntegration?.id || 'conn-fb-01', pageId, token);
    setVerifyStatus({
      message: res.message,
      success: res.success
    });
  };

  const handleSaveCredentials = async () => {
    const res = await saveFacebookCredentials(fbIntegration?.id || 'conn-fb-01', pageId, token, pageName);
    setVerifyStatus({
      message: res.message,
      success: res.success
    });
  };

  const handleDryRunPublish = async (isLive = false) => {
    setIsPosting(true);
    setTestPostResult(null);
    try {
      const response = await fetch('/api/integrations/meta-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId,
          message: testPostText,
          isDryRun: !isLive,
          accessTokenOverride: token
        })
      });
      const data = await response.json();
      setTestPostResult(data);
    } catch (err: any) {
      setTestPostResult({ success: false, error: err.message });
    } finally {
      setIsPosting(false);
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(pageId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-950/80 text-blue-400 border border-blue-800">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">
                Facebook Pages Management
              </h1>
              <p className="text-slate-400 text-sm mt-0.5">
                Meta Graph API v21.0 integration, token health diagnostics, permission validation, and safe publishing.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleTestVerify}
            disabled={isVerifying}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>Verify Graph Token</span>
          </button>
        </div>
      </div>

      {/* Verification Feedback Banner */}
      {verifyStatus && (
        <div className={`p-4 rounded-xl border flex items-start space-x-3 text-xs ${
          verifyStatus.success 
            ? 'bg-emerald-950/60 border-emerald-800 text-emerald-200' 
            : 'bg-rose-950/60 border-rose-800 text-rose-200'
        }`}>
          {verifyStatus.success ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          <div>
            <span className="font-bold">{verifyStatus.success ? 'Meta API Validated:' : 'Validation Failed:'} </span>
            <span>{verifyStatus.message}</span>
          </div>
        </div>
      )}

      {/* Grid: Connected Pages Card & Token Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Authorized Page Status */}
        <div className="border border-slate-800 rounded-2xl bg-[#0f172a]/90 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Connected Page Details
            </h2>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
              fbIntegration?.connectionStatus === 'connected'
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : 'bg-amber-950 text-amber-400 border border-amber-800'
            }`}>
              {fbIntegration?.connectionStatus || 'active'}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="text-slate-400">Page Display Name</div>
              <div className="text-sm font-bold text-slate-100">{pageName}</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span>Page ID</span>
                <button onClick={handleCopyId} className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1">
                  <Copy className="w-3 h-3" />
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="font-mono text-slate-200">{pageId}</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="text-slate-400">Assigned Agents</div>
              <div className="text-slate-200">
                {agents.filter(a => a.category === 'social_media' || a.category === 'facebook_publishing').map(a => a.name).join(', ') || 'Trollogiya Content Agent'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="text-slate-400">Required Meta Scopes</div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {['pages_manage_posts', 'pages_read_engagement', 'pages_show_list'].map(scope => (
                  <span key={scope} className="px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-800/60 text-[10px] font-mono">
                    ✓ {scope}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Center Column: Credentials & Secret Management */}
        <div className="border border-slate-800 rounded-2xl bg-[#0f172a]/90 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Page Credentials & Token
            </h2>
            <KeyRound className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Page Name</label>
              <input
                type="text"
                value={pageName}
                onChange={e => setPageName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:border-cyan-500 outline-none"
                placeholder="My Facebook Page"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Facebook Page ID</label>
              <input
                type="text"
                value={pageId}
                onChange={e => setPageId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 font-mono focus:border-cyan-500 outline-none"
                placeholder="109847291834910"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Never-Expiring Page Access Token</label>
              <textarea
                rows={4}
                value={token}
                onChange={e => setToken(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 font-mono text-[11px] focus:border-cyan-500 outline-none resize-none"
                placeholder="EAA..."
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Protected by server-side encryption. Never exposed to public browser bundles.
              </p>
            </div>

            <button
              onClick={handleSaveCredentials}
              className="w-full py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-lg transition shadow-md"
            >
              Save Page Credentials
            </button>
          </div>
        </div>

        {/* Right Column: Safe Test Posting & Dry-Run Simulator */}
        <div className="border border-slate-800 rounded-2xl bg-[#0f172a]/90 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Publishing Sandbox & Test
            </h2>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Test Post Text</label>
              <textarea
                rows={3}
                value={testPostText}
                onChange={e => setTestPostText(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:border-cyan-500 outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleDryRunPublish(false)}
                disabled={isPosting}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium border border-slate-700 transition"
              >
                {isPosting ? 'Testing...' : 'Dry Run (Simulated)'}
              </button>

              <button
                onClick={() => handleDryRunPublish(true)}
                disabled={isPosting || !token}
                className="px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium transition shadow-md disabled:opacity-50"
              >
                {isPosting ? 'Publishing...' : 'Live Publish'}
              </button>
            </div>

            {testPostResult && (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] space-y-1 mt-2">
                <div className="font-semibold text-slate-300">
                  Result: {testPostResult.success ? <span className="text-emerald-400 font-bold">Success</span> : <span className="text-rose-400 font-bold">Failed</span>}
                </div>
                {testPostResult.postId && (
                  <div className="text-slate-400">
                    Post ID: <span className="font-mono text-slate-200">{testPostResult.postId}</span>
                  </div>
                )}
                {testPostResult.permalinkUrl && (
                  <a 
                    href={testPostResult.permalinkUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-cyan-400 hover:underline flex items-center space-x-1"
                  >
                    <span>View Published Post</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {testPostResult.error && (
                  <div className="text-rose-400">{testPostResult.error}</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
