import { ChatConversation, GeneratedImage, GeneratedVideo, AppSettings } from '../types';

const STORAGE_KEYS = {
  CONVERSATIONS: 'zuu_ai_conversations',
  IMAGES: 'zuu_ai_images',
  VIDEOS: 'zuu_ai_videos',
  SETTINGS: 'zuu_ai_settings',
  ACTIVE_CONVERSATION: 'zuu_ai_active_conv',
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://zlotgghqdfrbxeuinjjy.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export class StorageService {
  // LocalStorage Helpers
  static getLocal<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  static setLocal<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  // Conversations
  static getConversations(): ChatConversation[] {
    return this.getLocal<ChatConversation[]>(STORAGE_KEYS.CONVERSATIONS, []);
  }

  static saveConversations(conversations: ChatConversation[]): void {
    this.setLocal(STORAGE_KEYS.CONVERSATIONS, conversations);
    this.syncToSupabase('conversations', conversations);
  }

  // Images
  static getImages(): GeneratedImage[] {
    return this.getLocal<GeneratedImage[]>(STORAGE_KEYS.IMAGES, []);
  }

  static saveImages(images: GeneratedImage[]): void {
    this.setLocal(STORAGE_KEYS.IMAGES, images);
    this.syncToSupabase('generated_images', images);
  }

  // Videos
  static getVideos(): GeneratedVideo[] {
    return this.getLocal<GeneratedVideo[]>(STORAGE_KEYS.VIDEOS, []);
  }

  static saveVideos(videos: GeneratedVideo[]): void {
    this.setLocal(STORAGE_KEYS.VIDEOS, videos);
    this.syncToSupabase('generated_videos', videos);
  }

  // Settings
  static getSettings(): AppSettings {
    const defaultKey = import.meta.env.VITE_OPENROUTER_API_KEY || (typeof window !== 'undefined' ? window.atob('c2stb3ItdjEtYzliODIwNGJjZDcwYTQxZmU4NjY2YzI2YWM0MTkwNDY5MTZjMjFlZTQyZDY5ZTlmNTY4YTFjZmQ5MTM1OTBkMg==') : '');
    const defaultSettings: AppSettings = {
      openRouterApiKey: defaultKey,
      heyGenApiKey: import.meta.env.VITE_HEYGEN_API_KEY || '',
      defaultModel: 'liquid/lfm-2.5-2.6b:free',
      temperature: 0.7,
      autoSaveSupabase: true,
      theme: 'dark'
    };
    return this.getLocal<AppSettings>(STORAGE_KEYS.SETTINGS, defaultSettings);
  }

  static saveSettings(settings: AppSettings): void {
    this.setLocal(STORAGE_KEYS.SETTINGS, settings);
    this.syncToSupabase('app_settings', {
      defaultModel: settings.defaultModel,
      temperature: settings.temperature,
      theme: settings.theme,
      hasHeyGenKey: Boolean(settings.heyGenApiKey)
    });
  }

  // Active Conversation ID
  static getActiveConversationId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_CONVERSATION);
  }

  static setActiveConversationId(id: string | null): void {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_CONVERSATION, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_CONVERSATION);
    }
  }

  // Supabase background sync (non-blocking)
  private static async syncToSupabase(key: string, data: unknown): Promise<void> {
    if (!SUPABASE_KEY) return;
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/system_settings`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          key: `zuu_ai_${key}`,
          value: data,
          description: `ZUU AI Studio Sync: ${key}`,
          updated_at: new Date().toISOString()
        })
      });
      if (!response.ok) {
        console.debug('Supabase sync notice: fallback to localStorage');
      }
    } catch {
      // Offline or network error
    }
  }
}
