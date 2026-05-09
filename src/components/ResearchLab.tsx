import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { formatAiError } from '../services/ai';
import { getLocaleDirective } from '../utils/aiI18n';
import { metasoSearch, buildSearchContext } from '../services/search';
import { db, type ResearchSession, type ResearchSessionSearchStatus } from '../db';
import {
  Terminal,
  Cpu,
  Microscope,
  ArrowRight,
  ListChecks,
  Check,
  CheckCircle2,
  Loader2,
  FileText,
  Globe,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import type { CallAIFn } from '../types';

export type ResearchPlanStep = { title: string; desc: string };

const RESEARCH_PLAN_FALLBACK: ResearchPlanStep[] = [
  { title: 'Archive Extraction', desc: "Scan personal drafts and reference library for direct mentions." },
  { title: 'Thematic Networking', desc: 'Cross-reference dialogue with established metaphors.' },
  { title: 'Synthesis & Drafting', desc: 'Generate a comprehensive deep-dive report.' },
];

const RESEARCH_HISTORY_LIMIT = 50;

function formatSessionListDate(createdAt: number, language: string): string {
  const d = new Date(createdAt);
  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  const safeDays = Math.max(0, diffDays);
  const loc = language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US';
  try {
    if (safeDays < 7) {
      const rtf = new Intl.RelativeTimeFormat(loc, { numeric: 'auto' });
      if (safeDays === 0) return rtf.format(0, 'day');
      return rtf.format(-safeDays, 'day');
    }
  } catch {
    /* fall through */
  }
  return d.toLocaleDateString(loc, { month: 'short', day: 'numeric', year: 'numeric' });
}

function normalizeResearchPlan(raw: unknown): ResearchPlanStep[] {
  if (!Array.isArray(raw)) return [];
  const out: ResearchPlanStep[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const title = String(o.title ?? '').trim();
    const desc = String(o.desc ?? '').trim();
    if (!title && !desc) continue;
    out.push({ title: title || `Step ${out.length + 1}`, desc });
  }
  return out;
}

export interface ResearchLabProps {
  aiConfig: {
    provider: string;
    apiKey: string;
    baseUrl: string;
    model: string;
    metasoApiKey?: string;
  };
  callAI: CallAIFn;
}

type WebSearchOutcome = {
  context: string;
  sourceCount: number;
  searchStatus: ResearchSessionSearchStatus;
};

export function ResearchLab({ aiConfig, callAI }: ResearchLabProps) {
  const { t, i18n } = useTranslation();
  const [phase, setPhase] = useState<'idle' | 'planning' | 'plan_ready' | 'researching' | 'completed'>('idle');
  const [query, setQuery] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [researchPlan, setResearchPlan] = useState<ResearchPlanStep[]>([]);
  const [researchReport, setResearchReport] = useState<{intro: string, points: {title: string, text: string}[], conclusion: string}>({
    intro: '', points: [], conclusion: ''
  });
  const [searchStatus, setSearchStatus] = useState<'idle' | 'searching' | 'found' | 'fallback'>('idle');
  const [sourceCount, setSourceCount] = useState(0);
  const [planRevisionNote, setPlanRevisionNote] = useState('');
  const [planRevising, setPlanRevising] = useState(false);
  const executeResearchInFlightRef = useRef(false);

  const pastSessions = useLiveQuery(
    () => db.researchSessions.orderBy('createdAt').reverse().limit(RESEARCH_HISTORY_LIMIT).toArray(),
    []
  ) ?? [];

  const openHistorySession = (session: ResearchSession) => {
    setQuery(session.query);
    setResearchPlan(session.researchPlan.map((s) => ({ title: s.title, desc: s.desc })));
    setResearchReport({
      intro: session.researchReport.intro,
      points: session.researchReport.points ?? [],
      conclusion: session.researchReport.conclusion,
    });
    setSourceCount(session.sourceCount);
    setSearchStatus(session.searchStatus);
    setPhase('completed');
  };

  /**
   * Attempt a Metaso web search; returns context string and status for prompts and persistence.
   */
  const tryWebSearch = async (searchQuery: string): Promise<WebSearchOutcome> => {
    const apiKey = aiConfig.metasoApiKey?.trim();
    if (!apiKey) {
      setSearchStatus('idle');
      setSourceCount(0);
      return { context: '', sourceCount: 0, searchStatus: 'idle' };
    }

    setSearchStatus('searching');
    try {
      const results = await metasoSearch(searchQuery, { apiKey });
      const context = buildSearchContext(results);
      if (context) {
        const count = results.webpages?.length ?? 0;
        setSourceCount(count);
        setSearchStatus('found');
        return { context, sourceCount: count, searchStatus: 'found' };
      }
      setSearchStatus('fallback');
      return { context: '', sourceCount: 0, searchStatus: 'fallback' };
    } catch (e) {
      console.warn('[Scribe AI] Metaso search failed, degrading to offline mode', formatAiError(e));
      setSearchStatus('fallback');
      return { context: '', sourceCount: 0, searchStatus: 'fallback' };
    }
  };

  const generatePlan = async () => {
    setPhase('planning');
    setSearchStatus('idle');
    setPlanRevisionNote('');

    const { context: searchContext } = await tryWebSearch(query);

    try {
      const prompt = searchContext
        ? `${t('lab.ai_generate_plan', { query })}\n\nAdditionally, here are web search results that may inform your plan:\n\n${searchContext}`
        : t('lab.ai_generate_plan', { query });

      const text = await callAI({
        config: aiConfig,
        systemInstruction: getLocaleDirective(),
        prompt,
      });
      const jsonStr = text?.replace(/```json|```/g, '').trim() || '[]';
      const plan = normalizeResearchPlan(JSON.parse(jsonStr));
      setResearchPlan(plan.length > 0 ? plan : RESEARCH_PLAN_FALLBACK);
      setPhase('plan_ready');
    } catch (e) {
      console.error('[Scribe AI] ResearchLab generatePlan failed', formatAiError(e));
      setResearchPlan(RESEARCH_PLAN_FALLBACK);
      setPhase('plan_ready');
    }
  };

  const updatePlanItem = (idx: number, field: 'title' | 'desc', value: string) => {
    setResearchPlan(prev => {
      const next = [...prev];
      if (!next[idx]) return prev;
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const revisePlanWithAi = async () => {
    const instruction = planRevisionNote.trim();
    if (!instruction || planRevising || researchPlan.length === 0) return;

    setPlanRevising(true);
    try {
      const prompt = t('lab.ai_revise_plan', {
        query,
        plan: JSON.stringify(researchPlan, null, 2),
        instruction,
      });
      const text = await callAI({
        config: aiConfig,
        systemInstruction: getLocaleDirective(),
        prompt,
      });
      const jsonStr = text?.replace(/```json|```/g, '').trim() || '[]';
      const revised = normalizeResearchPlan(JSON.parse(jsonStr));
      if (revised.length > 0) {
        setResearchPlan(revised);
        setPlanRevisionNote('');
      }
    } catch (e) {
      console.error('[Scribe AI] ResearchLab revisePlan failed', formatAiError(e));
    } finally {
      setPlanRevising(false);
    }
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    generatePlan();
  };

  const executeResearch = async () => {
    if (executeResearchInFlightRef.current) return;
    executeResearchInFlightRef.current = true;
    try {
      setPhase('researching');
      setActiveStep(0);
      const timer1 = setTimeout(() => setActiveStep(1), 2000);
      const timer2 = setTimeout(() => setActiveStep(2), 4000);

      const { context: searchContext, sourceCount: persistedSourceCount, searchStatus: persistedSearchStatus } =
        await tryWebSearch(query);

      const planContext =
        researchPlan.length > 0
          ? `\n\nThe user-approved research plan (your report must follow this structure: align the "points" array with these steps in order and honor each step's goals in the analysis):\n${JSON.stringify(researchPlan, null, 2)}`
          : '';

      const fallbackReport = {
        intro: "Based on the analysis of your interconnected drafts and referenced literature, there are interesting narrative connections.",
        points: [
          { title: "The Metaphor of the Blueprint", text: "The protagonist is not just losing memories, but losing the 'blueprint' of their own mind." }
        ],
        conclusion: "Actionable Next Steps: Rewrite chapter 4 to emphasize the architectural distortion."
      };

      let finalReport = fallbackReport;

      try {
        const prompt = searchContext
          ? `${t('lab.ai_research_report', { query })}${planContext}\n\nUse the following web search results as primary sources for your report. Cite sources where appropriate.\n\n${searchContext}`
          : `${t('lab.ai_research_report', { query })}${planContext}`;

        const text = await callAI({
          config: aiConfig,
          systemInstruction: getLocaleDirective(),
          prompt,
        });
        const jsonStr = text?.replace(/```json|```/g, '').trim() || '{}';
        const report = JSON.parse(jsonStr);
        setResearchReport(report);
        finalReport = report;
      } catch (e) {
        console.error('[Scribe AI] ResearchLab executeResearch failed', formatAiError(e));
        setResearchReport(fallbackReport);
        finalReport = fallbackReport;
      } finally {
        clearTimeout(timer1);
        clearTimeout(timer2);
        setActiveStep(3);
        try {
          const now = Date.now();
          await db.researchSessions.add({
            id: crypto.randomUUID(),
            query,
            createdAt: now,
            updatedAt: now,
            researchPlan: researchPlan.map((s) => ({ title: s.title, desc: s.desc })),
            researchReport: {
              intro: finalReport.intro ?? '',
              points: Array.isArray(finalReport.points)
                ? finalReport.points.map((p: { title?: string; text?: string }) => ({
                    title: String(p?.title ?? ''),
                    text: String(p?.text ?? ''),
                  }))
                : [],
              conclusion: finalReport.conclusion ?? '',
            },
            sourceCount: persistedSourceCount,
            searchStatus: persistedSearchStatus,
          });
        } catch (persistErr) {
          console.error('[Scribe AI] ResearchLab failed to persist session', persistErr);
        }
        setPhase('completed');
      }
    } finally {
      executeResearchInFlightRef.current = false;
    }
  };

  return (
    <div className="flex-1 flex bg-[#FAF9F6] paper-texture text-[#1a1a1a] overflow-hidden">
      {/* Side Panel: History & Status */}
      <div className="w-64 border-r border-[#E6E4DF] flex flex-col bg-[#F4F1ED]/50 z-10 shrink-0">
        <div className="p-4 border-b border-[#E6E4DF]">
          <div className="flex items-center gap-2 text-[#C2410C] font-mono text-xs uppercase tracking-widest font-bold">
            <Cpu className="w-4 h-4" />
            {t('lab.agent_title')}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
           {phase === 'idle' ? (
             <>
               <h3 className="font-sans text-xs font-bold text-[#8c8a84] uppercase tracking-wider mb-4">{t('lab.past_sessions')}</h3>
               {pastSessions.length === 0 ? (
                 <p className="text-xs text-[#8c8a84] font-sans leading-relaxed">{t('lab.no_past_sessions')}</p>
               ) : (
                 <div className="space-y-2">
                   {pastSessions.map((session) => (
                     <button
                       key={session.id}
                       type="button"
                       data-testid={`research-session-${session.id}`}
                       onClick={() => openHistorySession(session)}
                       className="w-full text-left p-3 bg-white border border-[#E6E4DF] rounded cursor-pointer hover:border-[#C2410C]/50 transition-colors shadow-sm"
                     >
                       <div className="text-[#8c8a84] text-[10px] mb-1 font-sans">
                         {formatSessionListDate(session.createdAt, i18n.language)}
                       </div>
                       <div className="text-sm font-sans font-medium text-[#1a1a1a] line-clamp-3">{session.query}</div>
                     </button>
                   ))}
                 </div>
               )}
             </>
           ) : (
             <>
               <div className="flex justify-between items-center mb-4">
                 <span className="font-mono text-xs text-[#8c8a84] uppercase font-bold tracking-wider">Sources Utilized</span>
                 {phase === 'completed' && <button onClick={() => {setPhase('idle'); setQuery(''); setSearchStatus('idle'); setSourceCount(0);}} className="text-[#C2410C] text-xs hover:underline font-bold">{t('lab.new_research')}</button>}
               </div>

               {/* Search status indicator */}
               {searchStatus === 'searching' && (
                 <div className="mb-3 p-2 bg-white border border-[#C2410C]/30 rounded text-xs flex items-center gap-2 text-[#C2410C] font-mono">
                   <Globe className="w-3 h-3 animate-pulse" />
                   <span>{t('lab.searching')}</span>
                 </div>
               )}
               {searchStatus === 'found' && (
                 <div className="mb-3 p-2 bg-white border border-[#4ade80]/30 rounded text-xs flex items-center gap-2 text-[#16a34a] font-mono">
                   <Globe className="w-3 h-3" />
                   <span>{t('lab.search_complete', { count: sourceCount })}</span>
                 </div>
               )}
               {searchStatus === 'fallback' && (
                 <div className="mb-3 p-2 bg-white border border-[#eab308]/30 rounded text-xs flex items-center gap-2 text-[#a16207] font-mono">
                   <AlertTriangle className="w-3 h-3" />
                   <span>{t('lab.search_fallback')}</span>
                 </div>
               )}

               <div className="space-y-3">
                  <div className={`bg-white border border-[#E6E4DF] p-3 rounded text-sm relative shadow-sm transition-all ${activeStep >= 1 ? 'opacity-100' : 'opacity-0 translate-y-4'}`}>
                     <div className="text-[10px] text-[#4ade80] mb-1 font-mono flex items-center gap-1 font-bold"><Check className="w-3 h-3"/> Processed</div>
                     <div className="text-[#1a1a1a] font-serif font-bold">Ch 4: The Archive</div>
                     <div className="text-[#5a5a54] text-xs mt-1 font-sans">Found 3 metaphors for 'decay'.</div>
                  </div>
                  <div className={`bg-white border border-[#E6E4DF] p-3 rounded text-sm relative shadow-sm transition-all ${activeStep >= 2 ? 'opacity-100' : 'opacity-0 translate-y-4'}`}>
                     <div className="text-[10px] text-[#4ade80] mb-1 font-mono flex items-center gap-1 font-bold"><Check className="w-3 h-3"/> Processed</div>
                     <div className="text-[#1a1a1a] font-serif font-bold">REF-042: Spatial Encoding</div>
                     <div className="text-[#5a5a54] text-xs mt-1 font-sans">Linked theory of trauma and blueprints.</div>
                  </div>
               </div>
             </>
           )}
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
         {phase === 'idle' && (
           <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-3xl mx-auto w-full">
               <div className="w-16 h-16 bg-white border border-[#E6E4DF] shadow-sm rounded-2xl flex items-center justify-center mb-8">
                <Microscope className="w-8 h-8 text-[#C2410C]" />
              </div>
              <h1 className="text-4xl font-serif font-bold mb-4 text-center text-[#1a1a1a]">{t('lab.investigate')}</h1>
              <p className="text-[#5a5a54] text-center mb-8 font-sans text-lg">
                 Enter a broad topic or specific thesis. The agent will formulate a research plan, cross-reference archives, and generate a synthesized report.
              </p>

              <form onSubmit={handleStart} className="w-full relative group">
                 <div className="absolute -inset-1 bg-gradient-to-r from-[#C2410C]/20 to-[#C2410C]/0 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                 <input
                   type="text"
                   value={query}
                   onChange={e => setQuery(e.target.value)}
                   placeholder={t('lab.placeholder')}
                   className="relative w-full bg-white border border-[#E6E4DF] text-[#1a1a1a] pl-6 pr-16 py-4 rounded-xl font-sans focus:outline-none focus:border-[#C2410C] focus:ring-1 focus:ring-[#C2410C] shadow-lg text-lg placeholder-[#8c8a84]"
                   autoFocus
                 />
                 <button
                   type="submit"
                   className={`absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg flex items-center justify-center transition-all ${query.trim() ? 'bg-[#C2410C] text-white hover:bg-[#a0350a] shadow-md' : 'bg-[#F4F1ED] text-[#8c8a84] cursor-not-allowed border border-[#E6E4DF]'}`}
                 >
                   <ArrowRight className="w-5 h-5" />
                 </button>
              </form>

              <div className="mt-8 flex gap-3 text-xs font-mono text-[#5a5a54]">
                 <span className="bg-white px-3 py-1 rounded-full border border-[#E6E4DF] shadow-sm"># spatial-encoding</span>
                 <span className="bg-white px-3 py-1 rounded-full border border-[#E6E4DF] shadow-sm"># character-arcs</span>
              </div>
           </div>
         )}

         {(phase === 'planning' || phase === 'plan_ready') && (
           <div className="flex-1 p-12 overflow-y-auto w-full max-w-5xl mx-auto">
              <div className="mb-8 border-b border-[#E6E4DF] pb-8">
                 <div className="text-[#C2410C] font-mono text-xs mb-2">TARGET INQUIRY</div>
                 <h2 className="text-3xl font-serif font-bold text-[#1a1a1a]">{query}</h2>
              </div>

              <div className="bg-white border border-[#E6E4DF] shadow-md rounded-xl p-8 relative overflow-hidden">
                {phase === 'planning' && (
                  <div className="flex flex-col items-center justify-center py-12">
                     <Loader2 className="w-8 h-8 text-[#C2410C] animate-spin mb-4" />
                     <div className="font-mono text-sm text-[#8c8a84]">
                       {searchStatus === 'searching' ? t('lab.searching') : t('nodes.ai_loading')}
                     </div>
                  </div>
                )}

                {phase === 'plan_ready' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                     <div className="flex items-center gap-3 mb-2">
                        <ListChecks className="w-6 h-6 text-[#4ade80]" />
                        <h3 className="text-xl font-sans font-bold text-[#1a1a1a]">Recommended Research Plan</h3>
                     </div>
                     <p className="text-[#5a5a54] text-sm font-sans mb-6">{t('lab.plan_edit_hint')}</p>

                     <div className="space-y-5 mb-8">
                        {researchPlan.length > 0 ? researchPlan.map((plan, idx) => (
                           <div key={idx} className="flex gap-4">
                              <div className="w-6 h-6 rounded-full bg-[#F4F1ED] border border-[#E6E4DF] flex items-center justify-center font-mono text-xs text-[#5a5a54] shrink-0 font-bold mt-2">{idx + 1}</div>
                              <div className="flex-1 min-w-0 space-y-2">
                                 <input
                                   type="text"
                                   value={plan.title}
                                   onChange={e => updatePlanItem(idx, 'title', e.target.value)}
                                   disabled={planRevising}
                                   className="w-full font-bold text-[#1a1a1a] text-base bg-[#FAF9F6] border border-[#E6E4DF] rounded-lg px-3 py-2 font-sans focus:outline-none focus:border-[#C2410C] focus:ring-1 focus:ring-[#C2410C] disabled:opacity-60"
                                   aria-label={`Step ${idx + 1} title`}
                                 />
                                 <textarea
                                   value={plan.desc}
                                   onChange={e => updatePlanItem(idx, 'desc', e.target.value)}
                                   disabled={planRevising}
                                   rows={4}
                                   className="w-full text-[#5a5a54] text-sm bg-[#FAF9F6] border border-[#E6E4DF] rounded-lg px-3 py-2 font-sans leading-relaxed resize-y min-h-[5rem] focus:outline-none focus:border-[#C2410C] focus:ring-1 focus:ring-[#C2410C] disabled:opacity-60"
                                   aria-label={`Step ${idx + 1} description`}
                                 />
                              </div>
                           </div>
                        )) : (
                           <div className="text-center text-[#5a5a54]">Generating plan...</div>
                        )}
                     </div>

                     <div className="border-t border-[#E6E4DF] pt-6 space-y-3">
                        <form
                          onSubmit={e => {
                            e.preventDefault();
                            void revisePlanWithAi();
                          }}
                          className="space-y-3"
                        >
                           <textarea
                             value={planRevisionNote}
                             onChange={e => setPlanRevisionNote(e.target.value)}
                             disabled={planRevising || researchPlan.length === 0}
                             rows={3}
                             placeholder={t('lab.plan_revision_placeholder')}
                             className="w-full text-[#1a1a1a] text-sm bg-[#FAF9F6] border border-[#E6E4DF] rounded-lg px-4 py-3 font-sans placeholder:text-[#8c8a84] focus:outline-none focus:border-[#C2410C] focus:ring-1 focus:ring-[#C2410C] disabled:opacity-60 resize-y min-h-[5.5rem]"
                           />
                           <div className="flex flex-wrap items-center justify-between gap-3">
                              <button
                                type="submit"
                                disabled={planRevising || !planRevisionNote.trim() || researchPlan.length === 0}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-sans text-sm font-bold border border-[#E6E4DF] bg-white text-[#1a1a1a] hover:border-[#C2410C]/60 hover:bg-[#FFF7ED] disabled:opacity-50 disabled:pointer-events-none transition-colors shadow-sm"
                              >
                                {planRevising ? <Loader2 className="w-4 h-4 animate-spin text-[#C2410C]" /> : <Sparkles className="w-4 h-4 text-[#C2410C]" />}
                                {planRevising ? t('lab.plan_revision_applying') : t('lab.plan_revision_apply')}
                              </button>
                           </div>
                        </form>
                     </div>

                     <div className="flex justify-end pt-6 border-t border-[#E6E4DF] mt-6">
                        <button
                          type="button"
                          onClick={() => void executeResearch()}
                          disabled={planRevising || researchPlan.length === 0}
                          className="bg-[#C2410C] hover:bg-[#a0350a] disabled:opacity-50 disabled:pointer-events-none text-white px-6 py-3 rounded-lg font-sans font-bold transition-all shadow-md flex items-center gap-2"
                        >
                          {t('lab.approve')} <ArrowRight className="w-4 h-4" />
                        </button>
                     </div>
                  </div>
                )}
              </div>
           </div>
         )}

         {phase === 'researching' && (
           <div className="flex-1 flex items-center justify-center p-8 w-full max-w-2xl mx-auto">
              <div className="w-full bg-white border border-[#E6E4DF] shadow-md rounded-xl p-6 font-mono text-sm">
                 <div className="flex items-center gap-2 mb-6 text-[#C2410C] font-bold">
                   <Terminal className="w-4 h-4" />
                   <span>{t('lab.executing')}</span>
                 </div>

                 <div className="space-y-4 text-[#8c8a84]">
                   <div className="flex items-center gap-3">
                     <CheckCircle2 className="w-4 h-4 text-[#4ade80]" />
                     <span className="text-[#1a1a1a]">Persistence Layer Active (Dexie/IndexedDB).</span>
                   </div>
                   <div className="flex items-center gap-3">
                     <CheckCircle2 className="w-4 h-4 text-[#4ade80]" />
                     <span className="text-[#1a1a1a]">Initialized research environment.</span>
                   </div>

                   {/* Web search step */}
                   <div className="flex items-center gap-3">
                     {searchStatus === 'found' ? (
                       <CheckCircle2 className="w-4 h-4 text-[#4ade80]" />
                     ) : searchStatus === 'fallback' ? (
                       <AlertTriangle className="w-4 h-4 text-[#eab308]" />
                     ) : searchStatus === 'searching' ? (
                       <Loader2 className="w-4 h-4 animate-spin text-[#C2410C]" />
                     ) : (
                       <CheckCircle2 className="w-4 h-4 text-[#4ade80]" />
                     )}
                     <span className={
                       searchStatus === 'found' ? "text-[#1a1a1a]" :
                       searchStatus === 'fallback' ? "text-[#a16207]" :
                       searchStatus === 'searching' ? "text-[#1a1a1a]" :
                       "text-[#5a5a54]"
                     }>
                       {searchStatus === 'searching' && t('lab.searching')}
                       {searchStatus === 'found' && t('lab.search_complete', { count: sourceCount })}
                       {searchStatus === 'fallback' && t('lab.search_fallback')}
                       {searchStatus === 'idle' && (aiConfig.metasoApiKey ? 'Preparing web search...' : 'Offline mode — no Metaso API key configured.')}
                     </span>
                   </div>

                   <div className="flex items-center gap-3">
                     {activeStep >= 1 ? <CheckCircle2 className="w-4 h-4 text-[#4ade80]" /> : <Loader2 className="w-4 h-4 animate-spin text-[#C2410C]" />}
                     <span className={activeStep >= 1 ? "text-[#1a1a1a]" : "text-[#5a5a54]"}>Scanning internal drafts (4/4 complete)...</span>
                   </div>

                   {activeStep >= 1 && (
                     <div className="flex items-center gap-3">
                       {activeStep >= 2 ? <CheckCircle2 className="w-4 h-4 text-[#4ade80]" /> : <Loader2 className="w-4 h-4 animate-spin text-[#C2410C]" />}
                       <span className={activeStep >= 2 ? "text-[#1a1a1a]" : "text-[#5a5a54]"}>Cross-referencing "Spatial Encoding" index (REF-042)...</span>
                     </div>
                   )}

                   {activeStep >= 2 && (
                     <div className="flex items-center gap-3">
                       <Loader2 className="w-4 h-4 animate-spin text-[#C2410C]" />
                       <span className="text-[#5a5a54]">Synthesizing final analytical report...</span>
                     </div>
                   )}
                 </div>
              </div>
           </div>
         )}

         {phase === 'completed' && (
            <div className="flex-1 flex overflow-hidden">
               {/* Final Report */}
               <div className="flex-1 bg-[#FAF9F6] text-[#1a1a1a] overflow-y-auto relative paper-texture">
                  <div className="max-w-5xl mx-auto px-16 py-14">
                     <div className="mb-12 text-center">
                        <div className="text-[#C2410C] font-mono text-xs uppercase tracking-widest mb-4 flex items-center justify-center gap-2 font-bold">
                          <FileText className="w-4 h-4" /> {t('lab.report')}
                        </div>
                        <h1 className="font-serif text-[44px] font-bold leading-tight mb-4">{query || t('lab.report')}</h1>
                        <div className="h-0.5 w-20 bg-[#1a1a1a] mx-auto"></div>
                        {searchStatus === 'found' && (
                          <p className="text-xs text-[#8c8a84] mt-3 font-mono">Based on {sourceCount} web sources + LLM synthesis</p>
                        )}
                        {searchStatus === 'fallback' && (
                          <p className="text-xs text-[#a16207] mt-3 font-mono">Offline mode — LLM-only synthesis</p>
                        )}
                     </div>

                     <div className="font-serif text-[19px] leading-[1.9] text-[#1a1a1a] space-y-7">
                        <p>{researchReport.intro}</p>

                        {researchReport.points?.map((pt, idx) => (
                           <React.Fragment key={idx}>
                              <h3 className="font-sans font-bold text-[22px] mt-10 mb-4">{idx + 1}. {pt.title}</h3>
                              <p>{pt.text}</p>
                           </React.Fragment>
                        ))}

                        <div className="bg-[#fff9e6] border-l-4 border-[#C2410C] p-5 text-[#5a5a54] font-sans text-sm my-8 shadow-sm rounded-r">
                           <strong className="text-[#1a1a1a]">Agent Recommendation & Conclusion:</strong> {researchReport.conclusion}
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
    </div>
  );
}
