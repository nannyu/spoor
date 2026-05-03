import Dexie, { type Table } from 'dexie';

export interface CanvasNode {
  id: string;
  canvasId?: string;
  type: string;
  content?: string;
  agentConfigId?: string;
  fileType?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  layout?: number;
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

export interface AgentConfig {
  id: string;
  name: string;
  role: string;
  prompt: string;
  temperature?: number;
  creativity?: number;
  color?: string;
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
