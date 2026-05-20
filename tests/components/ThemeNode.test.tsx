import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ThemeNode } from '../../src/components/nodes/ThemeNode';
import { db } from '../../src/db';
import type { CanvasNode } from '../../src/db';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'zh', changeLanguage: vi.fn() },
  }),
}));

vi.mock('../../src/db', () => ({
  db: {
    nodes: { update: vi.fn() },
  },
}));

const persistenceDisabled = vi.fn(() => false);

vi.mock('../../src/config/persistence', () => ({
  isContentBlurPersistenceDisabled: () => persistenceDisabled(),
}));

vi.mock('lucide-react', () => ({
  Sparkles: (props: Record<string, unknown>) => {
    const { createElement } = require('react');
    return createElement('svg', { 'data-testid': 'icon-Sparkles', ...props });
  },
}));

const makeNode = (overrides?: Partial<CanvasNode>): CanvasNode => ({
  id: 'n1',
  canvasId: 'c1',
  type: 'theme',
  content: 'Theme title',
  x: 0,
  y: 0,
  ...overrides,
});

describe('ThemeNode blur 持久化', () => {
  beforeEach(() => {
    vi.mocked(db.nodes.update).mockClear();
    persistenceDisabled.mockReturnValue(false);
  });

  it('正文失焦时持久化 description', () => {
    render(<ThemeNode node={makeNode()} editingNodeId={null} setEditingNodeId={vi.fn()} />);
    const body = screen.getByText('Central research objective for the current workspace.');
    body.innerText = '自定义正文说明';
    fireEvent.blur(body);
    expect(db.nodes.update).toHaveBeenCalledWith('n1', { description: '自定义正文说明' });
  });

  it('正文输入时防抖写库（无需等失焦即可在刷新前落盘）', () => {
    vi.useFakeTimers();
    render(<ThemeNode node={makeNode()} editingNodeId={null} setEditingNodeId={vi.fn()} />);
    const body = screen.getByText('Central research objective for the current workspace.');
    body.innerText = '防抖保存的正文';
    fireEvent.input(body);
    expect(db.nodes.update).not.toHaveBeenCalled();
    vi.advanceTimersByTime(400);
    expect(db.nodes.update).toHaveBeenCalledWith('n1', { description: '防抖保存的正文' });
    vi.useRealTimers();
  });

  it('标题失焦时持久化 content', () => {
    render(<ThemeNode node={makeNode()} editingNodeId={null} setEditingNodeId={vi.fn()} />);
    const title = screen.getByRole('heading', { level: 3 });
    title.innerText = '新标题';
    fireEvent.blur(title);
    expect(db.nodes.update).toHaveBeenCalledWith('n1', { content: '新标题' });
  });

  it('页脚失焦时持久化 themeTag（空白折叠为 trim）', () => {
    render(<ThemeNode node={makeNode()} editingNodeId={null} setEditingNodeId={vi.fn()} />);
    const footer = screen.getByText('Spatial Encoding');
    footer.innerText = '  不知为何  ';
    fireEvent.blur(footer);
    expect(db.nodes.update).toHaveBeenCalledWith('n1', { themeTag: '不知为何' });
  });

  it('已保存的 description 从 node 渲染，不显示默认占位文案', () => {
    render(
      <ThemeNode
        node={makeNode({ description: '已持久化的研究目标说明' })}
        editingNodeId={null}
        setEditingNodeId={vi.fn()}
      />
    );
    expect(screen.getByText('已持久化的研究目标说明')).toBeInTheDocument();
    expect(
      screen.queryByText('Central research objective for the current workspace.')
    ).toBeNull();
  });

  it('禁用 blur 持久化时三个可编辑区失焦均不写库', () => {
    persistenceDisabled.mockReturnValue(true);
    const { container } = render(
      <ThemeNode node={makeNode({ themeTag: '页脚' })} editingNodeId={null} setEditingNodeId={vi.fn()} />
    );
    const editables = container.querySelectorAll('[contenteditable="true"]');
    expect(editables).toHaveLength(3);

    for (const el of editables) {
      (el as HTMLElement).innerText = '不应写入';
      fireEvent.blur(el);
    }
    expect(db.nodes.update).not.toHaveBeenCalled();
  });

  it('三个 contentEditable 区域均存在（结构防回归）', () => {
    const { container } = render(
      <ThemeNode node={makeNode()} editingNodeId={null} setEditingNodeId={vi.fn()} />
    );
    expect(container.querySelectorAll('[contenteditable="true"]')).toHaveLength(3);
  });
});
