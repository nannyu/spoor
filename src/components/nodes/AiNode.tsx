import React from 'react';
import { useTranslation } from 'react-i18next';
import { Bot } from 'lucide-react';
import Markdown from 'react-markdown';
import { db } from '../../db';
import type { NodeContentProps } from './types';

export function AiNode({ node, editingNodeId, setEditingNodeId }: NodeContentProps) {
  const { t } = useTranslation();

  return (
    <div 
      className="w-full h-full bg-[#F4F1ED] p-6 shadow-lg border border-[#E6E4DF] flex flex-col"
    >
      <div className="flex justify-between items-start mb-3 sticky top-0 bg-[#F4F1ED]">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 bg-[#C2410C] rounded-full flex items-center justify-center text-white text-[10px]"><Bot className="w-3 h-3" /></div>
          <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#1a1a1a]">{t('nodes.ai_refinement')}</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 pr-1 custom-scrollbar">
        {editingNodeId === node.id ? (
          <div 
            autoFocus
            className="whitespace-pre-wrap text-sm text-[#4a4a44] font-serif leading-relaxed focus:outline-none bg-[#EAE7E2]/50 rounded px-1 -mx-1 transition-colors cursor-text min-h-[40px]" 
            contentEditable 
            suppressContentEditableWarning
            onBlur={(e) => {
              db.nodes.update(node.id, { content: e.currentTarget.innerText });
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
        )}
      </div>
    </div>
  );
}
