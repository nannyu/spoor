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

export type ArticleCategory = 'journal' | 'image' | 'map';

export interface Article {
  id: string;
  title: string;
  content: string;
  date: string;
  type: string;
  author?: string;
  tags?: string[];
  privateNotes?: string;
  category?: ArticleCategory;
  linkedCanvasIds?: string[];
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

/** 深度研究实验室：一次已完成研究的本地快照（独立于 articles）。 */
export interface ResearchPlanStepRecord {
  title: string;
  desc: string;
}

export interface ResearchReportRecord {
  intro: string;
  points: { title: string; text: string }[];
  conclusion: string;
}

export type ResearchSessionSearchStatus = 'idle' | 'searching' | 'found' | 'fallback';

/** Minimal webpage snapshot stored with a research session (sidebar sources). */
export interface ResearchSessionWebpageSnapshot {
  title: string;
  link: string;
  snippet: string;
}

export interface ResearchSession {
  id: string;
  query: string;
  createdAt: number;
  updatedAt: number;
  researchPlan: ResearchPlanStepRecord[];
  researchReport: ResearchReportRecord;
  sourceCount: number;
  searchStatus: ResearchSessionSearchStatus;
  /** URLs/snippets from the last Metaso search used for this run (optional on legacy rows). */
  searchWebpages?: ResearchSessionWebpageSnapshot[];
}

export class MyDatabase extends Dexie {
  nodes!: Table<CanvasNode>;
  articles!: Table<Article>;
  agents!: Table<AgentConfig>;
  edges!: Table<Edge>;
  canvases!: Table<Canvas>;
  researchSessions!: Table<ResearchSession>;

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

    this.version(3).stores({
      researchSessions: 'id, createdAt',
    });
  }
}

export const db = new MyDatabase();
