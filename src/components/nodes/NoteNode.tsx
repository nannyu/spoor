import React from 'react';
import { useTranslation } from 'react-i18next';
import { Bot } from 'lucide-react';
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

  return (
    <div 
      className={`w-full h-full shadow-lg transition-all duration-500 border-2 flex flex-col ${
        node.layout === 1 ? 'p-8 font-serif text-lg leading-8 bg-white border-[#E6E4DF]' :
        node.layout === 2 ? 'p-4 bg-[#F4F1ED] border-transparent shadow-sm' :
        node.layout === 3 ? 'p-10 border-2 border-[#1a1a1a] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)] bg-white' :
        'p-5 bg-white border-[#E6E4DF]'
      }`}
      style={{ outline: '1px solid transparent' }}
    >
      <div className={`flex items-center space-x-2 mb-2 ${node.layout === 3 ? 'mb-6' : ''}`}>
        <span className={`text-[10px] font-sans font-bold uppercase tracking-wider ${
          node.layout === 3 ? 'bg-[#1a1a1a] text-white px-2 py-0.5' : 'text-[#8c8a84]'
        }`}>
          {node.type === 'note' ? t('nodes.observation') : t('nodes.note')}
        </span>
        {node.layout === 1 && <div className="h-px flex-1 bg-[#C2410C]/20"></div>}
      </div>
      
      <div className="flex-1 overflow-y-auto min-h-0 pr-1 custom-scrollbar">
        {editingNodeId === node.id ? (
          <div 
            autoFocus
            className={`focus:outline-none rounded px-1 -mx-1 transition-all cursor-text min-h-[50px] select-text empty:before:content-['${t('nodes.type_something')}'] empty:before:text-gray-300 ${
              node.layout === 1 ? 'text-xl text-[#1a1a1a] font-serif' :
              node.layout === 2 ? 'text-xs font-mono leading-5 text-[#5a5a54]' :
              node.layout === 3 ? 'text-2xl font-bold tracking-tight text-[#1a1a1a]' :
              'text-sm font-serif leading-relaxed text-[#4a4a44]'
            }`} 
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
            className={`markdown-body cursor-text min-h-[50px] ${
              node.layout === 1 ? 'text-xl text-[#1a1a1a] font-serif' :
              node.layout === 2 ? 'text-xs font-mono leading-5 text-[#5a5a54]' :
              node.layout === 3 ? 'text-2xl font-bold tracking-tight text-[#1a1a1a]' :
              'text-sm font-serif leading-relaxed text-[#4a4a44]'
            }`}
          >
            <Markdown>{node.content || `_${t('nodes.empty_note')}_`}</Markdown>
          </div>
        )}
      </div>

      {node.layout === 3 && (
        <div className="mt-4 flex justify-end">
          <Bot className="w-4 h-4 text-[#1a1a1a] opacity-10" />
        </div>
      )}
    </div>
  );
}
