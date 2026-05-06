import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Bot,
  Wand2,
  Send,
  ZoomIn,
  FileText as FileTextIcon,
  Loader2,
} from 'lucide-react';
import type { AgentConfig } from '../db';
import { db } from '../db';
import { getCanvasCenterPosition } from '../utils/canvas';
import { resolveAgentLocalizedName, resolveAgentLocalizedRole } from '../utils/aiI18n';

export interface CanvasToolbarProps {
  isToolbarAiLoading: boolean;
  isInputDisabled: boolean;
  aiPrompt: string;
  setAiPrompt: (prompt: string) => void;
  handleAiSubmit: () => void;
  addTextNode: () => void;
  addFileNode: (e: React.ChangeEvent<HTMLInputElement>) => void;
  agentConfigs: AgentConfig[];
  canvasTransform: { x: number; y: number; scale: number };
  setCanvasTransform: React.Dispatch<React.SetStateAction<{ x: number; y: number; scale: number }>>;
  transformRef: React.MutableRefObject<{ x: number; y: number; scale: number }>;
  activeCanvasId: string;
}

export function CanvasToolbar({
  isToolbarAiLoading,
  isInputDisabled,
  aiPrompt,
  setAiPrompt,
  handleAiSubmit,
  addTextNode,
  addFileNode,
  agentConfigs,
  canvasTransform,
  setCanvasTransform,
  transformRef,
  activeCanvasId,
}: CanvasToolbarProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* AI Prompt Bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-40">
        <div className={`bg-white rounded-2xl shadow-2xl border border-[#E6E4DF] p-2 flex items-center space-x-2 ring-4 ring-[#F4F1ED]/50 transition-all ${isToolbarAiLoading ? 'opacity-80' : ''}`}>
          <div className="flex items-center gap-1 pl-2 border-r border-[#E6E4DF] pr-3 mr-1 relative group">
            <button onClick={addTextNode} title={t('sidebar.new_note')} className="w-8 h-8 flex items-center justify-center text-[#5a5a54] hover:text-[#1a1a1a] hover:bg-[#F4F1ED] rounded-lg cursor-pointer transition-colors">
              <Plus className="w-4 h-4" />
            </button>
            <div className="relative group/agent">
              <button title={t('sidebar.agents')} className="w-8 h-8 flex items-center justify-center text-[#5a5a54] hover:text-[#1a1a1a] hover:bg-[#F4F1ED] rounded-lg cursor-pointer transition-colors">
                <Bot className="w-4 h-4" />
              </button>
              {/* Dropdown for agents */}
              <div className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-[#E6E4DF] rounded-xl shadow-xl opacity-0 invisible group-hover/agent:opacity-100 group-hover/agent:visible transition-all flex flex-col p-1">
                <div className="px-3 py-2 text-[10px] font-bold text-[#8c8a84] uppercase tracking-wider font-mono">{t('sidebar.agents')}</div>
                {agentConfigs.map(agent => (
                  <button key={agent.id} onClick={async () => {
                    const { x, y } = getCanvasCenterPosition(transformRef.current);
                    await db.nodes.add({ id: crypto.randomUUID(), canvasId: activeCanvasId, type: 'agent', agentConfigId: agent.id, x, y });
                  }} className="text-left px-3 py-2 text-sm text-[#1a1a1a] hover:bg-[#F4F1ED] rounded-lg mb-1 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#C2410C]"></div>
                    <div>
                      <div className="font-bold">{resolveAgentLocalizedName(agent)}</div>
                      <div className="text-[10px] text-[#5a5a54] leading-tight">{resolveAgentLocalizedRole(agent)}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <label title="Upload File" className="w-8 h-8 flex items-center justify-center text-[#5a5a54] hover:text-[#1a1a1a] hover:bg-[#F4F1ED] rounded-lg cursor-pointer transition-colors m-0">
              <FileTextIcon className="w-4 h-4" />
              <input type="file" accept="image/*,video/*,.docx,.txt,.md" className="hidden" onChange={addFileNode} />
            </label>
          </div>
          <div className="pl-1 text-[#C2410C]">
            <Wand2 className={`w-5 h-5 ${isToolbarAiLoading ? 'animate-pulse' : ''}`} />
          </div>
          <input 
            className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 font-sans text-sm py-3 text-[#1a1a1a] placeholder-[#8c8a84] disabled:opacity-50" 
            placeholder={t('ai.input_placeholder')} 
            type="text"
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAiSubmit()}
            disabled={isInputDisabled}
          />
          <button 
            onClick={handleAiSubmit}
            disabled={isInputDisabled}
            className="bg-[#C2410C] text-white p-2.5 rounded-xl font-sans text-sm font-bold shadow-md flex items-center justify-center hover:bg-[#a0350a] transition-colors disabled:opacity-75 shrink-0"
          >
            {isToolbarAiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-8 right-6 flex items-center bg-white/80 backdrop-blur-sm border border-[#E6E4DF] rounded-md px-3 py-1.5 shadow-sm font-sans text-[10px] font-bold text-[#8c8a84] space-x-3 z-40">
        <button 
          className="hover:text-[#1a1a1a] transition-colors"
          onClick={() => setCanvasTransform(p => ({ ...p, scale: Math.max(0.1, p.scale / 1.1) }))}
        >{t('canvas.zoom')} -</button>
        <span className="flex items-center gap-1 w-12 justify-center"><ZoomIn className="w-3 h-3" /> {Math.round(canvasTransform.scale * 100)}%</span>
        <button 
          className="hover:text-[#1a1a1a] transition-colors"
          onClick={() => setCanvasTransform(p => ({ ...p, scale: Math.min(5, p.scale * 1.1) }))}
        >{t('canvas.zoom')} +</button>
      </div>
    </>
  );
}
