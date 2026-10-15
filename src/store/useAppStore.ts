import { create } from 'zustand';
import { ChatConversation, ChatMessage, OpenRouterModel, GeneratedImage, GeneratedVideo, AppSettings } from '../types';
import { StorageService } from '../services/storageService';
import { OpenRouterService, CURATED_MODELS } from '../services/openrouter';

interface AppState {
  // Navigation
  activeTab: 'chat' | 'image' | 'video' | 'models' | 'settings';
  setActiveTab: (tab: 'chat' | 'image' | 'video' | 'models' | 'settings') => void;

  // Sidebar
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Models
  models: OpenRouterModel[];
  isLoadingModels: boolean;
  fetchModels: () => Promise<void>;
  selectedModel: string;
  setSelectedModel: (modelId: string) => void;

  // Conversations
  conversations: ChatConversation[];
  activeConversationId: string | null;
  activeConversation: () => ChatConversation | undefined;
  createConversation: (modelId?: string) => ChatConversation;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  updateConversationTitle: (id: string, title: string) => void;
  addMessageToActive: (message: ChatMessage) => void;
  updateLastMessageChunk: (chunk: string, reasoningChunk?: string) => void;

  // Images
  images: GeneratedImage[];
  isGeneratingImage: boolean;
  setIsGeneratingImage: (isGenerating: boolean) => void;
  addImage: (image: GeneratedImage) => void;
  deleteImage: (id: string) => void;

  // Videos
  videos: GeneratedVideo[];
  isGeneratingVideo: boolean;
  setIsGeneratingVideo: (isGenerating: boolean) => void;
  addVideo: (video: GeneratedVideo) => void;
  deleteVideo: (id: string) => void;

  // Settings
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;

  // Notifications
  notification: { message: string; type: 'success' | 'error' | 'info' } | null;
  setNotification: (notification: { message: string; type: 'success' | 'error' | 'info' } | null) => void;
}

export const useAppStore = create<AppState>((set, get) => {
  const initialSettings = StorageService.getSettings();
  const initialConversations = StorageService.getConversations();
  const initialImages = StorageService.getImages();
  const initialVideos = StorageService.getVideos();
  const initialActiveConvId = StorageService.getActiveConversationId() || (initialConversations[0]?.id ?? null);

  return {
    activeTab: 'chat',
    setActiveTab: (tab) => set({ activeTab: tab }),

    isSidebarOpen: true,
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    setSidebarOpen: (open) => set({ isSidebarOpen: open }),

    models: CURATED_MODELS,
    isLoadingModels: false,
    fetchModels: async () => {
      set({ isLoadingModels: true });
      try {
        const apiKey = get().settings.openRouterApiKey;
        const fetched = await OpenRouterService.fetchAllModels(apiKey);
        set({ models: fetched, isLoadingModels: false });
      } catch {
        set({ isLoadingModels: false });
      }
    },
    selectedModel: initialSettings.defaultModel || 'liquid/lfm-2.5-2.6b:free',
    setSelectedModel: (modelId) => set({ selectedModel: modelId }),

    conversations: initialConversations,
    activeConversationId: initialActiveConvId,
    activeConversation: () => {
      const { conversations, activeConversationId } = get();
      return conversations.find((c) => c.id === activeConversationId);
    },

    createConversation: (modelId) => {
      const newConv: ChatConversation = {
        id: crypto.randomUUID(),
        title: 'New Conversation',
        model: modelId || get().selectedModel,
        temperature: get().settings.temperature || 0.7,
        maxTokens: 2000,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updated = [newConv, ...get().conversations];
      StorageService.saveConversations(updated);
      StorageService.setActiveConversationId(newConv.id);
      set({ conversations: updated, activeConversationId: newConv.id });
      return newConv;
    },

    selectConversation: (id) => {
      StorageService.setActiveConversationId(id);
      const conv = get().conversations.find((c) => c.id === id);
      if (conv) {
        set({ activeConversationId: id, selectedModel: conv.model });
      } else {
        set({ activeConversationId: id });
      }
    },

    deleteConversation: (id) => {
      const remaining = get().conversations.filter((c) => c.id !== id);
      StorageService.saveConversations(remaining);
      const nextActiveId = remaining[0]?.id || null;
      StorageService.setActiveConversationId(nextActiveId);
      set({ conversations: remaining, activeConversationId: nextActiveId });
    },

    updateConversationTitle: (id, title) => {
      const updated = get().conversations.map((c) =>
        c.id === id ? { ...c, title, updatedAt: new Date().toISOString() } : c
      );
      StorageService.saveConversations(updated);
      set({ conversations: updated });
    },

    addMessageToActive: (message) => {
      const { activeConversationId, conversations } = get();
      if (!activeConversationId) return;

      const updated = conversations.map((conv) => {
        if (conv.id === activeConversationId) {
          const messages = [...conv.messages, message];
          // Auto generate title on first user message if still default
          let title = conv.title;
          if (conv.title === 'New Conversation' && message.role === 'user') {
            title = message.content.slice(0, 36) + (message.content.length > 36 ? '...' : '');
          }
          return {
            ...conv,
            title,
            messages,
            updatedAt: new Date().toISOString()
          };
        }
        return conv;
      });

      StorageService.saveConversations(updated);
      set({ conversations: updated });
    },

    updateLastMessageChunk: (chunk, reasoningChunk) => {
      const { activeConversationId, conversations } = get();
      if (!activeConversationId) return;

      const updated = conversations.map((conv) => {
        if (conv.id === activeConversationId && conv.messages.length > 0) {
          const messages = [...conv.messages];
          const lastIndex = messages.length - 1;
          const lastMsg = messages[lastIndex];

          if (lastMsg.role === 'assistant') {
            messages[lastIndex] = {
              ...lastMsg,
              content: lastMsg.content + chunk,
              reasoning: (lastMsg.reasoning || '') + (reasoningChunk || '')
            };
          }
          return { ...conv, messages, updatedAt: new Date().toISOString() };
        }
        return conv;
      });

      set({ conversations: updated });
    },

    images: initialImages,
    isGeneratingImage: false,
    setIsGeneratingImage: (isGenerating) => set({ isGeneratingImage: isGenerating }),
    addImage: (image) => {
      const updated = [image, ...get().images];
      StorageService.saveImages(updated);
      set({ images: updated });
    },
    deleteImage: (id) => {
      const updated = get().images.filter((img) => img.id !== id);
      StorageService.saveImages(updated);
      set({ images: updated });
    },

    videos: initialVideos,
    isGeneratingVideo: false,
    setIsGeneratingVideo: (isGenerating) => set({ isGeneratingVideo: isGenerating }),
    addVideo: (video) => {
      const updated = [video, ...get().videos];
      StorageService.saveVideos(updated);
      set({ videos: updated });
    },
    deleteVideo: (id) => {
      const updated = get().videos.filter((v) => v.id !== id);
      StorageService.saveVideos(updated);
      set({ videos: updated });
    },

    settings: initialSettings,
    updateSettings: (newSettings) => {
      const updated = { ...get().settings, ...newSettings };
      StorageService.saveSettings(updated);
      set({ settings: updated });
    },

    notification: null,
    setNotification: (notif) => {
      set({ notification: notif });
      if (notif) {
        setTimeout(() => {
          if (get().notification?.message === notif.message) {
            set({ notification: null });
          }
        }, 4000);
      }
    }
  };
});
