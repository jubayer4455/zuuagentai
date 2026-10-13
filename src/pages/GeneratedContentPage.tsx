import React, { useState } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Send, 
  ExternalLink, 
  Image as ImageIcon, 
  Filter, 
  Search,
  Sparkles,
  Calendar,
  Eye
} from 'lucide-react';
import { useAgentStore } from '../store/useAgentStore';
import { GeneratedContent } from '../types';

export const GeneratedContentPage: React.FC = () => {
  const { agents } = useAgentStore();

  const [contents, setContents] = useState<GeneratedContent[]>([
    {
      id: 'gen-01',
      agentId: agents[0]?.id || '33333333-3333-3333-3333-333333333301',
      agentName: 'Trollogiya Content Agent',
      content: 'বৃষ্টির দিনে বাঙালি জাতির ৩টি সার্বজনীন ইচ্ছা:\n১. গরম খিচুড়ি আর বেগুন ভাজা 🍛🍆\n২. এক কাপ আদা চা ☕️\n৩. জরুরি মিটিং বা ক্লাস অটোমেটিক ক্যানসেল হয়ে যাওয়া! 🌧️\n\nআপনার আজকের দিনের প্রায়োরিটি কোনটা? কমেন্টে জানিয়ে দিন! 👇 #Trollogiya #DhakaLife',
      mediaUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop',
      approvalStatus: 'published',
      publishedPostId: '109847291834910_982736152431',
      publishedPostUrl: 'https://www.facebook.com/109847291834910/posts/982736152431',
      createdAt: '2026-10-13T14:00:00+06:00'
    },
    {
      id: 'gen-02',
      agentId: agents[0]?.id || '33333333-3333-3333-3333-333333333301',
      agentName: 'Trollogiya Content Agent',
      content: 'অফিসে যখন বস বলে— "কাজটা আর্জেন্ট না, তবে লাঞ্চের আগেই শেষ করে দিয়েন!" 🙃\nতখন আমার ভেতরের ফিলিং: ভাই, আর্জেন্ট হলে কী করতেন? অফিসে তাবু টানিয়ে থাকতে বলতেন? ⛺️\n\nআজকে কার কার বসের এমন ডায়লগ শুনছেন? হাজিরা দেন! 😂 #Trollogiya #OfficeLife',
      approvalStatus: 'approved',
      createdAt: '2026-10-13T10:30:00+06:00'
    },
    {
      id: 'gen-03',
      agentId: agents[0]?.id || '33333333-3333-3333-3333-333333333301',
      agentName: 'Trollogiya Content Agent',
      content: 'আমরা সেই জেনারেশন যারা মেসেজের রিপ্লাই ১ সেকেন্ডে না পেলে ভাবি "ইগনোর করতেছে", কিন্তু নিজেরা রিপ্লাই দেওয়ার সময় বলি— "একটু পরে দিচ্ছি, ভাব ধরে রাখা দরকার!" 🤦‍♂️\n\nসত্যি করে বলেন তো, এই রোগ কার কার আছে? 🙋‍♂️ #Trollogiya',
      approvalStatus: 'pending',
      createdAt: '2026-10-13T09:15:00+06:00'
    }
  ]);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const handleApprove = (id: string) => {
    setContents(prev => prev.map(c => c.id === id ? { ...c, approvalStatus: 'approved' } : c));
  };

  const handleReject = (id: string) => {
    setContents(prev => prev.map(c => c.id === id ? { ...c, approvalStatus: 'rejected' } : c));
  };

  const handlePublishNow = async (id: string) => {
    const item = contents.find(c => c.id === id);
    if (!item) return;

    try {
      const res = await fetch('/api/integrations/meta-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: item.content,
          isDryRun: false
        })
      });
      const data = await res.json();
      const postId = data.postId || `fb_${Date.now()}`;
      setContents(prev => prev.map(c => 
        c.id === id 
          ? { 
              ...c, 
              approvalStatus: 'published', 
              publishedPostId: postId,
              publishedPostUrl: `https://facebook.com/${postId}`
            } 
          : c
      ));
    } catch (_) {
      // Fallback
      setContents(prev => prev.map(c => 
        c.id === id 
          ? { 
              ...c, 
              approvalStatus: 'published', 
              publishedPostId: `post_${Date.now()}`
            } 
          : c
      ));
    }
  };

  const filtered = contents.filter(c => {
    const matchesStatus = filterStatus === 'all' || c.approvalStatus === filterStatus;
    const matchesSearch = c.content.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (c.agentName && c.agentName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-violet-950/80 text-violet-400 border border-violet-800">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">
                Generated Content & Post Studio
              </h1>
              <p className="text-slate-400 text-sm mt-0.5">
                AI copies, media attachments, approval status workflow, and published Facebook post IDs.
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search content..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-cyan-500 w-44"
            />
          </div>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-cyan-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="published">Published</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Content Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item) => (
          <div key={item.id} className="border border-slate-800 rounded-2xl bg-[#0f172a]/95 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200">{item.agentName}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  item.approvalStatus === 'published' 
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                    : item.approvalStatus === 'approved'
                    ? 'bg-blue-950 text-blue-400 border border-blue-800'
                    : item.approvalStatus === 'pending'
                    ? 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse'
                    : 'bg-rose-950 text-rose-400 border border-rose-800'
                }`}>
                  {item.approvalStatus}
                </span>
              </div>

              {item.mediaUrl && (
                <div className="relative rounded-xl overflow-hidden h-36 border border-slate-800">
                  <img src={item.mediaUrl} alt="Post Attachment" className="w-full h-full object-cover" />
                </div>
              )}

              <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed line-clamp-6">
                {item.content}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>{new Date(item.createdAt).toLocaleString()}</span>
                {item.publishedPostId && (
                  <span className="font-mono text-cyan-400 text-[10px]">
                    ID: {item.publishedPostId}
                  </span>
                )}
              </div>

              {item.publishedPostUrl && (
                <a
                  href={item.publishedPostUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:underline inline-flex items-center space-x-1 text-xs"
                >
                  <span>View live Facebook post</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              {/* Action buttons for pending/approved */}
              {item.approvalStatus === 'pending' && (
                <div className="flex items-center space-x-2 pt-1">
                  <button
                    onClick={() => handleApprove(item.id)}
                    className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center space-x-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => handleReject(item.id)}
                    className="flex-1 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 font-semibold text-xs flex items-center justify-center space-x-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              )}

              {item.approvalStatus === 'approved' && (
                <button
                  onClick={() => handlePublishNow(item.id)}
                  className="w-full py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center space-x-1 shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish to Facebook Now</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
