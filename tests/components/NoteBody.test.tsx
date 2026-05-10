import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { NoteBody } from '../../src/components/nodes/note/NoteBody';

const updateMock = vi.fn();

vi.mock('../../src/db', () => ({
  db: {
    nodes: {
      update: (...args: unknown[]) => updateMock(...args),
    },
  },
}));

const persistenceDisabled = vi.fn(() => true);

vi.mock('../../src/config/persistence', () => ({
  isContentBlurPersistenceDisabled: () => persistenceDisabled(),
}));

const baseNode = {
  id: 'n1',
  type: 'text' as const,
  content: '',
  x: 0,
  y: 0,
};

describe('NoteBody', () => {
  beforeEach(() => {
    updateMock.mockClear();
    persistenceDisabled.mockReturnValue(true);
  });

  it('父组件重渲染时（如 Agent 分析）不冲掉编辑区 DOM 中的文字', () => {
    const setEditing = vi.fn();

    function Harness({ flag }: { flag: number }) {
      return (
        <div>
          <span data-testid="flag">{flag}</span>
          <NoteBody
            node={{ ...baseNode, content: '' }}
            editingNodeId="n1"
            setEditingNodeId={setEditing}
            editClassName="edit"
            viewClassName="view"
            emptyNoteMarkdown="_empty_"
          />
        </div>
      );
    }

    const { container, rerender } = render(<Harness flag={0} />);
    const editable = container.querySelector('[contenteditable="true"]') as HTMLElement;
    expect(editable).toBeTruthy();
    editable.textContent = 'only in dom';

    rerender(<Harness flag={1} />);

    const editableAfter = container.querySelector('[contenteditable="true"]') as HTMLElement;
    expect(editableAfter.textContent).toBe('only in dom');
  });

  it('第二次进入编辑时仍能显示 node.content（ref 挂载时即灌入）', () => {
    const setEditing = vi.fn();

    function ToggleHarness({ editingId }: { editingId: string | null }) {
      return (
        <NoteBody
          node={{ ...baseNode, content: 'hello persistence' }}
          editingNodeId={editingId}
          setEditingNodeId={setEditing}
          editClassName="edit"
          viewClassName="view"
          emptyNoteMarkdown="_empty_"
        />
      );
    }

    const { container, rerender } = render(<ToggleHarness editingId={null} />);
    expect(container.querySelector('[contenteditable="true"]')).toBeNull();

    rerender(<ToggleHarness editingId="n1" />);
    let editable = container.querySelector('[contenteditable="true"]') as HTMLElement;
    expect(editable.textContent).toBe('hello persistence');

    rerender(<ToggleHarness editingId={null} />);
    expect(container.querySelector('[contenteditable="true"]')).toBeNull();

    rerender(<ToggleHarness editingId="n1" />);
    editable = container.querySelector('[contenteditable="true"]') as HTMLElement;
    expect(editable.textContent).toBe('hello persistence');
  });

  it('启用 blur 持久化时 onBlur 将 innerText 写入数据库', () => {
    persistenceDisabled.mockReturnValue(false);
    const setEditing = vi.fn();

    const { container } = render(
      <NoteBody
        node={{ ...baseNode, content: 'initial' }}
        editingNodeId="n1"
        setEditingNodeId={setEditing}
        editClassName="edit"
        viewClassName="view"
        emptyNoteMarkdown="_empty_"
      />
    );

    const editable = container.querySelector('[contenteditable="true"]') as HTMLDivElement;
    expect(editable.textContent).toBe('initial');

    editable.innerText = 'persisted line';
    fireEvent.blur(editable);

    expect(updateMock).toHaveBeenCalledWith('n1', { content: 'persisted line' });
    expect(setEditing).toHaveBeenCalledWith(null);
  });
});
