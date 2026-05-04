import React from 'react';
import { useTranslation } from 'react-i18next';
import { Bot, Loader2 } from 'lucide-react';
import type { AgentNodeProps } from './types';

export function AgentNode({ node, agentConfigs, isAnalyzing }: AgentNodeProps) {
  const { t } = useTranslation();

  return (
    <div className="w-full h-full bg-white text-[#1a1a1a] p-4 shadow-lg border border-[#E6E4DF] rounded-lg relative overflow-hidden group flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-br from-[#C2410C]/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div className="flex items-center gap-3 mb-2 relative z-10">
        <div className="w-8 h-8 rounded-lg bg-[#F4F1ED] border border-[#E6E4DF] flex items-center justify-center text-[#C2410C]">
          <Bot className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs font-bold leading-tight">{agentConfigs.find(a => a.id === node.agentConfigId)?.name || 'Agent'}</div>
          <div className="text-[10px] text-[#8c8a84] font-mono uppercase tracking-wider">{agentConfigs.find(a => a.id === node.agentConfigId)?.role || 'Assistant'}</div>
        </div>
      </div>
      <div className="text-xs text-[#5a5a54] mt-2 border-t border-[#E6E4DF] pt-2 relative z-10">
        {t('nodes.connect_notes')}
      </div>
      {isAnalyzing ? (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-white/75 backdrop-blur-[1px] pointer-events-none"
          data-testid="agent-analyzing-overlay"
        >
          <Loader2 className="w-8 h-8 text-[#C2410C] animate-spin" aria-hidden />
        </div>
      ) : null}
    </div>
  );
}
