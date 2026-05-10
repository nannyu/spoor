import type { MutableRefObject } from 'react';
import { db } from '../db';

/**
 * 在画布空白处平移等操作前调用：将当前处于 App 级「编辑中」的便签/文本节点内容写入 IndexedDB，并清除 editing 态，
 * 避免 pointerdown 上 preventDefault 导致 contentEditable 未失焦、也未保存。
 */
export function commitCanvasInlineEditing(params: {
  editingNodeId: string | null;
  nodesRef: MutableRefObject<Record<string, HTMLElement | null>>;
  nodeType: string | undefined;
  setEditingNodeId: (id: string | null) => void;
}): void {
  const { editingNodeId, nodesRef, nodeType, setEditingNodeId } = params;
  if (!editingNodeId) return;

  if (nodeType === 'note' || nodeType === 'text') {
    const root = nodesRef.current[editingNodeId];
    const ce = root?.querySelector('[contenteditable="true"]') as HTMLElement | null;
    if (ce) {
      void db.nodes.update(editingNodeId, { content: ce.innerText });
    }
  } else {
    const ae = document.activeElement;
    if (ae instanceof HTMLElement && ae.isContentEditable) {
      ae.blur();
    }
  }
  setEditingNodeId(null);
}
