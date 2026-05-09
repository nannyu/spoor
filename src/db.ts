import Dexie, { type Table } from 'dexie';

export interface CanvasNode {
  id: string;
  canvasId?: string;
  type: string;
  content?: string;
  description?: string;
  agentConfigId?: string;
  fileType?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  layout?: number;
  /** 画布 AI 对话卡：本回合用户追问（上半区）；`content` 为 AI 回复（下半区） */
  userTurn?: string;
  /** 已从该卡成功发出过追问并生成下游 AI 卡后隐藏追问输入，保持卡片简洁 */
  followUpSent?: boolean;
}

export interface Canvas {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  date: string;
  type: string;
}

/** Markdown 知识：文件内容持久化在 IndexedDB，调用模型时整段注入 system（非 RAG）。 */
export interface AgentMarkdownKnowledgeFile {
  name: string;
  content: string;
}

export interface AgentConfig {
  id: string;
  name: string;
  role: string;
  prompt: string;
  temperature?: number;
  creativity?: number;
  color?: string;
  knowledgeMarkdownFiles?: AgentMarkdownKnowledgeFile[];
}

export interface Edge {
  id: string;
  canvasId?: string;
  from: string;
  to: string;
}

export class MyDatabase extends Dexie {
  nodes!: Table<CanvasNode>;
  articles!: Table<Article>;
  agents!: Table<AgentConfig>;
  edges!: Table<Edge>;
  canvases!: Table<Canvas>;

  constructor() {
    super('CortexLocalDB');
    this.version(1).stores({
      nodes: '++id, type, agentConfigId',
      articles: '++id, type, date',
      agents: '++id, role',
      edges: '++id, from, to'
    });

    this.version(2).stores({
      nodes: '++id, type, agentConfigId, canvasId',
      edges: '++id, from, to, canvasId',
      canvases: '++id, name, createdAt'
    });
  }
}

export const db = new MyDatabase();
