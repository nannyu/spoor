import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRef, useState } from 'react';
import { useAiActions } from '../../src/hooks/useAiActions';
import { db } from '../../src/db';
import type { AgentConfig, CanvasNode } from '../../src/db';
import type { AIConfig } from '../../src/components/AISettingsModal';

vi.mock('../../src/services/ai', () => ({
  callUniversalAI: vi.fn().mockResolvedValue('AI generated text'),
  formatAiError: (e: unknown) => (e instanceof Error ? e.message : String(e)),
  maskApiKeyForLog: (k: string) => (k ? `${k.slice(0, 2)}…` : ''),
}));

vi.mock('../../src/services/search', () => ({
  metasoSearch: vi.fn().mockResolvedValue({
    credits: 0,
    total: 0,
    webpages: [],
  }),
  buildSearchContext: vi.fn(),
}));

const analyzeToolbarIntentPreflightMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ ambiguous: false }),
);

vi.mock('../../src/services/toolbarIntentClarification', () => ({
  analyzeToolbarIntentPreflight: (...args: unknown[]) => analyzeToolbarIntentPreflightMock(...args),
}));

import { callUniversalAI } from '../../src/services/ai';
import { metasoSearch } from '../../src/services/search';
import i18n from '../../src/i18n';

const baseAiConfig: AIConfig = {
  provider: 'gemini',
  apiKey: 'test',
  baseUrl: '',
  model: 'gemini-1.5-flash',
  metasoApiKey: 'metaso-k',
};

function useTestAiActions(opts?: {
  agentConfigs?: AgentConfig[];
  selectedNodes?: Set<string>;
  edges?: { from: string; to: string; id?: string }[];
  dynamicNodes?: CanvasNode[];
  aiConfigOverrides?: Partial<AIConfig>;
}) {
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(opts?.selectedNodes ?? new Set());
  const setActiveReferenceId = vi.fn();
  const setActiveTab = vi.fn();

  const nodesRef = useRef<Record<string, HTMLElement | null>>({});
  const transformRef = useRef({ x: 0, y: 0, scale: 1 });

  return {
    ...useAiActions({
      aiConfig: { ...baseAiConfig, ...opts?.aiConfigOverrides },
      agentConfigs: opts?.agentConfigs ?? ([] as AgentConfig[]),
      activeCanvasId: 'default',
      nodesRef: nodesRef as React.RefObject<Record<string, HTMLElement | null>>,
      transformRef: transformRef as React.RefObject<{ x: number; y: number; scale: number }>,
      dynamicNodes: opts?.dynamicNodes ?? [],
      edges: (opts?.edges ?? []) as any[],
      selectedNodes,
      setSelectedNodes,
      setActiveReferenceId,
      setActiveTab,
    }),
    nodesRef,
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
    await i18n.changeLanguage('en');
    vi.mocked(callUniversalAI).mockClear();
    vi.mocked(callUniversalAI).mockResolvedValue('AI generated text');
    vi.mocked(metasoSearch).mockClear();
    vi.mocked(metasoSearch).mockResolvedValue({
      credits: 0,
      total: 0,
      webpages: [],
    });
    analyzeToolbarIntentPreflightMock.mockClear();
    analyzeToolbarIntentPreflightMock.mockResolvedValue({ ambiguous: false });
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
        result.current.setAiPrompt(
          'Write a long reflective paragraph about episodic memory, aging, and narrative identity so that the toolbar intent gate skips preflight.',
        );
      });

      await act(async () => {
        await result.current.handleAiSubmit();
      });

      expect(analyzeToolbarIntentPreflightMock).not.toHaveBeenCalled();
      expect(callUniversalAI).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('episodic memory'),
        }),
      );

      const nodes = await db.nodes.toArray();
      expect(nodes.length).toBe(1);
      expect(nodes[0].type).toBe('ai');
      expect(nodes[0].content).toBe('AI generated text');
      expect(result.current.aiPrompt).toBe('');
    });

    it('无勾选所选节点时不带入便签：prompt 为用户原文且 system 含简明对话设定', async () => {
      const longSkipPreflight =
        'Write a long reflective paragraph about rivers and deltas so toolbar intent gate skips preflight without question marks.';
      const { result } = renderHook(() => useTestAiActions({ selectedNodes: new Set() }));

      act(() => {
        result.current.setAiPrompt(longSkipPreflight);
      });

      await act(async () => {
        await result.current.handleAiSubmit();
      });

      expect(callUniversalAI).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: longSkipPreflight,
          systemInstruction: expect.stringMatching(/concise conversational[\s\S]*Always reply entirely in English/i),
        }),
      );
    });

    it('勾选节点时拼装所选正文，system 为综合节选与用户问题的说明', async () => {
      const longSkipPreflight =
        'Write at length about cloud patterns and precipitation types so toolbar intent gate skips without question marks.';
      const hook = renderHook(() =>
        useTestAiActions({ selectedNodes: new Set(['n1']), edges: [{ from: 'n1', to: 'x' }] }),
      );

      act(() => {
        const noteEl = document.createElement('div');
        noteEl.innerText = 'EXCERPT_FROM_SELECTED_NOTE';
        hook.result.current.nodesRef.current['n1'] = noteEl;
        hook.result.current.setAiPrompt(longSkipPreflight);
      });

      await act(async () => {
        await hook.result.current.handleAiSubmit();
      });

      expect(callUniversalAI).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringMatching(/EXCERPT_FROM_SELECTED_NOTE[\s\S]*precipitation types/i),
          systemInstruction: expect.stringMatching(/selected notes[\s\S]*Always reply entirely in English/i),
        }),
      );
    });

    it('命中预检闸门时先跑意图分析，无疑义则用原文调主模型', async () => {
      const { result } = renderHook(() => useTestAiActions());
      act(() => {
        result.current.setAiPrompt('你怎么看？');
      });
      await act(async () => {
        await result.current.handleAiSubmit();
      });
      expect(analyzeToolbarIntentPreflightMock).toHaveBeenCalledTimes(1);
      expect(analyzeToolbarIntentPreflightMock).toHaveBeenCalledWith(
        '你怎么看？',
        expect.objectContaining({ provider: 'gemini' }),
        expect.any(Function),
      );
      expect(callUniversalAI).toHaveBeenCalledTimes(1);
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

    it('传入 temperature、topP，且 system 含 Markdown 知识块', async () => {
      const agent: AgentConfig = {
        id: 'a1',
        name: 'Test',
        role: 'R',
        prompt: 'You are test',
        temperature: 0.3,
        creativity: 0.9,
        knowledgeMarkdownFiles: [{ name: 'doc.md', content: 'Hello knowledge' }],
      };

      const { result } = renderHook(() =>
        useTestAiActions({
          agentConfigs: [agent],
          dynamicNodes: [
            { id: 'agent-node', type: 'agent', agentConfigId: 'a1', x: 0, y: 0, canvasId: 'default' },
          ],
        }),
      );

      act(() => {
        const el = document.createElement('div');
        el.appendChild(document.createTextNode('context body'));
        result.current.nodesRef.current.ctx1 = el;
      });

      await act(async () => {
        await result.current.triggerAgentAnalysis('a1', 'agent-node', 'ctx1');
      });

      expect(callUniversalAI).toHaveBeenCalledTimes(1);
      expect(callUniversalAI).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.3,
          topP: 0.9,
          systemInstruction: expect.stringMatching(/Markdown knowledge base[\s\S]*doc\.md[\s\S]*Hello knowledge/),
          prompt: expect.stringMatching(/context body/),
        }),
      );
    });
  });

  describe('加载状态标志', () => {
    it('初始均为空闲', () => {
      const { result } = renderHook(() => useTestAiActions());
      expect(result.current.isPublishing).toBe(false);
      expect(result.current.isToolbarAiLoading).toBe(false);
      expect(result.current.analyzingAgentNodeId).toBe(null);
      expect(result.current.followUpParentId).toBe(null);
      expect(result.current.isAnyAiBusy).toBe(false);
    });
  });

  // --- submitAiThreadFollowUp ---
  describe('submitAiThreadFollowUp', () => {
    const parentCard: CanvasNode = {
      id: 'parent-ai',
      type: 'ai',
      content: '上一轮 AI 正文',
      x: 5,
      y: 10,
      canvasId: 'default',
    };

    it('追问文案为空时不调用 AI', async () => {
      await db.nodes.add({ ...parentCard });
      const { result } = renderHook(() =>
        useTestAiActions({ dynamicNodes: [parentCard] })
      );

      await act(async () => {
        await result.current.submitAiThreadFollowUp('parent-ai', '   ');
      });

      expect(callUniversalAI).not.toHaveBeenCalled();
    });

    it('父节点不是 ai 类型时不调用 AI', async () => {
      const noteNode: CanvasNode = {
        id: 'note-1',
        type: 'note',
        content: 'x',
        x: 0,
        y: 0,
        canvasId: 'default',
      };
      const { result } = renderHook(() =>
        useTestAiActions({ dynamicNodes: [noteNode] })
      );

      await act(async () => {
        await result.current.submitAiThreadFollowUp('note-1', '追问');
      });

      expect(callUniversalAI).not.toHaveBeenCalled();
    });

    it('成功时创建子 AI 节点、边，并写入父节点 followUpSent', async () => {
      await db.nodes.add({ ...parentCard });

      const { result } = renderHook(() =>
        useTestAiActions({ dynamicNodes: [parentCard] })
      );

      const mockEl = document.createElement('div');
      Object.defineProperties(mockEl, {
        offsetHeight: { get: () => 100 },
        offsetWidth: { get: () => 280 },
      });

      act(() => {
        result.current.nodesRef.current['parent-ai'] = mockEl;
      });

      await act(async () => {
        await result.current.submitAiThreadFollowUp('parent-ai', '我的追问');
      });

      expect(callUniversalAI).toHaveBeenCalledTimes(1);
      const callArg = vi.mocked(callUniversalAI).mock.calls[0][0];
      expect(callArg.prompt).toContain('我的追问');
      expect(callArg.prompt).toContain('上一轮 AI 正文');

      const allNodes = await db.nodes.toArray();
      expect(allNodes).toHaveLength(2);
      const child = allNodes.find((n) => n.id !== 'parent-ai');
      expect(child?.type).toBe('ai');
      expect(child?.userTurn).toBe('我的追问');
      expect(child?.content).toBe('AI generated text');
      expect(child?.canvasId).toBe('default');
      expect(child?.x).toBe(5);
      expect(child?.y).toBe(10 + 100 + 24);
      expect(child?.width).toBe(280);

      const edges = await db.edges.toArray();
      expect(edges).toHaveLength(1);
      expect(edges[0].from).toBe('parent-ai');
      expect(edges[0].to).toBe(child!.id);

      const parentRow = await db.nodes.get('parent-ai');
      expect(parentRow?.followUpSent).toBe(true);
    });

    it('AI 返回空字符串时不创建子节点且不标记 followUpSent', async () => {
      vi.mocked(callUniversalAI).mockResolvedValueOnce('');
      await db.nodes.add({ ...parentCard });

      const { result } = renderHook(() =>
        useTestAiActions({ dynamicNodes: [parentCard] })
      );

      const mockEl = document.createElement('div');
      Object.defineProperty(mockEl, 'offsetHeight', { get: () => 50 });

      act(() => {
        result.current.nodesRef.current['parent-ai'] = mockEl;
      });

      await act(async () => {
        await result.current.submitAiThreadFollowUp('parent-ai', '追问');
      });

      const nodes = await db.nodes.toArray();
      expect(nodes).toHaveLength(1);

      const parentRow = await db.nodes.get('parent-ai');
      expect(parentRow?.followUpSent).not.toBe(true);
    });

    it('「联网搜索」时调用秘塔并生成子节点与资料卡，不调用对话模型', async () => {
      vi.mocked(metasoSearch).mockResolvedValueOnce({
        credits: 0,
        total: 1,
        webpages: [{ title: 'T', snippet: 'S', link: 'https://ex.com', score: '', date: '' }],
      });
      await db.nodes.add({ ...parentCard });

      const { result } = renderHook(() =>
        useTestAiActions({ dynamicNodes: [parentCard] })
      );

      const mockEl = document.createElement('div');
      Object.defineProperties(mockEl, {
        offsetHeight: { get: () => 100 },
        offsetWidth: { get: () => 280 },
      });

      act(() => {
        result.current.nodesRef.current['parent-ai'] = mockEl;
      });

      await act(async () => {
        await result.current.submitAiThreadFollowUp('parent-ai', '联网搜索');
      });

      expect(callUniversalAI).not.toHaveBeenCalled();
      expect(metasoSearch).toHaveBeenCalledWith('上一轮 AI 正文', { apiKey: 'metaso-k' });

      const allNodes = await db.nodes.toArray();
      expect(allNodes).toHaveLength(3);
      const child = allNodes.find((n) => n.userTurn === '联网搜索');
      expect(child?.type).toBe('ai');
      expect(child?.content).toBeTruthy();

      const edges = await db.edges.toArray();
      expect(edges.length).toBeGreaterThanOrEqual(2);

      const parentRow = await db.nodes.get('parent-ai');
      expect(parentRow?.followUpSent).toBe(true);
    });

    it('「联网搜索 主题」用后面的词作为检索词', async () => {
      vi.mocked(metasoSearch).mockResolvedValueOnce({
        credits: 0,
        total: 1,
        webpages: [{ title: 'T', snippet: 'S', link: 'https://ex.com', score: '', date: '' }],
      });
      await db.nodes.add({ ...parentCard });

      const { result } = renderHook(() =>
        useTestAiActions({ dynamicNodes: [parentCard] })
      );

      const mockEl = document.createElement('div');
      Object.defineProperty(mockEl, 'offsetHeight', { get: () => 50 });

      act(() => {
        result.current.nodesRef.current['parent-ai'] = mockEl;
      });

      await act(async () => {
        await result.current.submitAiThreadFollowUp('parent-ai', '联网搜索 仅用这个');
      });

      expect(metasoSearch).toHaveBeenCalledWith('仅用这个', { apiKey: 'metaso-k' });
    });

    it('无秘塔 Key 时不调用检索', async () => {
      await db.nodes.add({ ...parentCard });
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      const { result } = renderHook(() =>
        useTestAiActions({
          dynamicNodes: [parentCard],
          aiConfigOverrides: { metasoApiKey: '' },
        })
      );

      await act(async () => {
        await result.current.submitAiThreadFollowUp('parent-ai', '联网搜索');
      });

      expect(metasoSearch).not.toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalled();
      alertSpy.mockRestore();
    });

    it('AI 失败时不标记 followUpSent', async () => {
      vi.mocked(callUniversalAI).mockRejectedValueOnce(new Error('network'));
      await db.nodes.add({ ...parentCard });

      const { result } = renderHook(() =>
        useTestAiActions({ dynamicNodes: [parentCard] })
      );

      const mockEl = document.createElement('div');
      Object.defineProperty(mockEl, 'offsetHeight', { get: () => 40 });

      act(() => {
        result.current.nodesRef.current['parent-ai'] = mockEl;
      });

      await act(async () => {
        await result.current.submitAiThreadFollowUp('parent-ai', '追问');
      });

      const parentRow = await db.nodes.get('parent-ai');
      expect(parentRow?.followUpSent).not.toBe(true);
    });
  });
});
