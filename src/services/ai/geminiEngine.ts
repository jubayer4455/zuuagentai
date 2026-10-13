// ==============================================================================
// Zuu Agent — Google Gemini AI Integration Engine
// Calls official Gemini models with server-side API key validation, rate-limit
// backoff, quota exhaustion classification, response sanitation, and token counts.
// ==============================================================================

export interface GeminiGenerationOptions {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  timeoutMs?: number;
}

export interface GeminiGenerationResult {
  success: boolean;
  content: string;
  tokensUsed: number;
  model: string;
  error?: string;
  isQuotaExhausted?: boolean;
  isMissingApiKey?: boolean;
}

export class GeminiEngine {
  private static DEFAULT_MODEL = 'gemini-2.0-flash';
  private static FALLBACK_MODEL = 'gemini-1.5-flash';

  /**
   * Resolves server-side Gemini API Key
   */
  public static getApiKey(overrideKey?: string): string {
    if (overrideKey && overrideKey.trim()) return overrideKey.trim();
    if (typeof process !== 'undefined' && process.env) {
      return process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY || '';
    }
    return '';
  }

  /**
   * Sanitizes and normalizes generated AI text output
   */
  public static sanitizeContent(rawText: string): string {
    if (!rawText) return '';
    return rawText
      .replace(/^```[a-z]*\n/i, '') // Remove markdown code blocks if erroneously wrapped
      .replace(/\n```$/g, '')
      .replace(/\r\n/g, '\n')
      .trim();
  }

  /**
   * Generates content via official Google Gemini REST API
   */
  public static async generateContent(
    systemPrompt: string,
    userPrompt: string,
    options: GeminiGenerationOptions = {}
  ): Promise<GeminiGenerationResult> {
    const apiKey = this.getApiKey(options.apiKey);
    const model = options.model || this.DEFAULT_MODEL;
    const temperature = options.temperature ?? 0.8;
    const maxOutputTokens = options.maxOutputTokens ?? 1500;
    const timeoutMs = options.timeoutMs ?? 25000;

    if (!apiKey) {
      return {
        success: false,
        content: '',
        tokensUsed: 0,
        model,
        isMissingApiKey: true,
        error: 'Missing Google Gemini API Key. Configure GEMINI_API_KEY in server environment variables or API connections.'
      };
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${systemPrompt ? `[SYSTEM INSTRUCTIONS]\n${systemPrompt}\n\n` : ''}[TASK]\n${userPrompt}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature,
        maxOutputTokens,
        topP: options.topP ?? 0.95
      }
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Handle HTTP status
      if (response.status === 429) {
        return {
          success: false,
          content: '',
          tokensUsed: 0,
          model,
          isQuotaExhausted: true,
          error: 'Gemini free-tier quota exhausted (HTTP 429 Too Many Requests). Rate limit exceeded for model.'
        };
      }

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        const message = errorJson.error?.message || `Gemini API returned HTTP ${response.status}: ${response.statusText}`;
        return {
          success: false,
          content: '',
          tokensUsed: 0,
          model,
          error: message
        };
      }

      const data = await response.json();
      const rawOutput = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const sanitized = this.sanitizeContent(rawOutput);
      const tokensUsed = data.usageMetadata?.totalTokenCount || Math.round((systemPrompt.length + userPrompt.length + sanitized.length) / 3.8);

      return {
        success: true,
        content: sanitized,
        tokensUsed,
        model
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        return {
          success: false,
          content: '',
          tokensUsed: 0,
          model,
          error: `Gemini API request timed out after ${timeoutMs}ms.`
        };
      }
      return {
        success: false,
        content: '',
        tokensUsed: 0,
        model,
        error: `Network error connecting to Gemini API: ${err.message}`
      };
    }
  }
}
