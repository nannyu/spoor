import React from 'react';
import type { AgentConfig, CanvasNode } from '../../db';
import { ThemeNode } from './ThemeNode';
import { NoteNode } from './NoteNode';
import { AiNode } from './AiNode';
import { ImageNode } from './ImageNode';
import { VideoNode } from './VideoNode';
import { AgentNode } from './AgentNode';

interface NodeRendererProps {
  node: CanvasNode;
  editingNodeId: string | null;
  setEditingNodeId: (id: string | null) => void;
  agentConfigs: AgentConfig[];
}

export function NodeRenderer({ node, editingNodeId, setEditingNodeId, agentConfigs }: NodeRendererProps) {
  switch (node.type) {
    case 'theme':
      return <ThemeNode node={node} editingNodeId={editingNodeId} setEditingNodeId={setEditingNodeId} />;
    case 'note':
    case 'text':
      return <NoteNode node={node} editingNodeId={editingNodeId} setEditingNodeId={setEditingNodeId} />;
    case 'ai':
      return <AiNode node={node} editingNodeId={editingNodeId} setEditingNodeId={setEditingNodeId} />;
    case 'image':
      return <ImageNode node={node} editingNodeId={editingNodeId} setEditingNodeId={setEditingNodeId} />;
    case 'video':
      return <VideoNode node={node} editingNodeId={editingNodeId} setEditingNodeId={setEditingNodeId} />;
    case 'agent':
      return <AgentNode node={node} editingNodeId={editingNodeId} setEditingNodeId={setEditingNodeId} agentConfigs={agentConfigs} />;
    default:
      return null;
  }
}
