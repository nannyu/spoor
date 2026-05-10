import React from 'react';
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

  return (
    <div className={scrollAreaClassName}>
      {isEditing ? (
        <div
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
        >
          {node.content}
        </div>
      ) : (
        <div onClick={() => setEditingNodeId(node.id)} className={`cursor-text min-h-[50px] ${viewClassName}`}>
          <Markdown>{node.content || emptyNoteMarkdown}</Markdown>
        </div>
      )}
    </div>
  );
}
