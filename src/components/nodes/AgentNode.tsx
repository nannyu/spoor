import React from 'react';
import { useTranslation } from 'react-i18next';
import { Bot } from 'lucide-react';
import type { AgentNodeProps } from './types';

export function AgentNode({ node, agentConfigs }: AgentNodeProps) {
  const { t } = useTranslation();

  return (
    <div className="w-full h-full bg-[#1a1a1a] text-[#FAF9F6] p-4 shadow-2xl border border-[#333] rounded-lg relative overflow-hidden group flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-br from-[#C2410C]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="flex items-center gap-3 mb-2 relative z-10">
        <div className="w-8 h-8 rounded bg-[#333] flex items-center justify-center text-[#C2410C]">
          <Bot className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs font-bold leading-tight">{agentConfigs.find(a => a.id === node.agentConfigId)?.name || 'Agent'}</div>
          <div className="text-[10px] text-[#8c8a84] font-mono uppercase tracking-wider">{agentConfigs.find(a => a.id === node.agentConfigId)?.role || 'Assistant'}</div>
        </div>
      </div>
      <div className="text-xs text-[#a09f9c] mt-2 border-t border-[#333] pt-2 relative z-10">
        {t('nodes.connect_notes')}
      </div>
    </div>
  );
}
