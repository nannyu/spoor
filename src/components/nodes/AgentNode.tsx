import React from 'react';
import { useTranslation } from 'react-i18next';
import { Bot, Loader2, Play } from 'lucide-react';
import type { AgentNodeProps } from './types';
import { resolveAgentLocalizedName, resolveAgentLocalizedRole } from '../../utils/aiI18n';

export function AgentNode({
  node,
  agentConfigs,
  isAnalyzing,
  onRunAnalysis,
  isAgentAnalysisActionDisabled,
}: AgentNodeProps) {
  const { t } = useTranslation();

  const conf = agentConfigs.find((a) => a.id === node.agentConfigId);
  const runDisabled = isAnalyzing || isAgentAnalysisActionDisabled || !onRunAnalysis;

  return (
    <div className="w-full h-full bg-white text-[#1a1a1a] p-4 shadow-lg border border-[#E6E4DF] rounded-lg relative overflow-hidden group flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-br from-[#C2410C]/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div className="flex items-start gap-3 mb-2 relative z-10">
        <div className="w-8 h-8 rounded-lg bg-[#F4F1ED] border border-[#E6E4DF] flex items-center justify-center text-[#C2410C] shrink-0">
          <Bot className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold leading-tight">{conf ? resolveAgentLocalizedName(conf) : 'Agent'}</div>
          <div className="text-[10px] text-[#8c8a84] font-mono uppercase tracking-wider">{conf ? resolveAgentLocalizedRole(conf) : 'Assistant'}</div>
        </div>
        {onRunAnalysis ? (
          <button
            type="button"
            data-testid="agent-run-analysis"
            title={t('nodes.agent_run_analysis')}
            aria-label={t('nodes.agent_run_analysis')}
            disabled={runDisabled}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (!runDisabled) onRunAnalysis();
            }}
            className="shrink-0 w-9 h-9 rounded-lg border border-[#E6E4DF] bg-[#FAF9F6] flex items-center justify-center text-[#C2410C] hover:bg-[#FFF7ED] hover:border-[#C2410C]/60 disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-sm"
          >
            <Play className="w-4 h-4" aria-hidden fill="currentColor" />
          </button>
        ) : null}
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
