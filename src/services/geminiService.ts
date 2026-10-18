import { OpenRouterModel, ChatMessage } from '../types';

export const GEMINI_MODELS: OpenRouterModel[] = [
  {
    id: 'google/gemini-2.0-flash',
    name: 'Google: Gemini 2.0 Flash (Free Tier)',
    description: 'Next-gen multimodal foundation model with 1M context window, high reasoning speed, and vision.',
    context_length: 1048576,
    pricing: { prompt: '0', completion: '0' },
    is_free: true,
    category: 'gemini'
  },
  {
    id: 'google/gemini-2.0-flash-lite',
    name: 'Google: Gemini 2.0 Flash Lite (Free Tier)',
    description: 'Ultra-fast, cost-efficient model for quick answers and chat conversations.',
    context_length: 1048576,
    pricing: { prompt: '0', completion: '0' },
    is_free: true,
    category: 'gemini'
  },
  {
    id: 'google/gemini-1.5-pro',
    name: 'Google: Gemini 1.5 Pro (Free Tier)',
    description: 'Premier thinking model with 2M token context for complex reasoning, code, and document analysis.',
    context_length: 2097152,
    pricing: { prompt: '0', completion: '0' },
    is_free: true,
    category: 'gemini'
  },
  {
    id: 'google/gemini-1.5-flash',
    name: 'Google: Gemini 1.5 Flash (Free Tier)',
    description: 'Fast, versatile multimodal workhorse for high-frequency workflows.',
    context_length: 1048576,
    pricing: { prompt: '0', completion: '0' },
    is_free: true,
    category: 'gemini'
  }
];

export class GeminiService {
  /**
   * Normalize model ID to Google Generative Language format
   * e.g. "google/gemini-2.0-flash" -> "gemini-2.0-flash"
   */
  static cleanModelId(model: string): string {
    const raw = model.replace('google/', '');
    if (raw.includes('gemini-2.0-flash-lite')) return 'gemini-2.0-flash-lite-preview-02-05';
    if (raw.includes('gemini-2.0-flash')) return 'gemini-2.0-flash';
    if (raw.includes('gemini-1.5-pro')) return 'gemini-1.5-pro';
    if (raw.includes('gemini-1.5-flash')) return 'gemini-1.5-flash';
    return raw;
  }

  /**
   * Validate a Google AI Studio Gemini API Key
   */
  static async validateKey(apiKey: string): Promise<{ valid: boolean; message?: string }> {
    if (!apiKey || apiKey.trim().length < 20) {
      return { valid: false, message: 'Key is too short or empty' };
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey.trim()}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Ping' }] }],
          generationConfig: { maxOutputTokens: 5 }
        })
      });

      if (res.ok) {
        return { valid: true };
      }

      const err = await res.json().catch(() => ({}));
      return { valid: false, message: err.error?.message || `HTTP ${res.status}` };
    } catch (e: any) {
      return { valid: false, message: e.message || 'Network error' };
    }
  }

  /**
   * Convert data URL (data:image/jpeg;base64,...) to inlineData for Gemini
   */
  private static parseImageData(dataUrl: string) {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;
    return {
      inlineData: {
        mimeType: match[1],
        data: match[2]
      }
    };
  }

  /**
   * Stream chat completion directly from Google Gemini API
   */
  static async streamChatCompletion({
    apiKey,
    model = 'gemini-2.0-flash',
    messages,
    systemPrompt,
    temperature = 0.7,
    onChunk
  }: {
    apiKey: string;
    model?: string;
    messages: ChatMessage[];
    systemPrompt?: string;
    temperature?: number;
    onChunk?: (chunk: string) => void;
  }): Promise<{ content: string }> {
    if (!apiKey || !apiKey.trim()) {
      throw new Error('Google Gemini API Key is missing. Please add your key in Settings.');
    }

    const cleanModel = this.cleanModelId(model);
    const contents: any[] = [];

    for (const msg of messages) {
      const parts: any[] = [];

      if (msg.imageUrl) {
        const imgPart = this.parseImageData(msg.imageUrl);
        if (imgPart) parts.push(imgPart);
      }

      if (msg.content && msg.content.trim()) {
        parts.push({ text: msg.content.trim() });
      }

      if (parts.length > 0) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts
        });
      }
    }

    if (contents.length === 0) {
      contents.push({ role: 'user', parts: [{ text: 'Hello' }] });
    }

    const payload: any = {
      contents,
      generationConfig: {
        temperature,
        maxOutputTokens: 2048
      }
    };

    const defaultInstruction = 'You are ZUU AI, an intelligent, helpful, and culturally aware AI assistant. You are completely fluent in English, Bengali (বাংলা), and Romanized Bengali / Banglish (e.g. "kemon acho" = "how are you", "ki khobor" = "what news/what\'s up", "valo achi" = "I am fine", "ki korcho" = "what are you doing"). When the user writes in Bengali or Banglish, always understand it seamlessly and respond warmly in natural Bengali (বাংলা) or Banglish as requested.';
    const finalInstruction = systemPrompt && systemPrompt.trim() ? systemPrompt.trim() : defaultInstruction;
    payload.systemInstruction = {
      parts: [{ text: finalInstruction }]
    };

    const streamUrl = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:streamGenerateContent?alt=sse&key=${apiKey.trim()}`;

    const response = await fetch(streamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      try {
        const errJson = JSON.parse(errText);
        throw new Error(errJson.error?.message || `Google Gemini API Error (${response.status})`);
      } catch {
        throw new Error(`Google Gemini Error (${response.status}): ${errText.slice(0, 200)}`);
      }
    }

    // Handle Streaming Response
    let fullText = '';
    const reader = response.body?.getReader();
    const decoder = new TextDecoder('utf-8');

    if (!reader) {
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (onChunk) onChunk(text);
      return { content: text };
    }

    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.slice(6).trim();
          if (!jsonStr || jsonStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const candidate = parsed.candidates?.[0];
            const textPart = candidate?.content?.parts?.[0]?.text;
            if (textPart) {
              fullText += textPart;
              if (onChunk) {
                onChunk(textPart);
              }
            }
          } catch {
            // Partial JSON chunk
          }
        }
      }
    }

    return { content: fullText };
  }
}
