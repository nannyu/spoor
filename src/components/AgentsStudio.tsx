import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Search,
  Bot,
  Wand2,
  Send,
  MessageSquare,
  X,
  FileText,
  Loader2,
} from 'lucide-react';
import type { AgentConfig } from '../db';
import type { CallAIFn } from '../types';
import { formatAiError } from '../services/ai';

export interface AgentsStudioProps {
  agentConfigs: AgentConfig[];
  setAgentConfigs: (configs: AgentConfig[]) => Promise<void>;
  aiConfig: {
    provider: string;
    apiKey: string;
    baseUrl: string;
    model: string;
  };
  callAI: CallAIFn;
}

export function AgentsStudio({ agentConfigs, setAgentConfigs, aiConfig, callAI }: AgentsStudioProps) {
  const { t } = useTranslation();
  const [activeAgentId, setActiveAgentId] = useState<string | null>(agentConfigs[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [sandboxMessages, setSandboxMessages] = useState<{role: 'user' | 'model'; text: string}[]>([]);
  const [sandboxInput, setSandboxInput] = useState('');
  const [isSandboxLoading, setIsSandboxLoading] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeAgent = agentConfigs.find((a) => a.id === activeAgentId) || agentConfigs[0];

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [sandboxMessages]);

  const handleAddAgent = () => {
    const newId = "agent-" + Math.random().toString(36).substr(2, 9);
    setAgentConfigs([...agentConfigs, {
      id: newId,
      name: t('agents.new_persona'),
      role: 'Assistant',
      prompt: '',
      temperature: 0.7,
      creativity: 0.4
    }]);
    setActiveAgentId(newId);
  };

  const handleUpdateActiveAgent = (field: string, value: string | number) => {
    if (!activeAgentId) return;
    setAgentConfigs(agentConfigs.map((a) => a.id === activeAgentId ? { ...a, [field]: value } : a));
    
    setSaveStatus('Saving...');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus('Saved');
      setTimeout(() => setSaveStatus(''), 2000);
    }, 800);
  };

  const handleEnhancePrompt = async () => {
    if (!activeAgent || !activeAgent.prompt) return;
    setIsEnhancing(true);
    try {
      const newPrompt = await callAI({
        config: aiConfig,
        prompt: `You are an expert in prompt engineering and AI system design. Your task is to enhance the system prompt for an AI agent.

Agent Name: ${activeAgent.name}
Agent Role: ${activeAgent.role}
Original System Prompt:
"""
${activeAgent.prompt}
"""

Create a significantly improved version of this system prompt. The enhanced prompt must:

1. **Structure** – Use clear sections (e.g., Role & Persona, Core Capabilities, Behavioral Guidelines, Communication Style, Emotional Intelligence, Boundaries & Constraints, Workflow).
2. **Role Elaboration** – Deeply flesh out the agent’s identity, leveraging its name and role to build a coherent persona.
3. **Operational Detail** – Add step‑by‑step thinking or process guidelines where appropriate; specify tools, tone, and fallback behaviours.
4. **Emotional Intelligence** – Integrate empathy, active listening, tone matching, de‑escalation techniques, and rules for asking clarifying questions or handling frustration.
5. **Do’s & Don’ts** – Include explicit behavioural rules: what the agent should always do and what it must never do.
6. **Fidelity** – Preserve the original intent and core responsibilities; do not add capabilities unrelated to the original prompt.
7. **Formatting** – Use a clean, professional layout with markdown headings, bullet points, and short paragraphs. The final prompt should be self-contained and ready to use.

Output only the enhanced system prompt. Start your response with the line "New Enhanced Prompt:" and then provide the prompt – no explanations, no commentary.
New Enhanced Prompt:`
      });
      
      let enhanced = newPrompt.trim();
      enhanced = enhanced.replace(/^New Enhanced Prompt:\s*/i, '').trim();
      handleUpdateActiveAgent('prompt', enhanced);
    } catch (error) {
      const msg = formatAiError(error);
      console.error('[Scribe AI] enhance prompt failed', msg);
      alert(`增强提示词失败\n\n${msg}\n\nF12 → Console 查看 [Scribe AI] 日志。`);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!sandboxInput.trim() || isSandboxLoading || !activeAgent) return;

    const userMsg = sandboxInput.trim();
    setSandboxMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setSandboxInput('');
    setIsSandboxLoading(true);

    try {
      const responseText = await callAI({
        config: aiConfig,
        prompt: userMsg,
        systemInstruction: activeAgent.prompt || "You are a helpful assistant.",
        temperature: activeAgent.temperature || 0.7,
        topP: activeAgent.creativity || 0.4
      });
      setSandboxMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error) {
      const msg = formatAiError(error);
      console.error('[Scribe AI] sandbox chat failed', msg);
      setSandboxMessages(prev => [...prev, { role: 'model', text: `Error: ${msg}（详见 Console [Scribe AI]）` }]);
    } finally {
      setIsSandboxLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!window.confirm(t('agents.delete_confirm'))) return;
    const newConfigs = agentConfigs.filter((a) => a.id !== id);
    setAgentConfigs(newConfigs);
    if (activeAgentId === id) {
      setActiveAgentId(newConfigs[0]?.id || null);
    }
  };

  const filteredAgents = agentConfigs.filter((a) => a.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex-1 flex bg-[#FAF9F6] overflow-hidden relative">
      {/* Pane 1: Persona List */}
      <section className="w-64 flex flex-col border-r border-[#E6E4DF] bg-white z-10">
        <div className="p-6 border-b border-[#E6E4DF] flex items-center justify-between">
          <h3 className="font-serif text-xl font-bold text-[#1a1a1a]">{t('agents.personas')}</h3>
          <button onClick={handleAddAgent} className="text-[#C2410C] hover:bg-[#F4F1ED] p-1 rounded-full transition-colors flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="divide-y divide-[#E6E4DF]">
            {filteredAgents.map((agent) => (
              <div 
                key={agent.id}
                onClick={() => {
                  setActiveAgentId(agent.id);
                  setSandboxMessages([]); // Clear sandbox messages when switching agent
                }}
                className={`p-4 cursor-pointer transition-colors border-l-4 ${activeAgentId === agent.id ? 'bg-[#F4F1ED] border-[#C2410C]' : 'hover:bg-[#F4F1ED]/50 border-transparent'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#EAE7E2] flex items-center justify-center">
                    <Bot className={`w-5 h-5 ${activeAgentId === agent.id ? 'text-[#C2410C]' : 'text-[#8c8a84]'}`} />
                  </div>
                  <div>
                    <h4 className={`font-bold ${activeAgentId === agent.id ? 'text-[#1a1a1a]' : 'text-[#5a5a54]'}`}>{agent.name}</h4>
                    <span className="text-[10px] bg-[#E6E4DF] text-[#5a5a54] px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">{agent.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 border-t border-[#E6E4DF] bg-[#F4F1ED]/30">
          <div className="relative">
            <input 
              className="w-full pl-9 pr-4 py-2 text-xs font-sans bg-white border border-[#E6E4DF] rounded-lg focus:ring-1 focus:ring-[#C2410C] focus:border-[#C2410C] outline-none" 
              placeholder={t('agents.search_personas')} 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              type="text"
            />
            <Search className="w-4 h-4 absolute left-3 top-2 text-[#8c8a84]" />
          </div>
        </div>
      </section>

      {/* Pane 2: Workspace/Editor */}
      <section className="flex-1 flex flex-col overflow-y-auto relative">
        {activeAgent ? (
          <>
            <div className="sticky top-0 bg-[#FAF9F6]/80 backdrop-blur-md px-10 py-6 border-b border-[#E6E4DF] flex flex-col sm:flex-row justify-between items-start sm:items-end z-10 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono font-bold text-[#C2410C] uppercase tracking-widest">{t('agents.active_config')}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${saveStatus === 'Saved' ? 'bg-green-500' : saveStatus === 'Saving...' ? 'bg-yellow-400 animate-pulse' : 'bg-[#C2410C]'}`}></span>
                  {saveStatus && <span className={`text-[10px] font-mono ${saveStatus === 'Saved' ? 'text-green-600' : 'text-yellow-600'}`}>{saveStatus}</span>}
                </div>
                <h1 className="font-serif text-3xl font-bold text-[#1a1a1a]">{activeAgent.name || t('agents.new_persona')}</h1>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsSandboxOpen(!isSandboxOpen)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-sans font-bold transition-all text-sm shadow-sm ${isSandboxOpen ? 'bg-[#C2410C] text-white shadow-[#C2410C]/20' : 'bg-white border border-[#E6E4DF] text-[#5a5a54] hover:bg-[#F4F1ED]'}`}
                >
                  <MessageSquare className="w-4 h-4" />
                  {isSandboxOpen ? t('agents.close_sandbox') : t('agents.test_sandbox')}
                </button>
                <button onClick={() => handleDelete(activeAgent.id)} className="px-6 py-2 text-[#ef4444] rounded-lg font-sans font-bold hover:bg-[#ef4444]/10 transition-all text-sm">
                  {t('canvas.delete_note')}
                </button>
              </div>
            </div>

            <div className="p-10 max-w-4xl w-full mx-auto md:mx-0">
              <div className="grid grid-cols-1 gap-12 pb-32">
                {/* Identity Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-1 h-8 bg-[#C2410C] rounded-full"></div>
                    <h3 className="text-xl font-serif font-bold text-[#1a1a1a]">{t('agents.identity_tone')}</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold text-[#8c8a84] uppercase tracking-wider">{t('agents.persona_name')}</label>
                      <input 
                        className="w-full p-3 font-sans text-sm bg-white border border-[#E6E4DF] rounded-lg focus:border-[#C2410C] focus:ring-1 focus:ring-[#C2410C] outline-none transition-colors" 
                        type="text" 
                        value={activeAgent.name}
                        onChange={e => handleUpdateActiveAgent('name', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold text-[#8c8a84] uppercase tracking-wider">{t('agents.role_specialty')}</label>
                      <input 
                        className="w-full p-3 font-sans text-sm bg-white border border-[#E6E4DF] rounded-lg focus:border-[#C2410C] focus:ring-1 focus:ring-[#C2410C] outline-none transition-colors" 
                        type="text" 
                        value={activeAgent.role}
                        onChange={e => handleUpdateActiveAgent('role', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <label className="text-[10px] font-mono font-bold text-[#8c8a84] uppercase tracking-wider">{t('agents.system_prompt')}</label>
                      <div className="flex items-center gap-3">
                        <span className={`${(activeAgent.prompt?.length || 0) > 2000 ? 'text-red-500' : 'text-[#a09f9c]'} text-[10px] font-mono`}>{(activeAgent.prompt?.length || 0)} / 2000</span>
                        <button 
                          onClick={handleEnhancePrompt}
                          disabled={isEnhancing || !activeAgent.prompt}
                          className="flex items-center gap-1.5 text-[10px] font-bold text-[#C2410C] hover:text-[#9a3412] px-2 py-1 bg-[#C2410C]/5 rounded border border-[#C2410C]/20 transition-all disabled:opacity-50"
                        >
                          {isEnhancing ? <Loader2 className="w-3 h-3 animate-spin"/> : <Wand2 className="w-3 h-3" />}
                          {t('agents.enhance_prompt')}
                        </button>
                      </div>
                    </div>
                    <textarea 
                      className={`w-full p-4 font-mono text-sm text-[#5a5a54] bg-white border ${(activeAgent.prompt?.length || 0) > 2000 ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-[#E6E4DF] focus:border-[#C2410C] focus:ring-[#C2410C]'} rounded-lg outline-none transition-colors overflow-y-auto resize-y min-h-[160px]`} 
                      style={{ height: Math.max(160, (activeAgent.prompt?.split('\n').length || 1) * 24 + 40) + 'px' }}
                      value={activeAgent.prompt}
                      onChange={e => handleUpdateActiveAgent('prompt', e.target.value)}
                      placeholder="You are a specialized agent. Your goal is to..."
                    />
                  </div>
                </div>

                {/* Knowledge Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-1 h-8 bg-[#C2410C] rounded-full"></div>
                    <h3 className="text-xl font-serif font-bold text-[#1a1a1a]">{t('agents.knowledge_base')}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 p-6 bg-white border border-[#E6E4DF] rounded-xl space-y-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <h4 className="font-sans font-bold text-[#1a1a1a]">Custom Knowledge Base</h4>
                        <button className="text-xs text-[#C2410C] font-bold hover:underline">Manage Files</button>
                      </div>
                  <div className="space-y-2 opacity-50 pointer-events-none">
                    <div className="flex items-center justify-between p-3 bg-[#F4F1ED] rounded-lg border border-[#E6E4DF]">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-[#8c8a84]" />
                        <span className="text-sm font-sans font-medium text-[#1a1a1a]">knowledge_base_concept.pdf</span>
                      </div>
                      <span className="text-[10px] text-[#8c8a84] font-mono">1.2 MB</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-[#E6E4DF] flex items-center justify-center">
                    <button className="flex items-center gap-2 text-[#C2410C] hover:text-[#9a3412] font-sans text-sm font-bold transition-colors">
                      <Plus className="w-4 h-4" /> {t('agents.knowledge_base').split(' (')[0]}
                    </button>
                  </div>
                    </div>
                    <div className="p-6 bg-white text-[#1a1a1a] border border-[#E6E4DF] rounded-xl flex flex-col justify-between shadow-sm">
                      <div>
                        <h4 className="font-sans font-bold mb-2">{t('agents.model_params')}</h4>
                        <div className="space-y-4 mt-6">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] uppercase font-mono tracking-widest text-[#8c8a84] mb-2">
                              <span>{t('agents.temp')}</span>
                              <span>{activeAgent.temperature ?? 0.7}</span>
                            </div>
                            <input 
                              type="range" 
                              min="0" max="2" step="0.1" 
                              value={activeAgent.temperature ?? 0.7}
                              onChange={(e) => handleUpdateActiveAgent('temperature', parseFloat(e.target.value))}
                              className="w-full accent-[#C2410C] h-1 bg-[#F4F1ED] rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                          <div className="space-y-1 mt-4">
                            <div className="flex justify-between text-[10px] uppercase font-mono tracking-widest text-[#8c8a84] mb-2">
                              <span>{t('agents.creativity')}</span>
                              <span>{activeAgent.creativity ?? 0.4}</span>
                            </div>
                            <input 
                              type="range" 
                              min="0" max="1" step="0.1" 
                              value={activeAgent.creativity ?? 0.4}
                              onChange={(e) => handleUpdateActiveAgent('creativity', parseFloat(e.target.value))}
                              className="w-full accent-[#C2410C] h-1 bg-[#F4F1ED] rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] font-mono text-[#8c8a84] mt-6">
                          Optimized for specific personas
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Sandbox Panel */}
            {isSandboxOpen && (
              <div className="absolute right-0 bottom-0 top-0 w-[400px] bg-white border-l border-[#E6E4DF] shadow-[0_-20px_50px_rgba(0,0,0,0.1)] flex flex-col z-20 animate-in slide-in-from-right duration-300">
                <div className="p-4 border-b border-[#E6E4DF] flex items-center justify-between bg-[#F4F1ED]/50">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#C2410C]" />
                    <span className="font-serif font-bold text-[#1a1a1a]">{t('agents.sandbox_title', { name: activeAgent.name })}</span>
                  </div>
                  <button onClick={() => setIsSandboxOpen(false)} className="text-[#8c8a84] hover:text-[#1a1a1a]">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAF9F6]">
                  {sandboxMessages.length === 0 && (
                    <div className="text-center py-10 px-4">
                      <Bot className="w-10 h-10 text-[#E6E4DF] mx-auto mb-3" />
                      <p className="text-xs text-[#8c8a84] font-sans">
                        {t('agents.sandbox_empty', { name: activeAgent.name })}
                      </p>
                    </div>
                  )}
                  {sandboxMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm font-sans shadow-sm ${
                        msg.role === 'user' 
                          ? 'bg-[#EAE7E2] text-[#1a1a1a] rounded-tr-none border border-[#D9D6D1]' 
                          : 'bg-white border border-[#E6E4DF] text-[#1a1a1a] rounded-tl-none'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isSandboxLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-[#E6E4DF] px-4 py-2.5 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                        <Loader2 className="w-4 h-4 text-[#C2410C] animate-spin" />
                        <span className="text-xs text-[#8c8a84] italic">{t('agents.ai_thinking')}</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-4 bg-white border-t border-[#E6E4DF]">
                  <form onSubmit={handleSendMessage} className="relative">
                    <input 
                      type="text"
                      className="w-full pl-4 pr-12 py-3 bg-[#FAF9F6] border border-[#E6E4DF] rounded-xl text-sm font-sans focus:outline-none focus:border-[#C2410C] focus:ring-1 focus:ring-[#C2410C] transition-all"
                      placeholder={t('agents.message_placeholder', { name: activeAgent.name })}
                      value={sandboxInput}
                      onChange={e => setSandboxInput(e.target.value)}
                    />
                    <button 
                      type="submit"
                      disabled={!sandboxInput.trim() || isSandboxLoading}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-[#C2410C] text-white flex items-center justify-center hover:bg-[#9a3412] transition-colors disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                  <p className="text-[10px] text-center text-[#8c8a84] mt-2 font-mono">
                    {t('agents.sandbox_note')}
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-50">
            <Bot className="w-16 h-16 text-[#8c8a84] mb-4" />
            <h2 className="font-serif text-2xl font-bold text-[#1a1a1a]">{t('agents.select_persona')}</h2>
            <p className="font-sans text-[#5a5a54] mt-2">{t('agents.select_subtitle')}</p>
          </div>
        )}
      </section>
    </div>
  );
}
