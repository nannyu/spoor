import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Library, Plus, Search, ChevronLeft, Minimize2, Maximize2, Link2, BookOpen } from 'lucide-react';
import { db } from '../db';
import type { Article } from '../db';

export interface ReferenceProps {
  articles: Article[];
  activeReferenceId: string;
  setActiveReferenceId: (id: string) => void;
}

export function Reference({ articles, activeReferenceId, setActiveReferenceId }: ReferenceProps) {
  const { t } = useTranslation();
  const activeArticle = articles.find(a => a.id === activeReferenceId) || articles[0];
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [noteStatus, setNoteStatus] = useState('');
  const noteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleNoteChange = () => {
    setNoteStatus('Saving...');
    if (noteTimeoutRef.current) clearTimeout(noteTimeoutRef.current);
    noteTimeoutRef.current = setTimeout(() => {
      setNoteStatus('Saved');
      setTimeout(() => setNoteStatus(''), 2000);
    }, 1000);
  };

  return (
    <div className="flex-1 flex bg-[#FAF9F6] paper-texture overflow-hidden">
      {/* Search Sidebar */}
      {!isFullScreen && (
      <div className="w-64 border-r border-[#E6E4DF] bg-white flex flex-col z-10 shadow-sm relative shrink-0">
        <div className="p-4 border-b border-[#E6E4DF] bg-[#F4F1ED]/50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm font-sans text-[#1a1a1a] flex items-center gap-2">
              <Library className="w-4 h-4" />
              {t('reference.index_title')}
            </h2>
            <button className="text-[#8c8a84] hover:text-[#1a1a1a] transition-colors p-1 rounded hover:bg-[#EAE7E2]" title={t('sidebar.new_note')}>
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-4 relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8c8a84]" />
            <input type="text" placeholder={t('reference.search_refs')} className="w-full text-xs font-sans bg-white border border-[#E6E4DF] pl-9 pr-3 py-2 rounded-md focus:outline-none focus:border-[#C2410C] focus:ring-1 focus:ring-[#C2410C] transition-all shadow-sm" />
          </div>
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
             <span className="text-[9px] uppercase tracking-wider bg-[#EAE7E2] px-2 py-0.5 rounded text-[#5a5a54] whitespace-nowrap cursor-pointer hover:bg-[#d1cfca]">Journal</span>
             <span className="text-[9px] uppercase tracking-wider bg-[#EAE7E2] px-2 py-0.5 rounded text-[#5a5a54] whitespace-nowrap cursor-pointer hover:bg-[#d1cfca]">Images</span>
             <span className="text-[9px] uppercase tracking-wider bg-[#EAE7E2] px-2 py-0.5 rounded text-[#5a5a54] whitespace-nowrap cursor-pointer hover:bg-[#d1cfca]">Maps</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {articles.map(article => (
            <div 
              key={article.id}
              onClick={() => setActiveReferenceId(article.id)}
              className={`p-3 border rounded-md cursor-pointer transition-all relative overflow-hidden group ${activeReferenceId === article.id ? 'bg-[#F4F1ED] border-[#C2410C]/30' : 'bg-white border-transparent hover:border-[#E6E4DF] hover:bg-[#FAF9F6] hover:shadow-sm'}`}
            >
              <div className="flex justify-between items-start mb-1.5">
                <span className={`${activeReferenceId === article.id ? 'text-[#C2410C]' : 'text-[#8c8a84]'} text-[10px] uppercase tracking-wider font-mono font-bold`}>{article.type}</span>
                <span className="text-[#8c8a84] text-[10px]">{article.date}</span>
              </div>
              <h3 className={`font-bold text-sm leading-tight mb-1 font-serif pr-2 ${activeReferenceId === article.id ? 'text-[#1a1a1a]' : 'text-[#1a1a1a]'}`}>{article.title}</h3>
              <p className="text-[#5a5a54] text-xs font-sans truncate">{article.content.slice(0, 50)}...</p>
            </div>
          ))}

          {/* Static image item */}
          <div className="p-3 bg-white border border-transparent hover:border-[#E6E4DF] hover:bg-[#FAF9F6] hover:shadow-sm rounded-md cursor-pointer transition-all">
             <div className="flex justify-between items-start mb-1.5">
               <span className="text-[#8c8a84] text-[10px] uppercase tracking-wider font-mono">IMG-018</span>
               <span className="text-[#8c8a84] text-[10px]">1924</span>
             </div>
             <h3 className="font-bold text-[#1a1a1a] text-sm leading-tight mb-1 font-serif">Floorplan_Asylum.tiff</h3>
             <p className="text-[#5a5a54] text-xs font-sans truncate">Scanned blueprint with annotations</p>
          </div>
        </div>
      </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto relative bg-[#FAF9F6] border-r border-[#E6E4DF]">
         {/* Top action bar */}
         <div className="sticky top-0 w-full h-14 bg-white/80 backdrop-blur-md border-b border-[#E6E4DF] flex items-center justify-between px-6 z-10">
            <div className="flex items-center gap-4 text-[#5a5a54]">
               {!isFullScreen && <button className="hover:text-[#1a1a1a] transition-colors"><ChevronLeft className="w-5 h-5"/></button>}
               <button onClick={() => setIsFullScreen(!isFullScreen)} className="hover:text-[#1a1a1a] transition-colors p-1 bg-white hover:bg-[#EAE7E2] rounded border border-[#E6E4DF] shadow-sm ml-[-4px]" title={isFullScreen ? "Exit Fullscreen" : "Immersive Reading"}>
                 {isFullScreen ? <Minimize2 className="w-4 h-4"/> : <Maximize2 className="w-4 h-4"/>}
               </button>
               <button className="text-xs font-sans font-medium hover:text-[#1a1a1a]">Contents</button>
            </div>
            <div className="flex items-center gap-3">
               <button className="text-xs font-sans font-medium text-[#5a5a54] hover:text-[#1a1a1a] bg-white border border-[#E6E4DF] px-3 py-1.5 rounded shadow-sm flex items-center gap-2">
                 <Link2 className="w-3.5 h-3.5"/> {t('reference.citation')}
               </button>
            </div>
         </div>

         {/* Document Paper */}
         <div className="max-w-2xl mx-auto my-12 bg-white border border-[#E6E4DF] shadow-md relative">
            <div className="absolute -top-px -left-px -right-px h-1 bg-[#C2410C]"></div>
            
            <div className="p-16">
              {/* Meta Header */}
              <div className="flex justify-between items-end border-b-2 border-[#1a1a1a] pb-6 mb-10">
                 <div>
                    <div 
                      className="text-[#8c8a84] font-mono text-xs uppercase tracking-widest mb-3 focus:outline-none hover:bg-[#EAE7E2]/50 focus:bg-[#EAE7E2]/50 rounded px-1 -mx-1 transition-colors cursor-text w-max" 
                      contentEditable 
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        if (activeArticle) db.articles.update(activeArticle.id, { type: e.currentTarget.innerText });
                      }}
                    >
                      Document // {activeArticle?.type}
                    </div>
                    <h1 
                      className="font-serif text-4xl font-bold text-[#1a1a1a] leading-tight max-w-xl focus:outline-none hover:bg-[#EAE7E2]/50 focus:bg-[#EAE7E2]/50 rounded px-2 -mx-2 transition-colors cursor-text" 
                      contentEditable 
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        if (activeArticle) db.articles.update(activeArticle.id, { title: e.currentTarget.innerText });
                      }}
                    >
                      {activeArticle?.title}
                    </h1>
                 </div>
                 <div className="text-right text-xs font-sans text-[#5a5a54] space-y-1">
                    <p><strong>Author:</strong> <span className="focus:outline-none hover:bg-[#EAE7E2]/50 focus:bg-[#EAE7E2]/50 rounded px-1 -mx-1 transition-colors cursor-text" contentEditable suppressContentEditableWarning>Scribe AI</span></p>
                    <p><strong>Published:</strong> <span className="focus:outline-none hover:bg-[#EAE7E2]/50 focus:bg-[#EAE7E2]/50 rounded px-1 -mx-1 transition-colors cursor-text" contentEditable suppressContentEditableWarning>{activeArticle?.date}</span></p>
                 </div>
              </div>

              {/* Content */}
              <div className="font-serif text-lg leading-relaxed text-[#1a1a1a] space-y-6">
                {activeArticle?.content.split('\n\n').map((paragraph: string, i: number) => (
                  <p 
                    key={i} 
                    className="focus:outline-none hover:bg-[#EAE7E2]/50 focus:bg-[#EAE7E2]/50 rounded px-2 -mx-2 transition-colors cursor-text" 
                    contentEditable 
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      if (!activeArticle) return;
                      const paragraphs = activeArticle.content.split('\n\n');
                      paragraphs[i] = e.currentTarget.innerText;
                      db.articles.update(activeArticle.id, { content: paragraphs.join('\n\n') });
                    }}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
         </div>
      </div>

      {/* Meta Sidebar (Right) */}
      {!isFullScreen && (
      <div className="w-72 bg-white flex-shrink-0 flex flex-col font-sans text-xs">
         <div className="p-4 border-b border-[#E6E4DF] font-bold text-[#1a1a1a] h-14 flex items-center bg-[#F4F1ED]/50">{t('reference.metadata_notes')}</div>
         <div className="p-6 space-y-8 overflow-y-auto">
            <div>
               <div className="flex items-center justify-between mb-3">
                 <h4 className="text-[#8c8a84] font-semibold uppercase tracking-wider text-[10px] flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#C2410C]"></div>{t('reference.tags')}</h4>
                 <button className="text-[#8c8a84] hover:text-[#1a1a1a] transition-colors p-0.5 rounded hover:bg-[#EAE7E2]" title={t('sidebar.new_note')}><Plus className="w-3.5 h-3.5" /></button>
               </div>
               <div className="flex flex-wrap gap-2">
                 <span className="bg-[#EAE7E2] hover:bg-[#d1cfca] cursor-pointer transition-colors text-[#5a5a54] px-2 py-1 rounded">psychology</span>
                 <span className="bg-[#EAE7E2] hover:bg-[#d1cfca] cursor-pointer transition-colors text-[#5a5a54] px-2 py-1 rounded">architecture</span>
                 <span className="bg-[#EAE7E2] hover:bg-[#d1cfca] cursor-pointer transition-colors text-[#5a5a54] px-2 py-1 rounded">theory</span>
               </div>
            </div>

            <div>
               <div className="flex items-center justify-between mb-3">
                 <h4 className="text-[#8c8a84] font-semibold uppercase tracking-wider text-[10px] flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a]"></div>{t('reference.linked_drafts')}</h4>
                 <button className="text-[#8c8a84] hover:text-[#1a1a1a] transition-colors p-0.5 rounded hover:bg-[#EAE7E2]" title={t('canvas.link_note')}><Plus className="w-3.5 h-3.5" /></button>
               </div>
               <div className="space-y-2">
                  <div className="flex items-start gap-3 p-3 bg-[#FAF9F6] border border-[#E6E4DF] hover:border-[#C2410C]/50 rounded cursor-pointer transition-colors">
                     <BookOpen className="w-4 h-4 text-[#C2410C] mt-0.5 shrink-0" />
                     <div>
                       <div className="font-semibold text-[#1a1a1a] text-[11px] mb-0.5">The Architect's Dilemma</div>
                       <div className="text-[#8c8a84] text-[10px]">Referenced in Ch. 2</div>
                     </div>
                  </div>
               </div>
            </div>

            <div>
               <div className="flex items-center justify-between mb-3">
                 <h4 className="text-[#8c8a84] font-semibold uppercase tracking-wider text-[10px] flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#5a5a54]"></div>{t('reference.private_notes')}</h4>
                 {noteStatus && <span className={`text-[10px] ${noteStatus === 'Saved' ? 'text-green-600' : 'text-[#8c8a84]'}`}>{noteStatus}</span>}
               </div>
               <textarea onChange={handleNoteChange} className="w-full h-40 bg-[#FAF9F6] border border-[#E6E4DF] rounded-md p-3 text-[#5a5a54] resize-none focus:outline-none focus:border-[#C2410C] focus:ring-1 focus:ring-[#C2410C] shadow-sm" placeholder={t('reference.notes_placeholder')}></textarea>
            </div>
         </div>
      </div>
      )}
    </div>
  );
}
