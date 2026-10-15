export interface OpenRouterPricing {
  prompt: string;
  completion: string;
  image?: string;
  request?: string;
}

export interface OpenRouterArchitecture {
  modality?: string;
  tokenizer?: string;
  instruct_type?: string;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length: number;
  pricing: OpenRouterPricing;
  architecture?: OpenRouterArchitecture;
  top_provider?: {
    max_completion_tokens?: number;
    is_moderated?: boolean;
  };
  is_free?: boolean;
  category?: 'featured' | 'free' | 'openai' | 'anthropic' | 'google' | 'deepseek' | 'meta' | 'vision' | 'other';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning?: string;
  model?: string;
  imageUrl?: string;
  tokens?: number;
  createdAt: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  model: string;
  systemPrompt?: string;
  temperature: number;
  maxTokens: number;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedImage {
  id: string;
  prompt: string;
  negativePrompt?: string;
  model: string;
  imageUrl: string;
  width: number;
  height: number;
  aspectRatio: string;
  style: string;
  seed: number;
  createdAt: string;
}

export interface GeneratedVideo {
  id: string;
  title: string;
  prompt: string;
  script?: string;
  model: string;
  videoUrl: string;
  thumbnailUrl?: string;
  avatarId?: string;
  voiceId?: string;
  aspectRatio: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  duration?: number;
  createdAt: string;
}

export interface HeyGenAvatar {
  avatar_id: string;
  avatar_name: string;
  gender: string;
  preview_image_url: string;
}

export interface HeyGenVoice {
  voice_id: string;
  language: string;
  gender: string;
  name: string;
}

export interface AppSettings {
  openRouterApiKey: string;
  heyGenApiKey: string;
  defaultModel: string;
  temperature: number;
  autoSaveSupabase: boolean;
  theme: 'dark' | 'oled' | 'cyber';
}
