import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bot, Loader2, Send } from 'lucide-react';
import Markdown from 'react-markdown';
import { db } from '../../db';
import type { AiNodeProps } from './types';
import { isContentBlurPersistenceDisabled } from '../../config/persistence';

export function AiNode({
  node,
  editingNodeId,
  setEditingNodeId,
  onSubmitFollowUp,
  isFollowUpLoading,
  isFollowUpDisabled,
}: AiNodeProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState('');

  const showFollowUp = onSubmitFollowUp && !node.followUpSent;

  const handleSubmit = () => {
    const msg = draft.trim();
    if (!msg || !onSubmitFollowUp || isFollowUpDisabled) return;
    onSubmitFollowUp(msg);
    setDraft('');
  };

  const renderAiBody = () =>
    editingNodeId === node.id ? (
      <div
        autoFocus
        className="whitespace-pre-wrap text-sm text-[#4a4a44] font-serif leading-relaxed focus:outline-none bg-[#EAE7E2]/50 rounded px-1 -mx-1 transition-colors cursor-text min-h-[40px]"
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
      <div
        onClick={() => setEditingNodeId(node.id)}
        className="markdown-body text-sm text-[#4a4a44] font-serif leading-relaxed cursor-text min-h-[40px]"
      >
        <Markdown>{node.content}</Markdown>
      </div>
    );

  return (
    <div className="w-full h-full bg-[#F4F1ED] p-6 shadow-lg border border-[#E6E4DF] flex flex-col">
      {node.userTurn ? (
        <>
          <div className="mb-3 shrink-0">
            <div className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#8c8a84] mb-1.5">
              {t('nodes.ai_your_follow_up')}
            </div>
            <div className="text-sm text-[#1a1a1a] font-serif leading-relaxed border-l-2 border-[#C2410C]/35 pl-3 py-0.5 bg-white/50 rounded-r">
              {node.userTurn}
            </div>
          </div>
          <div className="flex justify-between items-start mb-2 shrink-0 sticky top-0 bg-[#F4F1ED] z-[1] py-1">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-[#C2410C] rounded-full flex items-center justify-center text-white text-[10px]">
                <Bot className="w-3 h-3" />
              </div>
              <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#1a1a1a]">
                {t('nodes.ai_refinement')}
              </span>
            </div>
          </div>
          <div className="min-h-0 max-h-[min(14rem,38vh)] overflow-y-auto pr-1 scrollbar-hide">
            {renderAiBody()}
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-between items-start mb-3 shrink-0 sticky top-0 bg-[#F4F1ED] z-[1]">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-[#C2410C] rounded-full flex items-center justify-center text-white text-[10px]">
                <Bot className="w-3 h-3" />
              </div>
              <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#1a1a1a]">
                {t('nodes.ai_refinement')}
              </span>
            </div>
          </div>
          <div className="min-h-0 max-h-[min(14rem,38vh)] overflow-y-auto pr-1 scrollbar-hide">
            {renderAiBody()}
          </div>
        </>
      )}

      {showFollowUp ? (
        <div className="mt-3 pt-3 border-t border-[#E6E4DF] shrink-0">
          <div className="relative">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              disabled={!!isFollowUpDisabled}
              placeholder={t('nodes.ai_follow_up_placeholder')}
              rows={2}
              className="w-full resize-y min-h-[72px] rounded-lg border border-[#E6E4DF] bg-white/90 pl-3 pr-11 py-2 pb-9 text-xs text-[#1a1a1a] placeholder:text-[#a8a6a0] focus:outline-none focus:ring-1 focus:ring-[#C2410C]/40 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleSubmit}
              onPointerDown={(e) => e.stopPropagation()}
              disabled={!!isFollowUpDisabled || !draft.trim()}
              title={t('nodes.ai_follow_up_send')}
              aria-label={t('nodes.ai_follow_up_send')}
              className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#C2410C] text-white shadow-sm transition-colors hover:bg-[#a33508] disabled:pointer-events-none disabled:opacity-40"
            >
              {isFollowUpLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <Send className="h-3.5 w-3.5" aria-hidden strokeWidth={2} />
              )}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
