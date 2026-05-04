import { useState, type RefObject } from 'react';
import type { AgentConfig, CanvasNode, Edge as DbEdge } from '../db';
import type { AIConfig } from '../components/AISettingsModal';
import type { CanvasTransform } from './useCanvasInteraction';
import { callUniversalAI, formatAiError, maskApiKeyForLog } from '../services/ai';
import { getCanvasCenterPosition } from '../utils/canvas';
import { db } from '../db';

interface UseAiActionsParams {
  aiConfig: AIConfig;
  agentConfigs: AgentConfig[];
  activeCanvasId: string;
  nodesRef: RefObject<Record<string, HTMLElement | null>>;
  transformRef: RefObject<CanvasTransform>;
  dynamicNodes: CanvasNode[];
  edges: DbEdge[];
  selectedNodes: Set<string>;
  setSelectedNodes: React.Dispatch<React.SetStateAction<Set<string>>>;
  setActiveReferenceId: (id: string) => void;
  setActiveTab: (tab: string) => void;
}

export function useAiActions({
  aiConfig,
  agentConfigs,
  activeCanvasId,
  nodesRef,
  transformRef,
  dynamicNodes,
  edges,
  selectedNodes,
  setSelectedNodes,
  setActiveReferenceId,
  setActiveTab,
}: UseAiActionsParams) {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  const handlePublish = async () => {
    if (selectedNodes.size === 0) return;
    setIsAiLoading(true);
    try {
      let combinedText = '';
      for (const id of Array.from(selectedNodes)) {
        const el = nodesRef.current[id];
        if (el) {
          combinedText += el.innerText + '\n\n';
        }
      }

      const text = await callUniversalAI({
        config: aiConfig,
        prompt: `Turn the following concepts, notes, and drafts into a cohesive, well-written article:\n\n${combinedText}`
      });

      const newArticle = {
        id: `gen-${Date.now()}`,
        title: 'Generated Synthesis',
        content: text || '',
        date: new Date().getFullYear().toString(),
        type: 'GEN-' + Math.floor(Math.random() * 1000)
      };

      await db.articles.add(newArticle);
      setActiveReferenceId(newArticle.id);
      setActiveTab('reference');
      setSelectedNodes(new Set());
    } catch (e) {
      const msg = formatAiError(e);
      console.error('[Scribe AI] handlePublish failed', { error: msg, provider: aiConfig.provider, model: aiConfig.model, apiKey: maskApiKeyForLog(aiConfig.apiKey) });
      alert(`合成失败\n\n${msg}\n\n打开开发者工具 (F12) → Console 查看 [Scribe AI] 日志。`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const triggerAgentAnalysis = async (agentConfigId: string, agentNodeId: string, contextNodeId: string) => {
    const agentConfig = agentConfigs.find(a => a.id === agentConfigId);
    if (!agentConfig) return;

    const contextEl = nodesRef.current[contextNodeId];
    if (!contextEl) return;

    const clone = contextEl.cloneNode(true) as HTMLElement;
    const contextText = clone.innerText || clone.textContent || '';
    if (!contextText.trim()) return;

    setIsAiLoading(true);
    try {
      const text = await callUniversalAI({
        config: aiConfig,
        prompt: `Context to analyze:\n${contextText}`,
        systemInstruction: agentConfig.prompt
      });

      if (text) {
        const agentNode = dynamicNodes.find(n => n.id === agentNodeId);
        const x = agentNode ? agentNode.x + 350 : window.innerWidth / 2;
        const y = agentNode ? agentNode.y : window.innerHeight / 2;
        const newNodeId = crypto.randomUUID();

        await db.nodes.add({ id: newNodeId, canvasId: activeCanvasId, type: 'ai', content: text, x, y });
        await db.edges.add({ id: crypto.randomUUID(), canvasId: activeCanvasId, from: agentNodeId, to: newNodeId });
      }
    } catch (e) {
      const msg = formatAiError(e);
      console.error('[Scribe AI] triggerAgentAnalysis failed', { error: msg, provider: aiConfig.provider, model: aiConfig.model, apiKey: maskApiKeyForLog(aiConfig.apiKey) });
      alert(`AI 生成失败\n\n${msg}\n\n打开开发者工具 (F12) → Console 查看 [Scribe AI] 详细日志。`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAiSubmit = async () => {
    if (!aiPrompt.trim() || isAiLoading) return;

    setIsAiLoading(true);
    try {
      const connectedNodeIds = new Set<string>();
      edges.forEach(e => {
        connectedNodeIds.add(e.from);
        connectedNodeIds.add(e.to);
      });

      let contextText = '';
      connectedNodeIds.forEach(id => {
        const el = nodesRef.current[id];
        if (el) {
          contextText += `\n[Context Fragment]: ` + (el.innerText || '');
        }
      });

      const text = await callUniversalAI({
        config: aiConfig,
        prompt: `Context from connected notes across the canvas:\n${contextText}\n\nUser request: ${aiPrompt}`
      });

      if (text) {
        const { x, y } = getCanvasCenterPosition(transformRef.current);
        await db.nodes.add({ id: crypto.randomUUID(), canvasId: activeCanvasId, type: 'ai', content: text, x, y });
        setAiPrompt('');
      }
    } catch (error) {
      const msg = formatAiError(error);
      console.error('[Scribe AI] handleAiSubmit failed', { error: msg, provider: aiConfig.provider, model: aiConfig.model, apiKey: maskApiKeyForLog(aiConfig.apiKey) });
      alert(`AI 生成失败\n\n${msg}\n\n请检查：1) 设置中 Provider / MiMo Key / Base URL（需含 /v1） 2) 若用浏览器，需 npm run dev 且已重启（/api/mimo 代理）；桌面端用 Tauri 可不依赖代理。\n\nF12 → Console 查看 [Scribe AI] 日志。`);
    } finally {
      setIsAiLoading(false);
    }
  };

  return { isAiLoading, setIsAiLoading, aiPrompt, setAiPrompt, handlePublish, triggerAgentAnalysis, handleAiSubmit };
}
