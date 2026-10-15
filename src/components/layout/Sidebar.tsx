import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
  Plus,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  Image as ImageIcon,
  Video as VideoIcon,
  ChevronRight,
  Database
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    isSidebarOpen,
    setSidebarOpen,
    conversations,
    activeConversationId,
    selectConversation,
    createConversation,
    deleteConversation,
    updateConversationTitle,
    activeTab,
    setActiveTab,
    images,
    videos
  } = useAppStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const handleStartEdit = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditingTitle(currentTitle);
  };

  const handleSaveEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingTitle.trim()) {
      updateConversationTitle(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this conversation?')) {
      deleteConversation(id);
    }
  };

  if (!isSidebarOpen) {
    return null;
  }

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
        onClick={() => setSidebarOpen(false)}
      />

      <aside className="fixed md:static inset-y-0 left-0 z-40 w-72 bg-neutral-950 border-r border-white/10 flex flex-col h-[calc(100vh-4rem)] transition-all duration-200">
        {/* New Chat Button */}
        <div className="p-3 border-b border-white/5">
          <button
            onClick={() => {
              createConversation();
              setActiveTab('chat');
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-xs shadow-md shadow-purple-600/20 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        {/* Studio Shortcuts */}
        <div className="px-3 py-2 border-b border-white/5 space-y-1">
          <button
            onClick={() => setActiveTab('image')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'image'
                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ImageIcon className="w-4 h-4 text-pink-400" />
              <span>Image Gallery</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-800 text-neutral-300">
              {images.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('video')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'video'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <VideoIcon className="w-4 h-4 text-blue-400" />
              <span>Video Studio & HeyGen</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-800 text-neutral-300">
              {videos.length}
            </span>
          </button>
        </div>

        {/* Chat History Header */}
        <div className="px-3 pt-3 pb-1 flex items-center justify-between text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
          <span>Chat History</span>
          <span className="text-neutral-600">{conversations.length}</span>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1 scrollbar-thin scrollbar-thumb-white/10">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-neutral-500 text-xs">
              No conversations yet.<br />Start a new chat above!
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === activeConversationId && activeTab === 'chat';
              const isEditing = conv.id === editingId;

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    selectConversation(conv.id);
                    setActiveTab('chat');
                  }}
                  className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs transition-all ${
                    isActive
                      ? 'bg-purple-600/15 text-white border border-purple-500/30 shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-purple-400' : 'text-neutral-500'}`} />
                    
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(conv.id, e as any);
                          if (e.key === 'Escape') handleCancelEdit(e as any);
                        }}
                        className="bg-neutral-900 border border-purple-500/50 rounded px-1.5 py-0.5 text-xs text-white outline-none w-full"
                        autoFocus
                      />
                    ) : (
                      <span className="truncate">{conv.title}</span>
                    )}
                  </div>

                  {/* Actions (visible on hover or active) */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isEditing ? (
                      <>
                        <button
                          onClick={(e) => handleSaveEdit(conv.id, e)}
                          className="p-1 hover:text-emerald-400 text-neutral-400"
                          title="Save"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 hover:text-rose-400 text-neutral-400"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => handleStartEdit(conv.id, conv.title, e)}
                          className="p-1 hover:text-white text-neutral-500"
                          title="Rename"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(conv.id, e)}
                          className="p-1 hover:text-rose-400 text-neutral-500"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Cloud Sync Status */}
        <div className="p-3 border-t border-white/5 bg-neutral-950/60 flex items-center justify-between text-[11px] text-neutral-500">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Supabase Cloud Synced</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
        </div>
      </aside>
    </>
  );
};
