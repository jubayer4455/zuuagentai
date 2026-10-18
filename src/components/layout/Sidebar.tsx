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
  Search,
  Pin,
  Settings,
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
    videos,
    models
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('zuu_ai_pinned_chats');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = pinnedIds.includes(id) ? pinnedIds.filter(x => x !== id) : [...pinnedIds, id];
    setPinnedIds(updated);
    try {
      localStorage.setItem('zuu_ai_pinned_chats', JSON.stringify(updated));
    } catch {}
  };

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

  // Filter and sort conversations (pinned first)
  const filteredConversations = conversations
    .filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      const aPinned = pinnedIds.includes(a.id);
      const bPinned = pinnedIds.includes(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return 0;
    });

  if (!isSidebarOpen) {
    return null;
  }

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 md:hidden"
        onClick={() => setSidebarOpen(false)}
      />

      <aside className="fixed md:static inset-y-0 left-0 z-40 w-64 bg-[#0c0c0e] border-r border-white/[0.08] flex flex-col h-[calc(100vh-3.5rem)] select-none">
        {/* New Chat Primary Action */}
        <div className="p-3 border-b border-white/[0.06]">
          <button
            onClick={() => {
              createConversation();
              setActiveTab('chat');
            }}
            className="w-full flex items-center justify-between py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/70 hover:border-zinc-600 text-zinc-100 font-medium text-xs transition-all shadow-sm active:scale-[0.99]"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-3.5 h-3.5 text-zinc-300" />
              <span>New Conversation</span>
            </div>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-800/80 rounded border border-zinc-700/50">
              ⌘N
            </kbd>
          </button>
        </div>

        {/* Studio Quick Nav */}
        <div className="p-2 border-b border-white/[0.06] space-y-0.5">
          <button
            onClick={() => setActiveTab('image')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'image'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <ImageIcon className="w-3.5 h-3.5 text-zinc-400" />
              <span>Image Gallery</span>
            </div>
            {images.length > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
                {images.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('video')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'video'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <VideoIcon className="w-3.5 h-3.5 text-zinc-400" />
              <span>Video Studio</span>
            </div>
            {videos.length > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
                {videos.length}
              </span>
            )}
          </button>
        </div>

        {/* Search Input for Chats */}
        <div className="p-2 border-b border-white/[0.04]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-7 py-1 text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-zinc-600 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1.5 text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          <div className="px-2 pb-1.5 flex items-center justify-between text-[11px] font-medium text-zinc-400 tracking-wider">
            <span>CHATS</span>
            <span className="font-mono text-[10px] text-zinc-400">{filteredConversations.length}</span>
          </div>

          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-xs text-zinc-500">
                {searchQuery ? 'No matching chats found' : 'No chat history yet'}
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = activeConversationId === conv.id && activeTab === 'chat';
              const isEditing = editingId === conv.id;
              const isPinned = pinnedIds.includes(conv.id);

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    selectConversation(conv.id);
                    setActiveTab('chat');
                  }}
                  className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer text-xs transition-colors ${
                    isActive
                      ? 'bg-zinc-800 text-zinc-100 font-medium'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {isPinned ? (
                      <Pin className="w-3 h-3 shrink-0 text-amber-400 fill-amber-400/30" />
                    ) : (
                      <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-zinc-200' : 'text-zinc-500'}`} />
                    )}

                    {isEditing ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(conv.id, e as any);
                          if (e.key === 'Escape') handleCancelEdit(e as any);
                        }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        className="bg-zinc-900 border border-zinc-600 rounded px-1.5 py-0.5 text-xs text-white outline-none w-full"
                      />
                    ) : (
                      <span className="truncate text-xs">
                        {conv.title || 'Untitled Conversation'}
                      </span>
                    )}
                  </div>

                  {/* Actions on hover */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1.5 shrink-0">
                    {isEditing ? (
                      <>
                        <button
                          onClick={(e) => handleSaveEdit(conv.id, e)}
                          className="p-1 hover:text-emerald-400 text-zinc-400 rounded"
                          title="Save"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 hover:text-zinc-200 text-zinc-400 rounded"
                          title="Cancel"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => togglePin(conv.id, e)}
                          className={`p-1 rounded ${isPinned ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                          title={isPinned ? 'Unpin' : 'Pin to top'}
                        >
                          <Pin className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleStartEdit(conv.id, conv.title, e)}
                          className="p-1 hover:text-zinc-200 text-zinc-500 rounded"
                          title="Rename"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(conv.id, e)}
                          className="p-1 hover:text-rose-400 text-zinc-500 rounded"
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

        {/* Footer: Workspace & Status */}
        <div className="p-3 border-t border-white/[0.06] bg-[#09090b]/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <div className="truncate text-[11px]">
                <div className="text-zinc-200 font-medium truncate">100% Free Catalog</div>
                <div className="text-zinc-400 font-mono text-[10px]">{models.length ? `${models.length} Models` : 'Free Tier'}</div>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('settings')}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors"
              title="Workspace Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
