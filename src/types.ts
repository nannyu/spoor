import type { AIConfig } from './components/AISettingsModal';

export type CallAIFn = (params: {
  config: AIConfig;
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  topP?: number;
}) => Promise<string | undefined>;
