import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSeedData } from '../../src/hooks/useSeedData';
import { db } from '../../src/db';

describe('useSeedData', () => {
  beforeEach(async () => {
    await db.nodes.clear();
    await db.articles.clear();
    await db.agents.clear();
    await db.edges.clear();
    await db.canvases.clear();
  });

  it('首次运行创建默认画布', async () => {
    renderHook(() => useSeedData());
    // 等待 useEffect 异步操作完成
    await new Promise(r => setTimeout(r, 300));

    const canvas = await db.canvases.get('default');
    expect(canvas).toBeDefined();
    expect(canvas?.name).toBe('Main Workspace');
  });

  it('首次运行创建系统 agents', async () => {
    renderHook(() => useSeedData());
    await new Promise(r => setTimeout(r, 300));

    const agents = await db.agents.toArray();
    const roles = agents.map(a => a.role);
    expect(roles).toContain('Debater');
    expect(roles).toContain('Journalist');
    expect(roles).toContain('Connector');
    expect(roles).toContain('Editor');
    expect(roles).toContain('Visionary');
    expect(roles).toContain('Realist');
  });

  it('首次运行创建示例节点和边', async () => {
    renderHook(() => useSeedData());
    await new Promise(r => setTimeout(r, 300));

    const nodes = await db.nodes.toArray();
    expect(nodes.length).toBeGreaterThanOrEqual(3);
    expect(nodes.some(n => n.type === 'theme')).toBe(true);

    const edges = await db.edges.toArray();
    expect(edges.length).toBeGreaterThanOrEqual(3);
  });

  it('已存在数据时不重复创建', async () => {
    // 预先插入默认画布和 agents，模拟已完成种子初始化的状态
    await db.canvases.add({
      id: 'default',
      name: 'Main Workspace',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    await db.agents.bulkPut([
      { id: 'challenger', name: 'The Challenger', role: 'Debater', prompt: '', temperature: 0.7, creativity: 0.4 },
      { id: 'interviewer', name: 'AI Interviewer', role: 'Journalist', prompt: '', temperature: 0.7, creativity: 0.4 },
      { id: 'synthesizer', name: 'The Synthesizer', role: 'Connector', prompt: '', temperature: 0.8, creativity: 0.7 },
      { id: 'stylist', name: 'The Stylist', role: 'Editor', prompt: '', temperature: 0.6, creativity: 0.5 },
      { id: 'futurist', name: 'The Futurist', role: 'Visionary', prompt: '', temperature: 0.9, creativity: 0.9 },
      { id: 'pragmatist', name: 'The Pragmatist', role: 'Realist', prompt: '', temperature: 0.4, creativity: 0.2 },
    ]);

    renderHook(() => useSeedData());
    await new Promise(r => setTimeout(r, 300));

    const canvases = await db.canvases.toArray();
    expect(canvases.length).toBe(1);

    // agents 已存在不会重复插入，但 nodes 和 articles 仍会创建（因为 nodeCount=0）
    const agents = await db.agents.toArray();
    expect(agents.length).toBe(6);

    // 因为 nodeCount=0 且 totalCount<=6，种子逻辑仍会创建 nodes 和 articles
    const nodes = await db.nodes.toArray();
    expect(nodes.length).toBeGreaterThanOrEqual(3);
  });
});
