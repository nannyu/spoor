import type { AgentConfig } from '../../db';

export interface NodeContentProps {
  node: any;
  editingNodeId: string | null;
  setEditingNodeId: (id: string | null) => void;
}

export interface AgentNodeProps extends NodeContentProps {
  agentConfigs: AgentConfig[];
}
