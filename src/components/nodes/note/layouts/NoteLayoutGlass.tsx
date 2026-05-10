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
      className="isolate relative flex h-full w-full flex-col overflow-hidden rounded-xl bg-white/40 shadow-[0_0_28px_rgba(194,65,12,0.14),inset_0_0_0_1px_rgba(194,65,12,0.08)] outline-none backdrop-blur-[12px] transition-all duration-500 [transform:translateZ(0)]"
    >
      <>
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#C2410C]/25 via-[#fdba74]/18 to-transparent opacity-85 mix-blend-overlay"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute left-0 top-0 h-24 w-24 bg-gradient-to-br from-[#ffedd5]/60 to-transparent blur-md"
          aria-hidden
        />
      </>
      <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-4 p-6">
        <header className="flex shrink-0 items-center justify-between">
          <Sparkles className="h-7 w-7 shrink-0 text-[#C2410C]" strokeWidth={1.5} aria-hidden />
          <span className="text-right font-sans text-[12px] font-semibold uppercase leading-none tracking-[0.05em] text-[#C2410C]/75">
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
