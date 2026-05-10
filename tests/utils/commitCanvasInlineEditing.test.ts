import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRef } from 'react';
import { commitCanvasInlineEditing } from '../../src/utils/commitCanvasInlineEditing';

const updateMock = vi.fn();

vi.mock('../../src/db', () => ({
  db: {
    nodes: {
      update: (...args: unknown[]) => updateMock(...args),
    },
  },
}));

describe('commitCanvasInlineEditing', () => {
  const setEditingNodeId = vi.fn();

  beforeEach(() => {
    updateMock.mockClear();
    setEditingNodeId.mockClear();
    document.body.innerHTML = '';
  });

  it('无 editingNodeId 时不写库、不清空', () => {
    commitCanvasInlineEditing({
      editingNodeId: null,
      nodesRef: createRef<Record<string, HTMLElement | null>>(),
      nodeType: undefined,
      setEditingNodeId,
    });
    expect(updateMock).not.toHaveBeenCalled();
    expect(setEditingNodeId).not.toHaveBeenCalled();
  });

  it('note 类型：从 nodesRef 根下 contentEditable 读 innerText 并写库后清空编辑态', () => {
    const div = document.createElement('div');
    const ce = document.createElement('div');
    ce.setAttribute('contenteditable', 'true');
    ce.innerText = 'line from dom';
    div.appendChild(ce);
    document.body.appendChild(div);

    const nodesRef = createRef<Record<string, HTMLElement | null>>();
    nodesRef.current = { n1: div };

    commitCanvasInlineEditing({
      editingNodeId: 'n1',
      nodesRef: nodesRef as React.MutableRefObject<Record<string, HTMLElement | null>>,
      nodeType: 'text',
      setEditingNodeId,
    });

    expect(updateMock).toHaveBeenCalledWith('n1', { content: 'line from dom' });
    expect(setEditingNodeId).toHaveBeenCalledWith(null);
  });

  it('非便签类型：blur 活跃元素并清空编辑态', () => {
    const ce = document.createElement('div');
    ce.contentEditable = 'true';
    document.body.appendChild(ce);
    ce.focus();

    commitCanvasInlineEditing({
      editingNodeId: 'ai1',
      nodesRef: createRef<Record<string, HTMLElement | null>>(),
      nodeType: 'ai',
      setEditingNodeId,
    });

    expect(updateMock).not.toHaveBeenCalled();
    expect(document.activeElement).not.toBe(ce);
    expect(setEditingNodeId).toHaveBeenCalledWith(null);
  });
});
