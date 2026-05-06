import type { AgentConfig, CanvasNode } from '../../db';

export interface NodeContentProps {
  node: CanvasNode;
  editingNodeId: string | null;
  setEditingNodeId: (id: string | null) => void;
}

export interface AgentNodeProps extends NodeContentProps {
  agentConfigs: AgentConfig[];
  isAnalyzing?: boolean;
}

export interface AiNodeProps extends NodeContentProps {
  onSubmitFollowUp?: (message: string) => void;
  isFollowUpLoading?: boolean;
  isFollowUpDisabled?: boolean;
}
