import { GoogleGenAI } from '@google/genai';

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
  const useUserConfig = config?.apiKey && config.apiKey.trim() !== '';

  if (!useUserConfig || config.provider === 'gemini') {
    const apiKey = useUserConfig ? config.apiKey : (process.env.GEMINI_API_KEY);
    if (!apiKey) throw new Error("API Key missing");
    
    const ai = new GoogleGenAI({ apiKey });
    const modelId = useUserConfig ? config.model : "gemini-3-flash-preview";

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
  }

  if (config.provider === 'openai' || config.provider === 'custom') {
    const baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model || 'gpt-4o',
        messages: [
          ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
          { role: 'user', content: prompt }
        ],
        temperature,
        top_p: topP
      })
    });

    if (!response.ok) {
       const err = await response.json().catch(() => ({}));
       throw new Error(err.error?.message || `API Error: ${response.status}`);
    }
    const data = await response.json();
    return data.choices[0].message.content;
  }

  if (config.provider === 'anthropic') {
    const response = await fetch(`https://api.anthropic.com/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
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
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Anthropic error: ${response.status}`);
    }
    const data = await response.json();
    return data.content[0].text;
  }

  throw new Error("Provider not supported");
}
