import { GoogleGenAI } from '@google/genai';
import { MIMO_TOKEN_PLAN_BASE_URL } from '../constants/mimo';

const LOG_PREFIX = '[Scribe AI]';

/** For logs only — never log full API keys. */
export function maskApiKeyForLog(key: string | undefined): string {
  if (!key?.trim()) return '(empty)';
  const k = key.trim();
  if (k.length <= 12) return `${k.slice(0, 3)}…`;
  return `${k.slice(0, 6)}…${k.slice(-4)}`;
}

export function formatAiError(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' &&
    Object.prototype.hasOwnProperty.call(window, '__TAURI_INTERNALS__');
}

function parseOpenAiStyleErrorBody(raw: string, status: number): string {
  if (!raw.trim()) return `HTTP ${status} (empty body)`;
  try {
    const j = JSON.parse(raw) as Record<string, unknown>;
    const errObj = j.error as Record<string, unknown> | string | undefined;
    if (typeof errObj === 'string') return errObj;
    if (errObj && typeof errObj === 'object') {
      const m = errObj.message;
      if (typeof m === 'string') return m;
    }
    const direct =
      (typeof j.message === 'string' && j.message) ||
      (typeof j.msg === 'string' && j.msg) ||
      (typeof j.detail === 'string' && j.detail);
    if (direct) return direct;
  } catch {
    /* not JSON */
  }
  return raw.length > 800 ? `${raw.slice(0, 800)}…` : raw;
}

function extractChatCompletionContent(data: unknown): string {
  const d = data as {
    choices?: Array<{ message?: { content?: unknown } }>;
  };
  const content = d?.choices?.[0]?.message?.content;
  if (content == null || content === '') {
    console.error(`${LOG_PREFIX} unexpected response (no choices[0].message.content)`, data);
    throw new Error('API returned no text content. Open DevTools → Console for the full response.');
  }
  return typeof content === 'string' ? content : String(content);
}

async function postOpenAiCompatibleChat(
  apiKey: string,
  url: string,
  body: Record<string, unknown>,
  meta: { provider: string; model: string }
): Promise<string> {
  const key = apiKey.trim();
  if (!key) {
    throw new Error('API Key 为空（或只有空格）。请在设置中粘贴 MiMo 的密钥（通常以 tp- 开头）。');
  }
  console.info(`${LOG_PREFIX} chat/completions request`, {
    provider: meta.provider,
    model: meta.model,
    url,
    runtime: isTauriRuntime() ? 'tauri' : 'web',
    apiKey: maskApiKeyForLog(key),
  });

  if (isTauriRuntime()) {
    const { invoke } = await import('@tauri-apps/api/core');
    try {
      const text = await invoke<string>('openai_compatible_chat', { apiKey: key, url, body });
      return text;
    } catch (e) {
      const msg = formatAiError(e);
      console.error(`${LOG_PREFIX} Tauri invoke openai_compatible_chat failed`, msg);
      throw new Error(msg);
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify(body)
    });
  } catch (e) {
    console.error(`${LOG_PREFIX} network/fetch failed`, { url, error: formatAiError(e) });
    throw new Error(`Network error: ${formatAiError(e)}. If this is MiMo in the browser, ensure Vite dev server is running (proxy /api/mimo) or use the desktop app.`);
  }

  const rawText = await response.text();
  if (!response.ok) {
    const msg = parseOpenAiStyleErrorBody(rawText, response.status);
    console.error(`${LOG_PREFIX} chat/completions HTTP error`, {
      status: response.status,
      url,
      bodyPreview: rawText.slice(0, 2000),
    });
    throw new Error(msg);
  }

  let data: unknown;
  try {
    data = JSON.parse(rawText);
  } catch {
    console.error(`${LOG_PREFIX} invalid JSON response`, rawText.slice(0, 2000));
    throw new Error('API returned non-JSON response. See console for preview.');
  }
  return extractChatCompletionContent(data);
}

export type CallAIFn = (params: {
  config: {
    provider: string;
    apiKey: string;
    baseUrl: string;
    model: string;
  };
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  topP?: number;
}) => Promise<string>;

export async function callUniversalAI({
  config,
  prompt,
  systemInstruction,
  temperature = 0.7,
  topP = 0.4
}: {
  config: {
    provider: string;
    apiKey: string;
    baseUrl: string;
    model: string;
  };
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  topP?: number;
}): Promise<string> {
  const apiKeyTrimmed = (config.apiKey ?? '').trim();
  const useUserConfig = Boolean(apiKeyTrimmed);

  if (config.provider === 'gemini') {
    const apiKey = useUserConfig ? apiKeyTrimmed : (process.env.GEMINI_API_KEY as string | undefined)?.trim();
    if (!apiKey) throw new Error("Gemini: API Key missing (set in Settings or GEMINI_API_KEY).");

    console.info(`${LOG_PREFIX} Gemini generateContent`, {
      model: useUserConfig ? config.model : 'gemini-3-flash-preview',
      apiKey: maskApiKeyForLog(apiKey),
    });

    const ai = new GoogleGenAI({ apiKey });
    const modelId = useUserConfig ? config.model : "gemini-3-flash-preview";

    try {
      const response = await ai.models.generateContent({
        model: modelId,
        contents: prompt,
        config: {
          systemInstruction,
          temperature,
          topP
        }
      });
      return response.text || '';
    } catch (e) {
      console.error(`${LOG_PREFIX} Gemini failed`, formatAiError(e));
      throw e instanceof Error ? e : new Error(formatAiError(e));
    }
  }

  if (!useUserConfig) {
    throw new Error(`API Key missing for provider "${config.provider}". Open Settings and paste your key.`);
  }

  if (config.provider === 'openai' || config.provider === 'custom' || config.provider === 'mimo') {
    const baseNormalized = (config.baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
    const mimoBase = (config.baseUrl || MIMO_TOKEN_PLAN_BASE_URL).replace(/\/$/, '');
    const chatUrl =
      config.provider === 'mimo'
        ? (isTauriRuntime() ? `${mimoBase}/chat/completions` : '/api/mimo/chat/completions')
        : `${baseNormalized}/chat/completions`;

    const model = config.model || (config.provider === 'mimo' ? 'mimo-v2.5-pro' : 'gpt-4o');
    const body = {
      model,
      messages: [
        ...(systemInstruction ? [{ role: 'system' as const, content: systemInstruction }] : []),
        { role: 'user' as const, content: prompt }
      ],
      temperature,
      top_p: topP
    };

    return postOpenAiCompatibleChat(apiKeyTrimmed, chatUrl, body, {
      provider: config.provider,
      model,
    });
  }

  if (config.provider === 'anthropic') {
    console.info(`${LOG_PREFIX} Anthropic messages`, {
      model: config.model || 'claude-3-5-sonnet-20240620',
      apiKey: maskApiKeyForLog(apiKeyTrimmed),
    });
    const response = await fetch(`https://api.anthropic.com/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKeyTrimmed,
        'anthropic-version': '2023-06-01',
        'dangerouslyAllowBrowser': 'true'
      },
      body: JSON.stringify({
        model: config.model || 'claude-3-5-sonnet-20240620',
        system: systemInstruction,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
        temperature
      })
    });

    if (!response.ok) {
      const raw = await response.text();
      const msg = parseOpenAiStyleErrorBody(raw, response.status);
      console.error(`${LOG_PREFIX} Anthropic HTTP error`, response.status, raw.slice(0, 2000));
      throw new Error(msg);
    }
    const data = await response.json();
    return data.content[0].text;
  }

  throw new Error(`Provider not supported: ${config.provider}`);
}
