import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import type { NodeContentProps } from '../../types';
import { NoteBody } from '../NoteBody';

export function NoteLayoutGlass({ node, editingNodeId, setEditingNodeId }: NodeContentProps) {
  const { t } = useTranslation();

  const editTypography =
    'font-sans text-[18px] font-normal leading-[1.6] text-[#464652]';
  const viewTypography =
    'markdown-body font-sans text-[18px] font-normal leading-[1.6] text-[#464652]';
  const editClassName = `focus:outline-none rounded px-1 -mx-1 transition-all cursor-text min-h-[50px] select-text empty:before:content-['${t('nodes.type_something')}'] empty:before:text-gray-300/80 ${editTypography}`;

  return (
    <div
      className="w-full h-full transition-all duration-500 flex flex-col relative overflow-hidden rounded-xl border border-white/60 bg-white/40 backdrop-blur-[12px] shadow-[0_0_24px_rgba(21,21,125,0.15)]"
      style={{ outline: '1px solid transparent' }}
    >
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
      <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-4 p-6">
        <header className="flex shrink-0 items-center justify-between">
          <Sparkles className="h-7 w-7 shrink-0 text-[#15157d]" strokeWidth={1.5} aria-hidden />
          <span className="text-right font-sans text-[12px] font-semibold uppercase leading-none tracking-[0.05em] text-[#15157d]/70">
            {t('nodes.thought_node')}
          </span>
        </header>
        <NoteBody
          node={node}
          editingNodeId={editingNodeId}
          setEditingNodeId={setEditingNodeId}
          editClassName={editClassName}
          viewClassName={viewTypography}
          emptyNoteMarkdown={`_${t('nodes.empty_note')}_`}
          scrollAreaClassName="note-glass-markdown mt-2 min-h-0 flex-1 overflow-y-auto pr-1 custom-scrollbar"
        />
      </div>
    </div>
  );
}
