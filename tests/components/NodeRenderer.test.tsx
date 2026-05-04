import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { NodeRenderer } from '../../src/components/nodes/NodeRenderer';
import type { CanvasNode, AgentConfig } from '../../src/db';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'zh', changeLanguage: vi.fn() },
  }),
}));

vi.mock('lucide-react', () => {
  const iconNames = [
    'MessageSquare', 'Terminal', 'Network', 'Search', 'Bell', 'Settings', 'Plus',
    'BookOpen', 'Users', 'Library', 'Microscope', 'Sparkles', 'Maximize2', 'Minimize2',
    'Quote', 'Brain', 'Bot', 'Wand2', 'Send', 'SlidersHorizontal', 'History', 'ZoomIn',
    'Focus', 'Image', 'FilePlus', 'Trash2', 'Link2', 'X', 'Camera', 'ChevronLeft',
    'ChevronRight', 'Check', 'Cpu', 'ArrowRight', 'ListChecks', 'CheckCircle2',
    'Loader2', 'PenLine', 'Edit3', 'FileText',
  ];
  const icons: Record<string, React.FC> = {};
  for (const name of iconNames) {
    icons[name] = (props: Record<string, unknown>) => {
      const { createElement } = require('react');
      return createElement('svg', { 'data-testid': `icon-${name}`, ...props });
    };
  }
  return icons;
});

vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => {
    const { createElement } = require('react');
    return createElement('div', { 'data-testid': 'markdown' }, children);
  },
}));

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: () => undefined,
}));

const mockAgentConfigs: AgentConfig[] = [
  { id: 'a1', name: 'Test Agent', role: 'Tester', prompt: 'Test prompt', temperature: 0.7, creativity: 0.5 },
];

const makeNode = (type: string, overrides?: Partial<CanvasNode>): CanvasNode => ({
  id: 'node-1',
  canvasId: 'default',
  type,
  content: 'Test content',
  x: 100,
  y: 100,
  ...overrides,
});

describe('NodeRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('type="theme" 渲染 ThemeNode', () => {
    const { getByText } = render(
      <NodeRenderer
        node={makeNode('theme')}
        editingNodeId={null}
        setEditingNodeId={vi.fn()}
        agentConfigs={mockAgentConfigs}
        analyzingAgentNodeId={null}
      />
    );
    expect(getByText('Test content')).toBeInTheDocument();
  });

  it('type="note" 渲染 NoteNode', () => {
    const { getByText } = render(
      <NodeRenderer
        node={makeNode('note')}
        editingNodeId={null}
        setEditingNodeId={vi.fn()}
        agentConfigs={mockAgentConfigs}
        analyzingAgentNodeId={null}
      />
    );
    expect(getByText('Test content')).toBeInTheDocument();
  });

  it('type="text" 渲染 NoteNode', () => {
    const { getByText } = render(
      <NodeRenderer
        node={makeNode('text')}
        editingNodeId={null}
        setEditingNodeId={vi.fn()}
        agentConfigs={mockAgentConfigs}
        analyzingAgentNodeId={null}
      />
    );
    expect(getByText('Test content')).toBeInTheDocument();
  });

  it('type="ai" 渲染 AiNode', () => {
    const { getByTestId } = render(
      <NodeRenderer
        node={makeNode('ai')}
        editingNodeId={null}
        setEditingNodeId={vi.fn()}
        agentConfigs={mockAgentConfigs}
        analyzingAgentNodeId={null}
      />
    );
    expect(getByTestId('markdown')).toBeInTheDocument();
  });

  it('type="image" 渲染 ImageNode', () => {
    const { container } = render(
      <NodeRenderer
        node={makeNode('image', { content: 'https://example.com/img.png' })}
        editingNodeId={null}
        setEditingNodeId={vi.fn()}
        agentConfigs={mockAgentConfigs}
        analyzingAgentNodeId={null}
      />
    );
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img?.src).toContain('img.png');
  });

  it('type="video" 渲染 VideoNode', () => {
    const { container } = render(
      <NodeRenderer
        node={makeNode('video', { content: 'https://example.com/vid.mp4' })}
        editingNodeId={null}
        setEditingNodeId={vi.fn()}
        agentConfigs={mockAgentConfigs}
        analyzingAgentNodeId={null}
      />
    );
    const video = container.querySelector('video');
    expect(video).toBeInTheDocument();
  });

  it('type="agent" 渲染 AgentNode', () => {
    const { getByText, queryByTestId } = render(
      <NodeRenderer
        node={makeNode('agent', { agentConfigId: 'a1' })}
        editingNodeId={null}
        setEditingNodeId={vi.fn()}
        agentConfigs={mockAgentConfigs}
        analyzingAgentNodeId={null}
      />
    );
    expect(getByText('Test Agent')).toBeInTheDocument();
    expect(queryByTestId('agent-analyzing-overlay')).not.toBeInTheDocument();
  });

  it('type="agent" 且 analyzingAgentNodeId 匹配时显示分析遮罩', () => {
    const { getByTestId } = render(
      <NodeRenderer
        node={makeNode('agent', { id: 'agent-1', agentConfigId: 'a1' })}
        editingNodeId={null}
        setEditingNodeId={vi.fn()}
        agentConfigs={mockAgentConfigs}
        analyzingAgentNodeId="agent-1"
      />
    );
    expect(getByTestId('agent-analyzing-overlay')).toBeInTheDocument();
  });

  it('未知 type 返回 null', () => {
    const { container } = render(
      <NodeRenderer
        node={makeNode('unknown_type')}
        editingNodeId={null}
        setEditingNodeId={vi.fn()}
        agentConfigs={mockAgentConfigs}
        analyzingAgentNodeId={null}
      />
    );
    // 容器内不应有内容
    expect(container.innerHTML).toBe('');
  });
});
