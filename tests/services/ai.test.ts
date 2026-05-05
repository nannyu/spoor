import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGenerateContent = vi.fn().mockResolvedValue({ text: 'Gemini response' });

vi.mock('@google/genai', () => ({
  GoogleGenAI: class MockGoogleGenAI {
    models = { generateContent: mockGenerateContent };
  },
}));

import { callUniversalAI } from '../../src/services/ai';

const baseConfig = {
  provider: 'gemini',
  apiKey: 'test-key',
  baseUrl: '',
  model: 'gemini-1.5-flash',
};

describe('callUniversalAI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Gemini ---
  describe('Gemini provider', () => {
    it('使用用户 apiKey 调用 Gemini', async () => {
      const result = await callUniversalAI({
        config: baseConfig,
        prompt: 'Hello Gemini',
      });
      expect(result).toBe('Gemini response');
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-1.5-flash',
          contents: 'Hello Gemini',
        })
      );
    });

    it('传递 systemInstruction 给 Gemini', async () => {
      mockGenerateContent.mockClear();
      await callUniversalAI({
        config: baseConfig,
        prompt: 'Hello',
        systemInstruction: 'You are helpful',
      });
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({ systemInstruction: 'You are helpful' }),
        })
      );
    });

    it('使用用户 model 参数', async () => {
      mockGenerateContent.mockClear();
      await callUniversalAI({
        config: { ...baseConfig, model: 'gemini-2.0-flash' },
        prompt: 'Hello',
      });
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'gemini-2.0-flash' })
      );
    });

    it('apiKey 为空且无环境变量时抛错', async () => {
      const original = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;
      await expect(
        callUniversalAI({
          config: { ...baseConfig, apiKey: '' },
          prompt: 'Hello',
        })
      ).rejects.toThrow('API Key missing');
      process.env.GEMINI_API_KEY = original;
    });
  });

  // --- OpenAI ---
  describe('OpenAI provider', () => {
    beforeEach(() => {
      const okBody = JSON.stringify({
        choices: [{ message: { content: 'OpenAI response' } }],
      });
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        text: async () => okBody,
        json: async () => JSON.parse(okBody),
      }));
    });

    it('调用 OpenAI endpoint 返回内容', async () => {
      const result = await callUniversalAI({
        config: { ...baseConfig, provider: 'openai', apiKey: 'sk-test' },
        prompt: 'Hello OpenAI',
      });
      expect(result).toBe('OpenAI response');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/chat/completions'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer sk-test',
          }),
        })
      );
    });

    it('使用自定义 baseUrl', async () => {
      await callUniversalAI({
        config: { ...baseConfig, provider: 'openai', apiKey: 'sk-test', baseUrl: 'http://localhost:8080/v1' },
        prompt: 'Hello',
      });
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/v1/chat/completions',
        expect.anything()
      );
    });

    it('API 返回非 200 时抛错', async () => {
      const errorBody = JSON.stringify({ error: { message: 'Unauthorized' } });
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => errorBody,
        json: async () => ({ error: { message: 'Unauthorized' } }),
      } as any);
      await expect(
        callUniversalAI({
          config: { ...baseConfig, provider: 'openai', apiKey: 'bad-key' },
          prompt: 'Hello',
        })
      ).rejects.toThrow('Unauthorized');
    });

    it('传递 systemInstruction 给 OpenAI', async () => {
      await callUniversalAI({
        config: { ...baseConfig, provider: 'openai', apiKey: 'sk-test' },
        prompt: 'Hello',
        systemInstruction: 'You are a bot',
      });
      const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1].body as string);
      expect(body.messages[0]).toEqual({ role: 'system', content: 'You are a bot' });
      expect(body.messages[1]).toEqual({ role: 'user', content: 'Hello' });
    });
  });

  // --- Custom provider (same as OpenAI) ---
  describe('Custom provider', () => {
    it('custom provider 走 OpenAI 兼容路径', async () => {
      const okBody = JSON.stringify({
        choices: [{ message: { content: 'Custom response' } }],
      });
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        text: async () => okBody,
        json: async () => JSON.parse(okBody),
      }));
      const result = await callUniversalAI({
        config: { ...baseConfig, provider: 'custom', apiKey: 'custom-key', baseUrl: 'http://custom.api/v1' },
        prompt: 'Hello',
      });
      expect(result).toBe('Custom response');
    });
  });

  // --- Anthropic ---
  describe('Anthropic provider', () => {
    beforeEach(() => {
      const okBody = JSON.stringify({
        content: [{ text: 'Anthropic response' }],
      });
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        text: async () => okBody,
        json: async () => JSON.parse(okBody),
      }));
    });

    it('调用 Anthropic endpoint 返回内容', async () => {
      const result = await callUniversalAI({
        config: { ...baseConfig, provider: 'anthropic', apiKey: 'sk-ant-test' },
        prompt: 'Hello Claude',
      });
      expect(result).toBe('Anthropic response');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('anthropic.com'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-api-key': 'sk-ant-test',
          }),
        })
      );
    });

    it('传递 system 给 Anthropic', async () => {
      await callUniversalAI({
        config: { ...baseConfig, provider: 'anthropic', apiKey: 'sk-ant-test' },
        prompt: 'Hello',
        systemInstruction: 'Be concise',
      });
      const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1].body as string);
      expect(body.system).toBe('Be concise');
    });

    it('API 返回非 200 时抛错', async () => {
      const errorBody = JSON.stringify({ error: { message: 'Forbidden' } });
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => errorBody,
        json: async () => ({ error: { message: 'Forbidden' } }),
      } as any);
      await expect(
        callUniversalAI({
          config: { ...baseConfig, provider: 'anthropic', apiKey: 'bad-key' },
          prompt: 'Hello',
        })
      ).rejects.toThrow('Forbidden');
    });
  });

  // --- Unsupported provider ---
  describe('不支持的 provider', () => {
    it('抛出 provider not supported 错误', async () => {
      await expect(
        callUniversalAI({
          config: { ...baseConfig, provider: 'invalid-provider', apiKey: 'key' },
          prompt: 'Hello',
        })
      ).rejects.toThrow('Provider not supported');
    });
  });
});
