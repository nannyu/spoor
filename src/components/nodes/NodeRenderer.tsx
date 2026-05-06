import React from 'react';
import type { AgentConfig, CanvasNode } from '../../db';
import { ThemeNode } from './ThemeNode';
import { NoteNode } from './NoteNode';
import { AiNode } from './AiNode';
import { ImageNode } from './ImageNode';
import { VideoNode } from './VideoNode';
import { DocumentNode } from './DocumentNode';
import { AgentNode } from './AgentNode';

interface NodeRendererProps {
  node: CanvasNode;
  editingNodeId: string | null;
  setEditingNodeId: (id: string | null) => void;
  agentConfigs: AgentConfig[];
  analyzingAgentNodeId: string | null;
  onAiFollowUp?: (nodeId: string, message: string) => void;
  followUpLoadingNodeId?: string | null;
  isFollowUpGloballyDisabled?: boolean;
}

export function NodeRenderer({
  node,
  editingNodeId,
  setEditingNodeId,
  agentConfigs,
  analyzingAgentNodeId,
  onAiFollowUp,
  followUpLoadingNodeId,
  isFollowUpGloballyDisabled,
}: NodeRendererProps) {
  switch (node.type) {
    case 'theme':
      return <ThemeNode node={node} editingNodeId={editingNodeId} setEditingNodeId={setEditingNodeId} />;
    case 'note':
    case 'text':
      return <NoteNode node={node} editingNodeId={editingNodeId} setEditingNodeId={setEditingNodeId} />;
    case 'ai':
      return (
        <AiNode
          node={node}
          editingNodeId={editingNodeId}
          setEditingNodeId={setEditingNodeId}
          onSubmitFollowUp={onAiFollowUp ? (msg) => onAiFollowUp(node.id, msg) : undefined}
          isFollowUpLoading={followUpLoadingNodeId === node.id}
          isFollowUpDisabled={isFollowUpGloballyDisabled}
        />
      );
    case 'image':
      return <ImageNode node={node} editingNodeId={editingNodeId} setEditingNodeId={setEditingNodeId} />;
    case 'video':
      return <VideoNode node={node} editingNodeId={editingNodeId} setEditingNodeId={setEditingNodeId} />;
    case 'document':
      return <DocumentNode node={node} editingNodeId={editingNodeId} setEditingNodeId={setEditingNodeId} />;
    case 'agent':
      return <AgentNode node={node} editingNodeId={editingNodeId} setEditingNodeId={setEditingNodeId} agentConfigs={agentConfigs} isAnalyzing={analyzingAgentNodeId === node.id} />;
    default:
      return null;
  }
}
