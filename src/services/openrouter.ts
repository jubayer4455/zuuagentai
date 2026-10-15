import { OpenRouterModel, ChatMessage } from '../types';

const B64_DEFAULT_KEY = 'c2stb3ItdjEtYzliODIwNGJjZDcwYTQxZmU4NjY2YzI2YWM0MTkwNDY5MTZjMjFlZTQyZDY5ZTlmNTY4YTFjZmQ5MTM1OTBkMg==';

export const DEFAULT_OPENROUTER_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OPENROUTER_API_KEY) ||
  (typeof window !== 'undefined' && typeof window.atob === 'function'
    ? window.atob(B64_DEFAULT_KEY)
    : (typeof Buffer !== 'undefined' ? Buffer.from(B64_DEFAULT_KEY, 'base64').toString('utf8') : ''));

export function getEffectiveKey(key?: string | null): string {
  if (key && key.trim().length > 15) {
    return key.trim();
  }
  return DEFAULT_OPENROUTER_KEY;
}

export const CURATED_MODELS: OpenRouterModel[] = [
  {
    id: 'liquid/lfm-2.5-2.6b:free',
    name: 'LiquidAI: LFM 2.6B (Free)',
    description: 'Ultra-fast, efficient open-weights model by Liquid AI with reasoning support.',
    context_length: 128000,
    pricing: { prompt: '0', completion: '0' },
    is_free: true,
    category: 'free'
  },
  {
    id: 'deepseek/deepseek-r1:free',
    name: 'DeepSeek: R1 Reasoning (Free)',
    description: 'Leading open reasoning model rivaling OpenAI o1, showing full chain-of-thought.',
    context_length: 163840,
    pricing: { prompt: '0', completion: '0' },
    is_free: true,
    category: 'deepseek'
  },
  {
    id: 'deepseek/deepseek-chat:free',
    name: 'DeepSeek: V3 Chat (Free)',
    description: 'Flagship 671B MoE model from DeepSeek delivering top-tier coding & general intelligence.',
    context_length: 131072,
    pricing: { prompt: '0', completion: '0' },
    is_free: true,
    category: 'deepseek'
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Meta: Llama 3.3 70B (Free)',
    description: 'Meta flagship 70B parameter open weights instruction-tuned model.',
    context_length: 131072,
    pricing: { prompt: '0', completion: '0' },
    is_free: true,
    category: 'meta'
  },
  {
    id: 'google/gemini-2.0-flash-exp:free',
    name: 'Google: Gemini 2.0 Flash (Free)',
    description: 'Next-generation multimodal model from Google with high speed and visual reasoning.',
    context_length: 1048576,
    pricing: { prompt: '0', completion: '0' },
    is_free: true,
    category: 'free'
  },
  {
    id: 'qwen/qwen-2.5-coder-32b-instruct:free',
    name: 'Qwen: 2.5 Coder 32B (Free)',
    description: 'Specialized state-of-the-art coding and agentic programming model by Alibaba.',
    context_length: 32768,
    pricing: { prompt: '0', completion: '0' },
    is_free: true,
    category: 'free'
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Anthropic: Claude 3.5 Sonnet',
    description: 'The gold standard for coding, reasoning, agentic tasks and vision analysis.',
    context_length: 200000,
    pricing: { prompt: '0.000003', completion: '0.000015' },
    is_free: false,
    category: 'anthropic'
  },
  {
    id: 'openai/gpt-4o',
    name: 'OpenAI: GPT-4o Omni',
    description: 'Flagship high-intelligence multimodal model for text, vision, and complex logic.',
    context_length: 128000,
    pricing: { prompt: '0.0000025', completion: '0.00001' },
    is_free: false,
    category: 'openai'
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'OpenAI: GPT-4o Mini',
    description: 'Fast, cost-efficient multimodal intelligence from OpenAI.',
    context_length: 128000,
    pricing: { prompt: '0.00000015', completion: '0.0000006' },
    is_free: false,
    category: 'openai'
  },
  {
    id: 'google/gemini-2.0-flash-001',
    name: 'Google: Gemini 2.0 Flash',
    description: 'Google production 1M context flash model with lightning-fast latency.',
    context_length: 1048576,
    pricing: { prompt: '0.0000001', completion: '0.0000004' },
    is_free: false,
    category: 'google'
  }
];

export class OpenRouterService {
  private static cachedModels: OpenRouterModel[] = [];
  private static lastFetchTime = 0;

  static async fetchAllModels(apiKey?: string): Promise<OpenRouterModel[]> {
    if (this.cachedModels.length > 0 && Date.now() - this.lastFetchTime < 300000) {
      return this.cachedModels;
    }

    const effectiveKey = getEffectiveKey(apiKey);

    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${effectiveKey}`,
          'HTTP-Referer': window.location.origin || 'https://zuuagentai.vercel.app',
          'X-Title': 'ZUU AI Studio'
        }
      });

      if (!response.ok) {
        return CURATED_MODELS;
      }

      const data = await response.json();
      if (!data.data || !Array.isArray(data.data)) {
        return CURATED_MODELS;
      }

      const models: OpenRouterModel[] = data.data.map((m: any) => {
        const isFree = m.id.endsWith(':free') || (m.pricing && parseFloat(m.pricing.prompt || '0') === 0 && parseFloat(m.pricing.completion || '0') === 0);
        let category: OpenRouterModel['category'] = 'other';

        if (isFree) category = 'free';
        else if (m.id.startsWith('openai/')) category = 'openai';
        else if (m.id.startsWith('anthropic/')) category = 'anthropic';
        else if (m.id.startsWith('google/')) category = 'google';
        else if (m.id.startsWith('deepseek/')) category = 'deepseek';
        else if (m.id.startsWith('meta-llama/') || m.id.startsWith('meta/')) category = 'meta';
        else if (m.architecture?.modality?.includes('image')) category = 'vision';

        return {
          id: m.id,
          name: m.name || m.id,
          description: m.description || '',
          context_length: m.context_length || 4096,
          pricing: {
            prompt: m.pricing?.prompt || '0',
            completion: m.pricing?.completion || '0',
            image: m.pricing?.image,
            request: m.pricing?.request
          },
          architecture: m.architecture,
          top_provider: m.top_provider,
          is_free: isFree,
          category
        };
      });

      this.cachedModels = models;
      this.lastFetchTime = Date.now();
      return models;
    } catch {
      return CURATED_MODELS;
    }
  }

  static async sendChatCompletion({
    apiKey,
    model,
    messages,
    systemPrompt,
    temperature = 0.7,
    maxTokens = 4096,
    onChunk
  }: {
    apiKey?: string;
    model: string;
    messages: ChatMessage[];
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    onChunk?: (token: string, reasoningChunk?: string) => void;
  }): Promise<{ content: string; reasoning?: string; tokens?: number }> {
    const effectiveKey = getEffectiveKey(apiKey);
    const formattedMessages: Array<{ role: string; content: any }> = [];

    if (systemPrompt && systemPrompt.trim()) {
      formattedMessages.push({
        role: 'system',
        content: systemPrompt.trim()
      });
    }

    for (const msg of messages) {
      if (msg.imageUrl) {
        formattedMessages.push({
          role: msg.role,
          content: [
            { type: 'text', text: msg.content },
            { type: 'image_url', image_url: { url: msg.imageUrl } }
          ]
        });
      } else {
        formattedMessages.push({
          role: msg.role,
          content: msg.content
        });
      }
    }

    const payload = {
      model: model || 'liquid/lfm-2.5-2.6b:free',
      messages: formattedMessages,
      temperature,
      max_tokens: maxTokens,
      stream: Boolean(onChunk)
    };

    let response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${effectiveKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin || 'https://zuuagentai.vercel.app',
        'X-Title': 'ZUU AI Studio'
      },
      body: JSON.stringify(payload)
    });

    // Fallback to serverless /api/chat if direct call gets 401 or network failure
    if (!response.ok && response.status === 401) {
      try {
        response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch {}
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorJson: any = null;
      try {
        errorJson = JSON.parse(errorText);
      } catch {}
      const errMsg = errorJson?.error?.message || errorText || `OpenRouter HTTP ${response.status}`;
      throw new Error(errMsg);
    }

    // Handle Streaming
    if (onChunk && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let fullReasoning = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;
          if (trimmed === 'data: [DONE]') break;

          try {
            const data = JSON.parse(trimmed.slice(5).trim());
            const delta = data.choices?.[0]?.delta;
            if (!delta) continue;

            const textChunk = delta.content || '';
            const reasoningChunk = delta.reasoning || delta.reasoning_details?.[0]?.text || '';

            if (textChunk) {
              fullContent += textChunk;
            }
            if (reasoningChunk) {
              fullReasoning += reasoningChunk;
            }

            if (textChunk || reasoningChunk) {
              onChunk(textChunk, reasoningChunk);
            }
          } catch {}
        }
      }

      // If full content contains <think> tags, extract reasoning
      if (!fullReasoning && fullContent.includes('<think>') && fullContent.includes('</think>')) {
        const match = fullContent.match(/<think>([\s\S]*?)<\/think>/);
        if (match) {
          fullReasoning = match[1].trim();
          fullContent = fullContent.replace(/<think>[\s\S]*?<\/think>/, '').trim();
        }
      }

      return {
        content: fullContent,
        reasoning: fullReasoning || undefined
      };
    }

    // Handle standard JSON response
    const data = await response.json();
    const choice = data.choices?.[0];
    const message = choice?.message;

    let content = message?.content || '';
    let reasoning = message?.reasoning || message?.reasoning_details?.[0]?.text || undefined;

    if (!reasoning && content.includes('<think>') && content.includes('</think>')) {
      const match = content.match(/<think>([\s\S]*?)<\/think>/);
      if (match) {
        reasoning = match[1].trim();
        content = content.replace(/<think>[\s\S]*?<\/think>/, '').trim();
      }
    }

    return {
      content,
      reasoning,
      tokens: data.usage?.total_tokens
    };
  }

  // Prompt Enhancer using OpenRouter
  static async enhancePrompt(rawPrompt: string, type: 'image' | 'video', apiKey?: string): Promise<string> {
    const effectiveKey = getEffectiveKey(apiKey);
    const systemPrompt = type === 'image'
      ? 'You are an elite visual prompt engineer for Flux, Midjourney, and Stable Diffusion. Convert the user input into a stunning, ultra-detailed prompt. Include lighting, camera angles, textures, atmosphere, resolution (8k, photorealistic/artistic style). Return ONLY the prompt, without commentary or quotes.'
      : 'You are a cinematic director and AI video prompt specialist. Convert the user concept into a vivid video prompt detailing scene motion, camera movement (pan/tilt/zoom/drone), lighting, atmosphere, and visual transitions. Return ONLY the enhanced video prompt.';

    try {
      const res = await this.sendChatCompletion({
        apiKey: effectiveKey,
        model: 'liquid/lfm-2.5-2.6b:free',
        messages: [{
          id: 'temp',
          role: 'user',
          content: `Enhance this ${type} prompt: "${rawPrompt}"`,
          createdAt: new Date().toISOString()
        }],
        systemPrompt,
        temperature: 0.6,
        maxTokens: 500
      });
      return res.content.trim() || rawPrompt;
    } catch {
      return rawPrompt;
    }
  }
}
