import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRef, useState } from 'react';
import { useAiActions } from '../../src/hooks/useAiActions';
import { db } from '../../src/db';
import type { AgentConfig } from '../../src/db';

vi.mock('../../src/services/ai', () => ({
  callUniversalAI: vi.fn().mockResolvedValue('AI generated text'),
}));

import { callUniversalAI } from '../../src/services/ai';

const mockAiConfig = { provider: 'gemini', apiKey: 'test', baseUrl: '', model: 'gemini-1.5-flash' };

function useTestAiActions(opts?: {
  agentConfigs?: AgentConfig[];
  selectedNodes?: Set<string>;
  edges?: { from: string; to: string; id?: string }[];
}) {
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(opts?.selectedNodes ?? new Set());
  const setActiveReferenceId = vi.fn();
  const setActiveTab = vi.fn();

  const nodesRef = useRef<Record<string, HTMLElement | null>>({});
  const transformRef = useRef({ x: 0, y: 0, scale: 1 });

  return {
    ...useAiActions({
      aiConfig: mockAiConfig,
      agentConfigs: opts?.agentConfigs ?? ([] as AgentConfig[]),
      activeCanvasId: 'default',
      nodesRef: nodesRef as React.RefObject<Record<string, HTMLElement | null>>,
      transformRef: transformRef as React.RefObject<{ x: number; y: number; scale: number }>,
      dynamicNodes: [],
      edges: (opts?.edges ?? []) as any[],
      selectedNodes,
      setSelectedNodes,
      setActiveReferenceId,
      setActiveTab,
    }),
    setActiveReferenceId,
    setActiveTab,
    setSelectedNodes,
  };
}

describe('useAiActions', () => {
  beforeEach(async () => {
    await db.nodes.clear();
    await db.articles.clear();
    await db.edges.clear();
    vi.mocked(callUniversalAI).mockClear();
    vi.mocked(callUniversalAI).mockResolvedValue('AI generated text');
  });

  // --- handlePublish ---
  describe('handlePublish', () => {
    it('selectedNodes 为空时不执行', async () => {
      const { result } = renderHook(() => useTestAiActions());

      await act(async () => {
        await result.current.handlePublish();
      });

      expect(callUniversalAI).not.toHaveBeenCalled();
    });
  });

  // --- handleAiSubmit ---
  describe('handleAiSubmit', () => {
    it('aiPrompt 为空时不执行', async () => {
      const { result } = renderHook(() => useTestAiActions());

      await act(async () => {
        await result.current.handleAiSubmit();
      });

      expect(callUniversalAI).not.toHaveBeenCalled();
    });

    it('aiPrompt 有值时调用 AI 并创建节点', async () => {
      const { result } = renderHook(() => useTestAiActions());

      act(() => {
        result.current.setAiPrompt('Write about memory');
      });

      await act(async () => {
        await result.current.handleAiSubmit();
      });

      expect(callUniversalAI).toHaveBeenCalledWith(
        expect.objectContaining({ prompt: expect.stringContaining('Write about memory') })
      );

      const nodes = await db.nodes.toArray();
      expect(nodes.length).toBe(1);
      expect(nodes[0].type).toBe('ai');
      expect(nodes[0].content).toBe('AI generated text');
      expect(result.current.aiPrompt).toBe('');
    });

    it('AI 失败时不创建节点', async () => {
      vi.mocked(callUniversalAI).mockRejectedValueOnce(new Error('API Error'));

      const { result } = renderHook(() => useTestAiActions());

      act(() => {
        result.current.setAiPrompt('Fail request');
      });

      await act(async () => {
        await result.current.handleAiSubmit();
      });

      const nodes = await db.nodes.toArray();
      expect(nodes.length).toBe(0);
    });
  });

  // --- triggerAgentAnalysis ---
  describe('triggerAgentAnalysis', () => {
    it('agentConfigId 不存在时提前返回', async () => {
      const { result } = renderHook(() => useTestAiActions());

      await act(async () => {
        await result.current.triggerAgentAnalysis('nonexistent', 'node1', 'node2');
      });

      expect(callUniversalAI).not.toHaveBeenCalled();
    });
  });

  // --- isAiLoading ---
  describe('isAiLoading', () => {
    it('初始状态为 false', () => {
      const { result } = renderHook(() => useTestAiActions());
      expect(result.current.isAiLoading).toBe(false);
    });
  });
});
