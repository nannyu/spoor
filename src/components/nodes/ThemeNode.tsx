import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Maximize2 } from 'lucide-react';
import { db } from '../../db';
import type { NodeContentProps } from './types';

export function ThemeNode({ node, editingNodeId }: NodeContentProps) {
  const { t } = useTranslation();

  return (
    <div 
      className={`w-full h-full shadow-xl border-2 transition-all duration-500 flex flex-col ${
        node.layout === 1 ? 'p-8 border-l-4 border-[#C2410C] bg-white border-[#E6E4DF]' :
        node.layout === 2 ? 'p-10 bg-[#1a1a1a] text-white border-[#333] shadow-2xl' :
        node.layout === 3 ? 'p-6 border-2 border-black bg-white' : 
        'p-6 bg-white border-[#E6E4DF]'
      }`}
      style={{ outline: '1px solid transparent' }}
    >
      <div className={`flex items-center space-x-2 mb-3 ${node.layout === 3 ? 'hidden' : ''}`}>
        <Sparkles className={`w-3 h-3 ${node.layout === 2 ? 'text-[#C2410C]' : 'text-[#C2410C]'}`} />
        <span className={`text-[10px] font-sans font-bold uppercase tracking-widest ${node.layout === 2 ? 'text-[#8c8a84]' : 'text-[#C2410C]'}`}>{t('nodes.theme')}</span>
        <div className={`h-px flex-1 ${node.layout === 2 ? 'bg-white/10' : 'bg-[#F4F1ED]'}`}></div>
      </div>

      {node.layout === 3 && (
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-black mb-6 flex justify-between items-center">
          <span>Manifesto // 01</span>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-[#C2410C] rounded-full"></div>
          </div>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar ${editingNodeId === node.id ? 'select-text' : ''}`}>
        <h3 
          className={`font-bold leading-tight focus:outline-none rounded px-1 -mx-1 transition-all cursor-text ${
            node.layout === 1 ? 'text-3xl font-serif mb-4' :
            node.layout === 2 ? 'text-4xl tracking-tighter mb-4' :
            node.layout === 3 ? 'text-xl font-mono uppercase mb-4' :
            'text-2xl text-[#1a1a1a] mb-2'
          }`} 
          contentEditable 
          suppressContentEditableWarning
          onBlur={(e) => db.nodes.update(node.id, { content: e.currentTarget.innerText })}
        >
          {node.content}
        </h3>

        <p className={`focus:outline-none rounded px-1 -mx-1 transition-all cursor-text ${
          node.layout === 1 ? 'text-base font-serif leading-relaxed italic text-[#5a5a54]' :
          node.layout === 2 ? 'text-sm font-sans opacity-60 leading-relaxed' :
          node.layout === 3 ? 'text-xs font-mono leading-5 bg-[#F4F1ED] p-4 text-[#1a1a1a] border-l-2 border-black' :
          'text-sm font-serif leading-relaxed text-[#4a4a44]'
        }`} contentEditable suppressContentEditableWarning>
          {node.description || 'Central research objective for the current workspace.'}
        </p>
      </div>

      <div className={`mt-6 pt-4 flex justify-between items-center ${node.layout === 2 ? 'text-white/30 border-t border-white/10' : 'text-[#8c8a84] border-t border-[#F4F1ED]'}`}>
        <div className="flex items-center gap-2">
          <div className={`w-1 h-1 rounded-full ${node.layout === 2 ? 'bg-[#C2410C]' : 'bg-[#C2410C]'}`}></div>
          <span className="text-[10px] font-sans font-medium uppercase tracking-widest">{node.layout === 3 ? 'LATENT_SPACE' : 'Spatial Encoding'}</span>
        </div>
        <button className={`${node.layout === 2 ? 'text-white/40 hover:text-white' : 'text-[#C2410C]'} hover:scale-110 transition-transform`}><Maximize2 className="w-3 h-3" /></button>
      </div>
    </div>
  );
}
