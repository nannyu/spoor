import { useRef, useState, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import type { AgentConfig, CanvasNode, Edge as DbEdge } from '../db';
import type { AIConfig } from '../components/AISettingsModal';
import type { CanvasTransform } from './useCanvasInteraction';
import { callUniversalAI, formatAiError, maskApiKeyForLog } from '../services/ai';
import { getCanvasCenterPosition } from '../utils/canvas';
import { combineSystemParts, getLocaleDirective, resolveAgentSystemPrompt } from '../utils/aiI18n';
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
  const { t } = useTranslation();
  const [isPublishing, setIsPublishing] = useState(false);
  const [isToolbarAiLoading, setIsToolbarAiLoading] = useState(false);
  const [analyzingAgentNodeId, setAnalyzingAgentNodeId] = useState<string | null>(null);
  const [followUpParentId, setFollowUpParentId] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const followUpGuardRef = useRef(false);

  const THREAD_GAP = 24;

  const isAnyAiBusy =
    isPublishing ||
    isToolbarAiLoading ||
    analyzingAgentNodeId !== null ||
    followUpParentId !== null;

  const handlePublish = async () => {
    if (selectedNodes.size === 0 || isAnyAiBusy) return;
    setIsPublishing(true);
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
        systemInstruction: getLocaleDirective(),
        prompt: t('ai.prompts.publish', { content: combinedText }),
      });

      const newArticle = {
        id: `gen-${Date.now()}`,
        title: t('ai.generated_article_title'),
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
      setIsPublishing(false);
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

    setAnalyzingAgentNodeId(agentNodeId);
    try {
      const text = await callUniversalAI({
        config: aiConfig,
        prompt: t('ai.prompts.agentContext', { content: contextText }),
        systemInstruction: combineSystemParts(
          getLocaleDirective(),
          resolveAgentSystemPrompt(agentConfig),
        ),
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
      setAnalyzingAgentNodeId(null);
    }
  };

  const handleAiSubmit = async () => {
    if (!aiPrompt.trim() || isAnyAiBusy) return;

    setIsToolbarAiLoading(true);
    try {
      const connectedNodeIds = new Set<string>();
      edges.forEach(e => {
        connectedNodeIds.add(e.from);
        connectedNodeIds.add(e.to);
      });

      let contextText = '';
      const fragmentLabel = t('ai.prompts.context_fragment_label');
      connectedNodeIds.forEach(id => {
        const el = nodesRef.current[id];
        if (el) {
          contextText += fragmentLabel + (el.innerText || '');
        }
      });

      const text = await callUniversalAI({
        config: aiConfig,
        systemInstruction: getLocaleDirective(),
        prompt: t('ai.prompts.toolbar', { context: contextText, request: aiPrompt }),
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
      setIsToolbarAiLoading(false);
    }
  };

  const submitAiThreadFollowUp = async (parentNodeId: string, userMessage: string) => {
    const trimmed = userMessage.trim();
    if (!trimmed || followUpGuardRef.current) return;
    if (isPublishing || isToolbarAiLoading || analyzingAgentNodeId !== null || followUpParentId !== null) return;

    const parent = dynamicNodes.find((n) => n.id === parentNodeId);
    if (!parent || parent.type !== 'ai') return;

    followUpGuardRef.current = true;
    setFollowUpParentId(parentNodeId);
    try {
      const previous = (parent.content ?? '').trim();
      const text = await callUniversalAI({
        config: aiConfig,
        systemInstruction: getLocaleDirective(),
        prompt: t('ai.prompts.threadFollowUp', {
          previous: previous || '—',
          request: trimmed,
        }),
      });

      if (text) {
        const el = nodesRef.current[parentNodeId];
        const h = el?.offsetHeight ?? 200;
        const w = parent.width && parent.width > 0 ? parent.width : el?.offsetWidth ?? 320;
        const newNodeId = crypto.randomUUID();
        await db.nodes.add({
          id: newNodeId,
          canvasId: activeCanvasId,
          type: 'ai',
          userTurn: trimmed,
          content: text,
          x: parent.x,
          y: parent.y + h + THREAD_GAP,
          width: w,
        });
        await db.edges.add({
          id: crypto.randomUUID(),
          canvasId: activeCanvasId,
          from: parentNodeId,
          to: newNodeId,
        });
        await db.nodes.update(parentNodeId, { followUpSent: true });
      }
    } catch (e) {
      const msg = formatAiError(e);
      console.error('[Scribe AI] submitAiThreadFollowUp failed', {
        error: msg,
        provider: aiConfig.provider,
        model: aiConfig.model,
        apiKey: maskApiKeyForLog(aiConfig.apiKey),
      });
      alert(`AI 生成失败\n\n${msg}\n\n打开开发者工具 (F12) → Console 查看 [Scribe AI] 详细日志。`);
    } finally {
      followUpGuardRef.current = false;
      setFollowUpParentId(null);
    }
  };

  return {
    isPublishing,
    isToolbarAiLoading,
    analyzingAgentNodeId,
    followUpParentId,
    isAnyAiBusy,
    aiPrompt,
    setAiPrompt,
    handlePublish,
    triggerAgentAnalysis,
    handleAiSubmit,
    submitAiThreadFollowUp,
  };
}
