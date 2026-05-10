import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import Markdown from 'react-markdown';
import { db } from '../../db';
import type { NodeContentProps } from './types';
import { isContentBlurPersistenceDisabled } from '../../config/persistence';

export function NoteNode({
  node,
  editingNodeId,
  setEditingNodeId,
}: NodeContentProps) {
  const { t } = useTranslation();
  const isGlass = node.layout === 1;

  const outerClass = isGlass
    ? 'w-full h-full transition-all duration-500 flex flex-col relative overflow-hidden rounded-xl border border-white/60 bg-white/40 backdrop-blur-[12px] shadow-[0_0_24px_rgba(21,21,125,0.15)]'
    : `w-full h-full transition-all duration-500 border-2 flex flex-col ${
        node.layout === 3 ? 'shadow-[4px_4px_0px_0px_#1b1b1c]' : 'shadow-lg'
      } ${
        node.layout === 2
          ? 'p-4 bg-[#F4F1ED] border-transparent shadow-sm'
          : node.layout === 3
            ? 'p-6 gap-4 bg-[#fcf8f9] border-[#1b1b1c]'
            : 'p-5 bg-white border-[#E6E4DF]'
      }`;

  const editTypography = isGlass
    ? 'font-sans text-[18px] font-normal leading-[1.6] text-[#464652]'
    : node.layout === 2
      ? 'text-xs font-mono leading-5 text-[#5a5a54]'
      : node.layout === 3
        ? 'font-newsreader text-[24px] font-medium leading-[1.3] tracking-[-0.02em] text-[#1b1b1c] pt-2'
        : 'text-sm font-serif leading-relaxed text-[#4a4a44]';

  const viewTypography = isGlass
    ? 'markdown-body font-sans text-[18px] font-normal leading-[1.6] text-[#464652]'
    : node.layout === 2
      ? 'markdown-body text-xs font-mono leading-5 text-[#5a5a54]'
      : node.layout === 3
        ? 'markdown-body font-newsreader text-[24px] font-medium leading-[1.3] tracking-[-0.02em] text-[#1b1b1c] pt-2'
        : 'markdown-body text-sm font-serif leading-relaxed text-[#4a4a44]';

  return (
    <div className={outerClass} style={{ outline: '1px solid transparent' }}>
      {isGlass && (
        <>
          <div
            className="pointer-events-none absolute inset-0 rounded-xl border border-transparent shadow-[inset_1px_1px_0_rgba(255,255,255,0.8)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-[#c0c1ff]/40 via-[#c6eccd]/20 to-transparent opacity-80 mix-blend-overlay"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute left-0 top-0 h-24 w-24 rounded-xl bg-gradient-to-br from-[#e1e0ff]/50 to-transparent blur-md"
            aria-hidden
          />
        </>
      )}

      {isGlass ? (
        <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-4 p-6">
          <header className="flex shrink-0 items-center justify-between">
            <Sparkles className="h-7 w-7 shrink-0 text-[#15157d]" strokeWidth={1.5} aria-hidden />
            <span className="text-right font-sans text-[12px] font-semibold uppercase leading-none tracking-[0.05em] text-[#15157d]/70">
              {t('nodes.thought_node')}
            </span>
          </header>
          <div className="note-glass-markdown mt-2 min-h-0 flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {editingNodeId === node.id ? (
              <div
                autoFocus
                className={`focus:outline-none rounded px-1 -mx-1 transition-all cursor-text min-h-[50px] select-text empty:before:content-['${t('nodes.type_something')}'] empty:before:text-gray-300/80 ${editTypography}`}
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
              <div onClick={() => setEditingNodeId(node.id)} className={`cursor-text min-h-[50px] ${viewTypography}`}>
                <Markdown>{node.content || `_${t('nodes.empty_note')}_`}</Markdown>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className={`flex items-center space-x-2 ${node.layout === 3 ? '' : 'mb-2'}`}>
            <span
              className={`font-sans uppercase tracking-wider ${
                node.layout === 3
                  ? 'bg-[#1b1b1c] text-white px-2 py-1 text-[12px] font-semibold leading-none'
                  : 'text-[10px] font-bold text-[#8c8a84]'
              }`}
            >
              {node.type === 'note' ? t('nodes.observation') : t('nodes.note')}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 pr-1 custom-scrollbar">
            {editingNodeId === node.id ? (
              <div
                autoFocus
                className={`focus:outline-none rounded px-1 -mx-1 transition-all cursor-text min-h-[50px] select-text empty:before:content-['${t('nodes.type_something')}'] empty:before:text-gray-300 ${editTypography}`}
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
              <div onClick={() => setEditingNodeId(node.id)} className={`cursor-text min-h-[50px] ${viewTypography}`}>
                <Markdown>{node.content || `_${t('nodes.empty_note')}_`}</Markdown>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
