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

import { GEMINI_MODELS, GeminiService } from './geminiService';

export const RELIABLE_FREE_FALLBACKS = [
  'liquid/lfm-2.5-2.6b:free',
  'google/gemma-4-31b-it:free',
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
  'poolside/laguna-s-2.1:free'
];

export const CURATED_MODELS: OpenRouterModel[] = [
  ...GEMINI_MODELS,
  {
    id: 'liquid/lfm-2.5-2.6b:free',
    name: 'LiquidAI: LFM 2.6B (100% Free)',
    description: 'Ultra-fast, efficient open-weights model by Liquid AI with reasoning support.',
    context_length: 128000,
    pricing: { prompt: '0', completion: '0' },
    is_free: true,
    category: 'free'
  },
  {
    id: 'google/gemma-4-31b-it:free',
    name: 'Google: Gemma 4 31B (100% Free)',
    description: 'Google state-of-the-art open weights instruction-tuned model.',
    context_length: 128000,
    pricing: { prompt: '0', completion: '0' },
    is_free: true,
    category: 'free'
  },
  {
    id: 'google/gemma-4-26b-a4b-it:free',
    name: 'Google: Gemma 4 26B A4B (100% Free)',
    description: 'Google cutting-edge reasoning and multilingual model.',
    context_length: 128000,
    pricing: { prompt: '0', completion: '0' },
    is_free: true,
    category: 'free'
  },
  {
    id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
    name: 'NVIDIA: Nemotron 30B Reasoning (100% Free)',
    description: 'Advanced reasoning and conversational model from NVIDIA.',
    context_length: 32768,
    pricing: { prompt: '0', completion: '0' },
    is_free: true,
    category: 'free'
  },
  {
    id: 'nvidia/nemotron-3.5-super-vl:free',
    name: 'NVIDIA: Nemotron 3.5 Super VL (100% Free)',
    description: 'NVIDIA multimodal vision-language model for image inspection and chat.',
    context_length: 65536,
    pricing: { prompt: '0', completion: '0' },
    is_free: true,
    category: 'vision'
  },
  {
    id: 'poolside/laguna-s-2.1:free',
    name: 'Poolside: Laguna S 2.1 (100% Free)',
    description: 'High-performance reasoning and multilingual model with deep thought processes.',
    context_length: 65536,
    pricing: { prompt: '0', completion: '0' },
    is_free: true,
    category: 'free'
  },
  {
    id: 'thinkingmachines/inkling:free',
    name: 'Thinking Machines: Inkling (100% Free)',
    description: 'High-speed reasoning model for coding and general problem solving.',
    context_length: 65536,
    pricing: { prompt: '0', completion: '0' },
    is_free: true,
    category: 'free'
  },
  {
    id: 'cohere/north-mini-code:free',
    name: 'Cohere: North Mini Code (100% Free)',
    description: 'Specialized code completion, debugging, and software architecture model.',
    context_length: 32768,
    pricing: { prompt: '0', completion: '0' },
    is_free: true,
    category: 'free'
  },
  {
    id: 'openrouter/free',
    name: 'OpenRouter: Auto Free Router (100% Free)',
    description: 'Automatically routes to the best available free model with zero downtime.',
    context_length: 65536,
    pricing: { prompt: '0', completion: '0' },
    is_free: true,
    category: 'free'
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

      const freeModels: OpenRouterModel[] = data.data
        .filter((m: any) =>
          m.id.endsWith(':free') ||
          (m.pricing && parseFloat(m.pricing.prompt || '0') === 0 && parseFloat(m.pricing.completion || '0') === 0)
        )
        .map((m: any) => {
          let category: OpenRouterModel['category'] = 'free';
          if (m.architecture?.modality?.includes('image')) category = 'vision';

          return {
            id: m.id,
            name: m.name || m.id,
            description: m.description || '',
            context_length: m.context_length || 4096,
            pricing: {
              prompt: '0',
              completion: '0',
              image: m.pricing?.image,
              request: m.pricing?.request
            },
            architecture: m.architecture,
            top_provider: m.top_provider,
            is_free: true,
            category
          };
        });

      // Merge Google Gemini models with OpenRouter 100% Free models
      const allFreeModels = [...GEMINI_MODELS, ...freeModels];
      this.cachedModels = allFreeModels;
      this.lastFetchTime = Date.now();
      return allFreeModels;
    } catch {
      return CURATED_MODELS;
    }
  }

  static async sendChatCompletion({
    apiKey,
    geminiApiKey,
    model,
    messages,
    systemPrompt,
    temperature = 0.7,
    maxTokens = 2000,
    onChunk
  }: {
    apiKey?: string;
    geminiApiKey?: string;
    model: string;
    messages: ChatMessage[];
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    onChunk?: (token: string, reasoningChunk?: string) => void;
  }): Promise<{ content: string; reasoning?: string; tokens?: number }> {
    // 1. Direct Google Gemini API Routing
    if (model.startsWith('google/gemini-') || model.startsWith('gemini-')) {
      if (geminiApiKey && geminiApiKey.trim()) {
        const geminiRes = await GeminiService.streamChatCompletion({
          apiKey: geminiApiKey,
          model,
          messages,
          systemPrompt,
          temperature,
          onChunk: (chunk) => {
            if (onChunk) onChunk(chunk);
          }
        });
        return { content: geminiRes.content };
      } else {
        throw new Error('Google Gemini API Key is missing. Go to Settings and enter your free Gemini API key from Google AI Studio (aistudio.google.com/apikey), or switch to any other 100% free model from the top bar.');
      }
    }

    const effectiveKey = getEffectiveKey(apiKey);
    const defaultInstruction = 'You are ZUU AI, an intelligent, helpful, and culturally aware AI assistant. You are completely fluent in English, Bengali (বাংলা), and Romanized Bengali / Banglish (e.g. "kemon acho" = "how are you", "ki khobor" = "what news/what\'s up", "valo achi" = "I am fine", "ki korcho" = "what are you doing"). When the user writes in Bengali or Banglish, always understand it seamlessly and respond warmly in natural Bengali (বাংলা) or Banglish as requested.';
    const finalSystemPrompt = systemPrompt && systemPrompt.trim() ? systemPrompt.trim() : defaultInstruction;

    const formattedMessages: any[] = [
      {
        role: 'system',
        content: finalSystemPrompt
      }
    ];

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

    let activeModel = model || 'liquid/lfm-2.5-2.6b:free';

    const executeRequest = async (targetModel: string, customTokens?: number) => {
      const payload = {
        model: targetModel,
        messages: formattedMessages,
        temperature,
        max_tokens: customTokens !== undefined ? customTokens : maxTokens,
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

      // If direct call fails with 401, fallback to serverless /api/chat
      if (!response.ok && response.status === 401) {
        try {
          response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } catch {}
      }

      return response;
    };

    let response = await executeRequest(activeModel);

    // 1. Check if error is affordable tokens limitation (HTTP 402 with 'can only afford X')
    if (!response.ok && response.status === 402) {
      try {
        const errClone = response.clone();
        const errText = await errClone.text();
        const affordMatch = errText.match(/can only afford (\d+)/i);
        if (affordMatch) {
          const affordableTokens = Math.max(250, Math.floor(parseInt(affordMatch[1], 10) * 0.95));
          console.log(`Auto-adjusting max_tokens to affordable limit: ${affordableTokens}`);
          response = await executeRequest(activeModel, affordableTokens);
        }
      } catch {}
    }

    // 2. Automatic fallback if model is 404 (deprecated slug) or still 402 or 429
    if (!response.ok && (response.status === 404 || response.status === 402 || response.status === 429 || response.status === 403)) {
      console.warn(`Model ${activeModel} returned ${response.status}. Attempting free fallback...`);
      for (const fallbackModel of RELIABLE_FREE_FALLBACKS) {
        if (fallbackModel !== activeModel) {
          activeModel = fallbackModel;
          response = await executeRequest(activeModel, 1500);
          if (response.ok) {
            if (onChunk) {
              onChunk(`*(Note: Auto-switched to verified free model **${activeModel}**)*\n\n`);
            }
            break;
          }
        }
      }
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
