import React, { useCallback, useLayoutEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import { db } from '../../../db';
import type { CanvasNode } from '../../../db';
import { isContentBlurPersistenceDisabled } from '../../../config/persistence';

export interface NoteBodyProps {
  node: CanvasNode;
  editingNodeId: string | null;
  setEditingNodeId: (id: string | null) => void;
  editClassName: string;
  viewClassName: string;
  emptyNoteMarkdown: string;
  scrollAreaClassName?: string;
}

export function NoteBody({
  node,
  editingNodeId,
  setEditingNodeId,
  editClassName,
  viewClassName,
  emptyNoteMarkdown,
  scrollAreaClassName = 'flex-1 overflow-y-auto min-h-0 pr-1 custom-scrollbar',
}: NoteBodyProps) {
  const isEditing = editingNodeId === node.id;
  const editableRef = useRef<HTMLDivElement | null>(null);

  /** 在挂载 contentEditable 时立刻灌入文本；只靠 useLayoutEffect 时 ref 有时尚未挂上，会出现「再点进编辑内容为空」 */
  const setEditableRef = useCallback(
    (el: HTMLDivElement | null) => {
      editableRef.current = el;
      if (!el || !isEditing) return;
      el.textContent = node.content ?? '';
    },
    // 故意不依赖 node.content：同一次编辑中父级重渲染不得覆盖 DOM；灌入时读的是创建本 callback 那一次渲染的 node（进入编辑瞬间）
    [isEditing, node.id],
  );

  // 双保险：ref 已就绪后再写一次（与 callback 幂等）
  useLayoutEffect(() => {
    if (!isEditing) return;
    const el = editableRef.current;
    if (el) {
      el.textContent = node.content ?? '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 同上，仅在 isEditing / node.id 变化时同步；node.content 取进入该状态时的快照
  }, [isEditing, node.id]);

  return (
    <div className={scrollAreaClassName}>
      {isEditing ? (
        <div
          ref={setEditableRef}
          autoFocus
          className={editClassName}
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => {
            if (!isContentBlurPersistenceDisabled()) {
              db.nodes.update(node.id, { content: e.currentTarget.innerText });
            }
            setEditingNodeId(null);
          }}
        />
      ) : (
        <div onClick={() => setEditingNodeId(node.id)} className={`cursor-text min-h-[50px] ${viewClassName}`}>
          <Markdown>{node.content || emptyNoteMarkdown}</Markdown>
        </div>
      )}
    </div>
  );
}
