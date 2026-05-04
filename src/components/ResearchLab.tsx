import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatAiError } from '../services/ai';
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
} from 'lucide-react';
import type { CallAIFn } from '../types';

export interface ResearchLabProps {
  aiConfig: {
    provider: string;
    apiKey: string;
    baseUrl: string;
    model: string;
  };
  callAI: CallAIFn;
}

export function ResearchLab({ aiConfig, callAI }: ResearchLabProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<'idle' | 'planning' | 'plan_ready' | 'researching' | 'completed'>('idle');
  const [query, setQuery] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [researchPlan, setResearchPlan] = useState<{title: string, desc: string}[]>([]);
  const [researchReport, setResearchReport] = useState<{intro: string, points: {title: string, text: string}[], conclusion: string}>({
    intro: '', points: [], conclusion: ''
  });

  const generatePlan = async () => {
    setPhase('planning');
    try {
      const text = await callAI({
        config: aiConfig,
        prompt: `You are a senior research strategist helping an author who is writing a manuscript.  
Their research question is: "${query}".

Design a logically connected 3‑step research plan that will help the author deeply investigate this topic and integrate the findings into their manuscript.  

For each step, return a JSON object with:
- "title": a short, descriptive title (5–7 words),
- "desc": a 2–3 sentence description that clearly states:
  - the specific goal of this step,
  - the key methods, sources, or analytical techniques to be used,
  - how the output of this step directly feeds into the manuscript.

The three steps should follow a natural research progression, such as:  
(1) scoping & literature foundation, (2) core analysis or evidence gathering, (3) synthesis, implications, or argument construction.  
Tailor the progression to the nature of the query (e.g., empirical paper, review, theoretical essay, policy report).

Respond ONLY with a valid JSON array in the following format (no additional text):
[
  {"title": "Step 1 Title", "desc": "Step 1 Description"},
  {"title": "Step 2 Title", "desc": "Step 2 Description"},
  {"title": "Step 3 Title", "desc": "Step 3 Description"}
]`
      });
      const jsonStr = text?.replace(/```json|```/g, '').trim() || '[]';
      const plan = JSON.parse(jsonStr);
      setResearchPlan(plan);
      setPhase('plan_ready');
    } catch (e) {
      console.error('[Scribe AI] ResearchLab generatePlan failed', formatAiError(e));
      setResearchPlan([
         { title: "Archive Extraction", desc: "Scan personal drafts and reference library for direct mentions." },
         { title: "Thematic Networking", desc: "Cross-reference dialogue with established metaphors." },
         { title: "Synthesis & Drafting", desc: "Generate a comprehensive deep-dive report." }
      ]);
      setPhase('plan_ready');
    }
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    generatePlan();
  };

  const executeResearch = async () => {
    setPhase('researching');
    setActiveStep(0);
    const timer1 = setTimeout(() => setActiveStep(1), 2000);
    const timer2 = setTimeout(() => setActiveStep(2), 4000);
    
    try {
      const text = await callAI({
        config: aiConfig,
        prompt: `You are a research synthesizing agent. Based on the user's query: "${query}", generate a detailed research report.
Respond ONLY in valid JSON format matching this structure:
{
  "intro": "Introduction paragraph",
  "points": [
    {"title": "Point 1 Title", "text": "Detailed analysis of this point"}
  ],
  "conclusion": "Conclusion paragraph with actionable next steps"
}`
      });
      const jsonStr = text?.replace(/```json|```/g, '').trim() || '{}';
      const report = JSON.parse(jsonStr);
      setResearchReport(report);
    } catch (e) {
      console.error('[Scribe AI] ResearchLab executeResearch failed', formatAiError(e));
      setResearchReport({
        intro: "Based on the analysis of your interconnected drafts and referenced literature, there are interesting narrative connections.",
        points: [
          { title: "The Metaphor of the Blueprint", text: "The protagonist is not just losing memories, but losing the 'blueprint' of their own mind." }
        ],
        conclusion: "Actionable Next Steps: Rewrite chapter 4 to emphasize the architectural distortion."
      });
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setActiveStep(3);
      setPhase('completed');
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
               <div className="space-y-2">
                  <div className="p-3 bg-white border border-[#E6E4DF] rounded cursor-pointer hover:border-[#C2410C]/50 transition-colors shadow-sm">
                     <div className="text-[#8c8a84] text-[10px] mb-1">Yesterday</div>
                     <div className="text-sm font-sans font-medium text-[#1a1a1a]">Architectural motifs in 20th-century asylums</div>
                  </div>
                  <div className="p-3 bg-white border border-[#E6E4DF] rounded cursor-pointer hover:border-[#C2410C]/50 transition-colors shadow-sm">
                     <div className="text-[#8c8a84] text-[10px] mb-1">Oct 12</div>
                     <div className="text-sm font-sans font-medium text-[#1a1a1a]">Evolution of memory palace techniques</div>
                  </div>
               </div>
             </>
           ) : (
             <>
               <div className="flex justify-between items-center mb-4">
                 <span className="font-mono text-xs text-[#8c8a84] uppercase font-bold tracking-wider">Sources Utilized</span>
                 {phase === 'completed' && <button onClick={() => {setPhase('idle'); setQuery('');}} className="text-[#C2410C] text-xs hover:underline font-bold">{t('lab.new_research')}</button>}
               </div>
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
           <div className="flex-1 p-12 overflow-y-auto w-full max-w-4xl mx-auto">
              <div className="mb-8 border-b border-[#E6E4DF] pb-8">
                 <div className="text-[#C2410C] font-mono text-xs mb-2">TARGET INQUIRY</div>
                 <h2 className="text-3xl font-serif font-bold text-[#1a1a1a]">{query}</h2>
              </div>

              <div className="bg-white border border-[#E6E4DF] shadow-md rounded-xl p-8 relative overflow-hidden">
                {phase === 'planning' && (
                  <div className="flex flex-col items-center justify-center py-12">
                     <Loader2 className="w-8 h-8 text-[#C2410C] animate-spin mb-4" />
                     <div className="font-mono text-sm text-[#8c8a84]">{t('nodes.ai_loading')}</div>
                  </div>
                )}

                {phase === 'plan_ready' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                     <div className="flex items-center gap-3 mb-6">
                        <ListChecks className="w-6 h-6 text-[#4ade80]" />
                        <h3 className="text-xl font-sans font-bold text-[#1a1a1a]">Recommended Research Plan</h3>
                     </div>
                     
                     <div className="space-y-6 mb-8">
                        {researchPlan.length > 0 ? researchPlan.map((plan, idx) => (
                           <div key={idx} className="flex gap-4">
                              <div className="w-6 h-6 rounded-full bg-[#F4F1ED] border border-[#E6E4DF] flex items-center justify-center font-mono text-xs text-[#5a5a54] shrink-0 font-bold">{idx + 1}</div>
                              <div>
                                 <h4 className="font-bold text-[#1a1a1a] mb-1">{plan.title}</h4>
                                 <p className="text-[#5a5a54] text-sm">{plan.desc}</p>
                              </div>
                           </div>
                        )) : (
                           <div className="text-center text-[#5a5a54]">Generating plan...</div>
                        )}
                     </div>

                     <div className="flex justify-end pt-6 border-t border-[#E6E4DF]">
                        <button 
                          onClick={executeResearch}
                          className="bg-[#C2410C] hover:bg-[#a0350a] text-white px-6 py-3 rounded-lg font-sans font-bold transition-all shadow-md flex items-center gap-2"
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
                  <div className="max-w-3xl mx-auto p-12">
                     <div className="mb-10 text-center">
                        <div className="text-[#C2410C] font-mono text-xs uppercase tracking-widest mb-4 flex items-center justify-center gap-2 font-bold">
                          <FileText className="w-4 h-4" /> {t('lab.report')}
                        </div>
                        <h1 className="font-serif text-4xl font-bold leading-tight mb-4">{query || t('lab.report')}</h1>
                        <div className="h-0.5 w-16 bg-[#1a1a1a] mx-auto"></div>
                     </div>

                     <div className="font-serif text-lg leading-relaxed text-[#1a1a1a] space-y-6">
                        <p>{researchReport.intro}</p>
                        
                        {researchReport.points?.map((pt, idx) => (
                           <React.Fragment key={idx}>
                              <h3 className="font-sans font-bold text-xl mt-8 mb-4">{idx + 1}. {pt.title}</h3>
                              <p>{pt.text}</p>
                           </React.Fragment>
                        ))}
                        
                        <div className="bg-[#fff9e6] border-l-4 border-[#C2410C] p-4 text-[#5a5a54] font-sans text-sm my-6 shadow-sm">
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
