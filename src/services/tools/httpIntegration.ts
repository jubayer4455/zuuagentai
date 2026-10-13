// ==============================================================================
// Zuu Agent — Hardened HTTP Integration Engine (SSRF-Guarded)
// Supports GET, POST, PATCH, DELETE with strict SSRF controls.
// Blocks loopback, RFC 1918 private subnets, and cloud metadata endpoints.
// ==============================================================================

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export interface HttpRequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  timeoutMs?: number;
  maxRetries?: number;
}

export interface HttpResponseResult {
  success: boolean;
  statusCode: number;
  statusText: string;
  data: any;
  headers: Record<string, string>;
  durationMs: number;
  error?: string;
}

export class HttpIntegrationClient {
  /**
   * SSRF Protection: Validates whether a target URL is public and safe to request.
   * Prohibits localhost, 127.0.0.1, 0.0.0.0, 169.254.169.254, RFC 1918 private IPs,
   * file:, and non-http(s) protocols.
   */
  public static validateSafeUrl(urlStr: string): { safe: boolean; reason?: string } {
    try {
      const parsed = new URL(urlStr);

      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { safe: false, reason: `Unsupported protocol "${parsed.protocol}". Only HTTP and HTTPS are permitted.` };
      }

      const hostname = parsed.hostname.toLowerCase();

      // Block localhost, loopbacks, and domain tricks
      if (
        hostname === 'localhost' ||
        hostname.endsWith('.localhost') ||
        hostname === '127.0.0.1' ||
        hostname === '::1' ||
        hostname === '0.0.0.0'
      ) {
        return { safe: false, reason: 'SSRF Violation: Loopback addresses are strictly forbidden.' };
      }

      // Block AWS / GCP / Azure metadata endpoint
      if (hostname === '169.254.169.254' || hostname === 'metadata.google.internal') {
        return { safe: false, reason: 'SSRF Violation: Cloud instance metadata endpoints are strictly forbidden.' };
      }

      // Block RFC 1918 private IPv4 subnets
      // 10.0.0.0/8
      if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
        return { safe: false, reason: 'SSRF Violation: Private subnet 10.0.0.0/8 is forbidden.' };
      }
      // 172.16.0.0/12
      if (/^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
        return { safe: false, reason: 'SSRF Violation: Private subnet 172.16.0.0/12 is forbidden.' };
      }
      // 192.168.0.0/16
      if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
        return { safe: false, reason: 'SSRF Violation: Private subnet 192.168.0.0/16 is forbidden.' };
      }

      return { safe: true };
    } catch (_) {
      return { safe: false, reason: 'Invalid or unparseable URL.' };
    }
  }

  /**
   * Executes a safe, bounded HTTP request
   */
  public static async executeRequest(
    url: string,
    options: HttpRequestOptions = {}
  ): Promise<HttpResponseResult> {
    const startTime = Date.now();
    const method = options.method || 'GET';
    const timeoutMs = options.timeoutMs ?? 15000;

    // 1. SSRF Safety Gate
    const safetyCheck = this.validateSafeUrl(url);
    if (!safetyCheck.safe) {
      return {
        success: false,
        statusCode: 400,
        statusText: 'Bad Request (SSRF Blocked)',
        data: null,
        headers: {},
        durationMs: 0,
        error: safetyCheck.reason
      };
    }

    // 2. Prepare headers & payload
    const headers: Record<string, string> = {
      'User-Agent': 'ZuuAgent-Automation-Engine/2.0',
      'Accept': 'application/json, text/plain, */*',
      ...(options.headers || {})
    };

    let bodyData: any = undefined;
    if (options.body && method !== 'GET') {
      if (typeof options.body === 'object') {
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';
        bodyData = JSON.stringify(options.body);
      } else {
        bodyData = String(options.body);
      }
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: bodyData,
        signal: controller.signal
      });

      clearTimeout(timer);
      const durationMs = Date.now() - startTime;

      let parsedData: any = null;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        parsedData = await response.json().catch(() => null);
      } else {
        parsedData = await response.text().catch(() => null);
      }

      const respHeaders: Record<string, string> = {};
      response.headers.forEach((val, key) => {
        respHeaders[key] = val;
      });

      return {
        success: response.ok,
        statusCode: response.status,
        statusText: response.statusText,
        data: parsedData,
        headers: respHeaders,
        durationMs,
        error: response.ok ? undefined : `HTTP request returned status ${response.status} (${response.statusText})`
      };
    } catch (err: any) {
      clearTimeout(timer);
      const durationMs = Date.now() - startTime;
      if (err.name === 'AbortError') {
        return {
          success: false,
          statusCode: 408,
          statusText: 'Request Timeout',
          data: null,
          headers: {},
          durationMs,
          error: `HTTP request timed out after ${timeoutMs}ms.`
        };
      }
      return {
        success: false,
        statusCode: 500,
        statusText: 'Network Error',
        data: null,
        headers: {},
        durationMs,
        error: err.message || 'Unknown network error during HTTP request.'
      };
    }
  }
}
