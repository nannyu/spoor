import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Library,
  Plus,
  Search,
  ChevronLeft,
  Minimize2,
  Maximize2,
  Link2,
  BookOpen,
  X,
} from 'lucide-react';
import { db } from '../db';
import type { Article, ArticleCategory } from '../db';
import { isContentBlurPersistenceDisabled } from '../config/persistence';

function articleCategory(a: Article): ArticleCategory {
  return a.category ?? 'journal';
}

function articleMatchesSearch(a: Article, q: string): boolean {
  if (!q.trim()) return true;
  const low = q.trim().toLowerCase();
  const tags = (a.tags ?? []).join(' ').toLowerCase();
  return (
    a.title.toLowerCase().includes(low) ||
    a.type.toLowerCase().includes(low) ||
    (a.content ?? '').toLowerCase().includes(low) ||
    tags.includes(low)
  );
}

export interface ReferenceProps {
  articles: Article[];
  activeReferenceId: string;
  setActiveReferenceId: (id: string) => void;
  /** 从关联草稿跳转到素材库画布 */
  onOpenCanvas?: (canvasId: string) => void;
}

type FilterKey = 'all' | ArticleCategory;

function extractToc(content: string): { level: number; text: string; blockIndex: number }[] {
  const blocks = content.split(/\n\n/);
  const out: { level: number; text: string; blockIndex: number }[] = [];
  blocks.forEach((block, i) => {
    const firstLine = (block.split('\n')[0] ?? '').trim();
    const m = firstLine.match(/^(#{1,3})\s+(.+)$/);
    if (m) {
      out.push({ level: m[1].length, text: m[2].trim(), blockIndex: i });
    }
  });
  return out;
}

export function Reference({
  articles,
  activeReferenceId,
  setActiveReferenceId,
  onOpenCanvas,
}: ReferenceProps) {
  const { t } = useTranslation();
  const canvases = useLiveQuery(() => db.canvases.toArray(), []) ?? [];

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [noteStatus, setNoteStatus] = useState('');
  const [notesLocal, setNotesLocal] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [linkSelect, setLinkSelect] = useState('');
  const [contentsOpen, setContentsOpen] = useState(false);
  const [citationStatus, setCitationStatus] = useState('');

  const noteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const notesDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const contentsRef = useRef<HTMLDivElement>(null);

  const filteredArticles = useMemo(() => {
    return articles.filter((a) => {
      if (!articleMatchesSearch(a, searchQuery)) return false;
      if (activeFilter === 'all') return true;
      return articleCategory(a) === activeFilter;
    });
  }, [articles, searchQuery, activeFilter]);

  const activeArticle = useMemo(() => {
    return articles.find((a) => a.id === activeReferenceId) ?? articles[0];
  }, [articles, activeReferenceId]);

  useEffect(() => {
    setNotesLocal(activeArticle?.privateNotes ?? '');
  }, [activeArticle?.id]);

  useEffect(() => {
    if (!contentsOpen) return;
    const onDown = (e: MouseEvent) => {
      if (contentsRef.current && !contentsRef.current.contains(e.target as Node)) {
        setContentsOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [contentsOpen]);

  const handleAddArticle = async () => {
    const id = crypto.randomUUID();
    await db.articles.add({
      id,
      title: t('reference.new_article_title'),
      content: '',
      date: String(new Date().getFullYear()),
      type: 'REF',
      category: 'journal',
      tags: [],
      linkedCanvasIds: [],
      author: '',
      privateNotes: '',
    });
    setActiveReferenceId(id);
  };

  const onNotesChange = useCallback(
    (v: string) => {
      setNotesLocal(v);
      const art = activeArticle;
      if (!art) return;
      setNoteStatus('Saving...');
      if (notesDebounceRef.current) clearTimeout(notesDebounceRef.current);
      notesDebounceRef.current = setTimeout(async () => {
        await db.articles.update(art.id, { privateNotes: v });
        setNoteStatus('Saved');
        if (noteTimeoutRef.current) clearTimeout(noteTimeoutRef.current);
        noteTimeoutRef.current = setTimeout(() => {
          setNoteStatus('');
        }, 2000);
      }, 500);
    },
    [activeArticle],
  );

  const toc = useMemo(() => (activeArticle ? extractToc(activeArticle.content) : []), [activeArticle]);

  const scrollToBlock = (blockIndex: number) => {
    const el = document.getElementById(`ref-para-${activeArticle?.id}-${blockIndex}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setContentsOpen(false);
  };

  const copyCitation = async () => {
    if (!activeArticle) return;
    const authorPart = activeArticle.author?.trim() ? `${activeArticle.author.trim()}. ` : '';
    const line = `${authorPart}${activeArticle.title} (${activeArticle.date}). ${activeArticle.type}.`;
    try {
      await navigator.clipboard.writeText(line);
      setCitationStatus('ok');
      setTimeout(() => setCitationStatus(''), 2500);
    } catch {
      alert(t('reference.citation_failed'));
    }
  };

  const addTag = () => {
    const v = tagInput.trim();
    if (!v || !activeArticle) return;
    const tags = [...(activeArticle.tags ?? [])];
    if (tags.includes(v)) return;
    tags.push(v);
    void db.articles.update(activeArticle.id, { tags });
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    if (!activeArticle) return;
    const tags = (activeArticle.tags ?? []).filter((x) => x !== tag);
    void db.articles.update(activeArticle.id, { tags: tags.length ? tags : undefined });
  };

  const addCanvasLink = (canvasId: string) => {
    if (!activeArticle || !canvasId) return;
    const cur = activeArticle.linkedCanvasIds ?? [];
    if (cur.includes(canvasId)) return;
    void db.articles.update(activeArticle.id, { linkedCanvasIds: [...cur, canvasId] });
    setLinkSelect('');
  };

  const removeCanvasLink = (canvasId: string) => {
    if (!activeArticle) return;
    const next = (activeArticle.linkedCanvasIds ?? []).filter((id) => id !== canvasId);
    void db.articles.update(activeArticle.id, {
      linkedCanvasIds: next.length ? next : undefined,
    });
  };

  const filterPill = (key: FilterKey, label: string) => (
    <button
      key={key}
      type="button"
      onClick={() => setActiveFilter(key)}
      className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded whitespace-nowrap transition-colors ${
        activeFilter === key
          ? 'bg-[#C2410C] text-white'
          : 'bg-[#EAE7E2] text-[#5a5a54] hover:bg-[#d1cfca]'
      }`}
    >
      {label}
    </button>
  );

  const linkedIds = activeArticle?.linkedCanvasIds ?? [];
  const linkableCanvases = canvases.filter((c) => !linkedIds.includes(c.id));

  const contentBlocks = activeArticle?.content?.length
    ? activeArticle.content.split(/\n\n/)
    : activeArticle
      ? ['']
      : [];

  return (
    <div className="flex-1 flex bg-[#FAF9F6] paper-texture overflow-hidden">
      {!isFullScreen && (
        <div className="w-64 border-r border-[#E6E4DF] bg-white flex flex-col z-10 shadow-sm relative shrink-0">
          <div className="p-4 border-b border-[#E6E4DF] bg-[#F4F1ED]/50 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm font-sans text-[#1a1a1a] flex items-center gap-2">
                <Library className="w-4 h-4" />
                {t('reference.index_title')}
              </h2>
              <button
                type="button"
                onClick={() => void handleAddArticle()}
                className="text-[#8c8a84] hover:text-[#1a1a1a] transition-colors p-1 rounded hover:bg-[#EAE7E2]"
                title={t('reference.add_article')}
                aria-label={t('reference.add_article')}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-4 relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8c8a84]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('reference.search_refs')}
                className="w-full text-xs font-sans bg-white border border-[#E6E4DF] pl-9 pr-3 py-2 rounded-md focus:outline-none focus:border-[#C2410C] focus:ring-1 focus:ring-[#C2410C] transition-all shadow-sm"
              />
            </div>
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
              {filterPill('all', t('reference.filter_all'))}
              {filterPill('journal', t('reference.filter_journal'))}
              {filterPill('image', t('reference.filter_image'))}
              {filterPill('map', t('reference.filter_map'))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {articles.length === 0 ? (
              <p className="text-xs text-[#8c8a84] px-1">{t('reference.empty_library')}</p>
            ) : filteredArticles.length === 0 ? (
              <p className="text-xs text-[#8c8a84] px-1">{t('reference.no_matches')}</p>
            ) : (
              filteredArticles.map((article) => (
                <div
                  key={article.id}
                  data-testid={`reference-list-item-${article.id}`}
                  onClick={() => setActiveReferenceId(article.id)}
                  className={`p-3 border rounded-md cursor-pointer transition-all relative overflow-hidden group ${
                    activeReferenceId === article.id
                      ? 'bg-[#F4F1ED] border-[#C2410C]/30'
                      : 'bg-white border-transparent hover:border-[#E6E4DF] hover:bg-[#FAF9F6] hover:shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <span
                      className={`${
                        activeReferenceId === article.id ? 'text-[#C2410C]' : 'text-[#8c8a84]'
                      } text-[10px] uppercase tracking-wider font-mono font-bold`}
                    >
                      {article.type}
                    </span>
                    <span className="text-[#8c8a84] text-[10px]">{article.date}</span>
                  </div>
                  <h3 className="font-bold text-sm leading-tight mb-1 font-serif pr-2 text-[#1a1a1a]">
                    {article.title}
                  </h3>
                  <p className="text-[#5a5a54] text-xs font-sans truncate">
                    {(article.content || '').slice(0, 50)}
                    {(article.content || '').length > 0 ? '…' : ''}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto relative bg-[#FAF9F6] border-r border-[#E6E4DF]">
        <div className="sticky top-0 w-full h-14 bg-white/80 backdrop-blur-md border-b border-[#E6E4DF] flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4 text-[#5a5a54]">
            <button
              type="button"
              onClick={() => isFullScreen && setIsFullScreen(false)}
              disabled={!isFullScreen}
              className={`hover:text-[#1a1a1a] transition-colors ${!isFullScreen ? 'opacity-30 pointer-events-none' : ''}`}
              aria-label={t('reference.immersive_exit')}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="hover:text-[#1a1a1a] transition-colors p-1 bg-white hover:bg-[#EAE7E2] rounded border border-[#E6E4DF] shadow-sm ml-[-4px]"
              title={isFullScreen ? t('reference.immersive_exit') : t('reference.immersive_enter')}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <div className="relative" ref={contentsRef}>
              <button
                type="button"
                onClick={() => activeArticle && setContentsOpen(!contentsOpen)}
                disabled={!activeArticle}
                className="text-xs font-sans font-medium hover:text-[#1a1a1a] disabled:opacity-40"
              >
                {t('reference.contents')}
              </button>
              {contentsOpen && activeArticle ? (
                <div className="absolute left-0 top-full mt-1 min-w-[12rem] bg-white border border-[#E6E4DF] rounded-md shadow-lg py-2 z-20 max-h-64 overflow-y-auto">
                  {toc.length === 0 ? (
                    <p className="px-3 py-2 text-[11px] text-[#8c8a84]">{t('reference.contents_empty')}</p>
                  ) : (
                    toc.map((item, idx) => (
                      <button
                        key={`${item.blockIndex}-${idx}`}
                        type="button"
                        onClick={() => scrollToBlock(item.blockIndex)}
                        className="w-full text-left px-3 py-1.5 text-[11px] text-[#1a1a1a] hover:bg-[#F4F1ED]"
                        style={{ paddingLeft: `${8 + (item.level - 1) * 10}px` }}
                      >
                        {item.text}
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {citationStatus === 'ok' && (
              <span className="text-[10px] text-green-600 font-sans">{t('reference.citation_copied')}</span>
            )}
            <button
              type="button"
              onClick={() => void copyCitation()}
              disabled={!activeArticle}
              className="text-xs font-sans font-medium text-[#5a5a54] hover:text-[#1a1a1a] bg-white border border-[#E6E4DF] px-3 py-1.5 rounded shadow-sm flex items-center gap-2 disabled:opacity-40"
            >
              <Link2 className="w-3.5 h-3.5" />
              {t('reference.citation')}
            </button>
          </div>
        </div>

        {!activeArticle ? (
          <div className="max-w-2xl mx-auto my-24 px-6 text-center text-[#8c8a84] text-sm font-sans">
            {t('reference.empty_library')}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto my-12 bg-white border border-[#E6E4DF] shadow-md relative" key={activeArticle.id}>
            <div className="absolute -top-px -left-px -right-px h-1 bg-[#C2410C]" />

            <div className="p-16">
              <div className="flex justify-between items-end border-b-2 border-[#1a1a1a] pb-6 mb-10">
                <div>
                  <div className="text-[#8c8a84] font-mono text-xs uppercase tracking-widest mb-3 flex flex-wrap items-center gap-x-1">
                    <span>{t('reference.document_prefix')}</span>
                    <input
                      className="bg-transparent border-0 border-b border-transparent focus:border-[#C2410C] outline-none min-w-[5rem] max-w-[12rem] font-mono text-[#8c8a84]"
                      value={activeArticle.type}
                      onChange={(e) => void db.articles.update(activeArticle.id, { type: e.target.value })}
                      aria-label={t('reference.document_prefix')}
                    />
                  </div>
                  <h1
                    className="font-serif text-4xl font-bold text-[#1a1a1a] leading-tight max-w-xl focus:outline-none hover:bg-[#EAE7E2]/50 focus:bg-[#EAE7E2]/50 rounded px-2 -mx-2 transition-colors cursor-text"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      if (isContentBlurPersistenceDisabled()) return;
                      void db.articles.update(activeArticle.id, { title: e.currentTarget.innerText });
                    }}
                  >
                    {activeArticle.title}
                  </h1>
                </div>
                <div className="text-right text-xs font-sans text-[#5a5a54] space-y-1">
                  <p>
                    <strong>{t('reference.author_label')}:</strong>{' '}
                    <input
                      className="text-right bg-transparent border-0 border-b border-transparent focus:border-[#C2410C] outline-none w-40"
                      value={activeArticle.author ?? ''}
                      placeholder="—"
                      onChange={(e) => void db.articles.update(activeArticle.id, { author: e.target.value })}
                    />
                  </p>
                  <p>
                    <strong>{t('reference.published_label')}:</strong>{' '}
                    <input
                      className="text-right bg-transparent border-0 border-b border-transparent focus:border-[#C2410C] outline-none w-24"
                      value={activeArticle.date}
                      onChange={(e) => void db.articles.update(activeArticle.id, { date: e.target.value })}
                    />
                  </p>
                </div>
              </div>

              <div className="font-serif text-lg leading-relaxed text-[#1a1a1a] space-y-6">
                {contentBlocks.map((paragraph, i) => (
                  <p
                    key={i}
                    id={`ref-para-${activeArticle.id}-${i}`}
                    className="focus:outline-none hover:bg-[#EAE7E2]/50 focus:bg-[#EAE7E2]/50 rounded px-2 -mx-2 transition-colors cursor-text scroll-mt-24"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      if (isContentBlurPersistenceDisabled()) return;
                      const paragraphs = activeArticle.content.length
                        ? activeArticle.content.split(/\n\n/)
                        : [''];
                      if (i >= paragraphs.length) return;
                      const next = [...paragraphs];
                      next[i] = e.currentTarget.innerText;
                      void db.articles.update(activeArticle.id, { content: next.join('\n\n') });
                    }}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {!isFullScreen && (
        <div className="w-72 bg-white flex-shrink-0 flex flex-col font-sans text-xs">
          <div className="p-4 border-b border-[#E6E4DF] font-bold text-[#1a1a1a] h-14 flex items-center bg-[#F4F1ED]/50">
            {t('reference.metadata_notes')}
          </div>
          <div className="p-6 space-y-8 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[#8c8a84] font-semibold uppercase tracking-wider text-[10px] flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C2410C]" />
                  {t('reference.tags')}
                </h4>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {(activeArticle?.tags ?? []).map((tag) => (
                  <span
                    key={tag}
                    className="group bg-[#EAE7E2] text-[#5a5a54] px-2 py-1 rounded flex items-center gap-1 text-[11px]"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="opacity-60 hover:opacity-100 p-0.5 rounded hover:bg-[#d1cfca]"
                      aria-label={t('reference.remove_tag')}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder={t('reference.tag_add_placeholder')}
                  disabled={!activeArticle}
                  className="flex-1 text-[11px] bg-[#FAF9F6] border border-[#E6E4DF] rounded px-2 py-1.5 focus:outline-none focus:border-[#C2410C]"
                />
                <button
                  type="button"
                  onClick={addTag}
                  disabled={!activeArticle}
                  className="p-1.5 rounded border border-[#E6E4DF] hover:bg-[#F4F1ED] disabled:opacity-40"
                  title={t('reference.tags')}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-4">
                <label className="text-[10px] text-[#8c8a84] uppercase tracking-wider block mb-1">
                  {t('reference.category_label')}
                </label>
                <select
                  className="w-full text-[11px] bg-white border border-[#E6E4DF] rounded px-2 py-1.5 focus:outline-none focus:border-[#C2410C]"
                  value={activeArticle?.category ?? 'journal'}
                  disabled={!activeArticle}
                  onChange={(e) => {
                    if (!activeArticle) return;
                    void db.articles.update(activeArticle.id, {
                      category: e.target.value as ArticleCategory,
                    });
                  }}
                >
                  <option value="journal">{t('reference.filter_journal')}</option>
                  <option value="image">{t('reference.filter_image')}</option>
                  <option value="map">{t('reference.filter_map')}</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[#8c8a84] font-semibold uppercase tracking-wider text-[10px] flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a]" />
                  {t('reference.linked_drafts')}
                </h4>
              </div>
              {linkableCanvases.length > 0 && activeArticle ? (
                <select
                  className="w-full text-[11px] bg-white border border-[#E6E4DF] rounded px-2 py-1.5 mb-2 focus:outline-none focus:border-[#C2410C]"
                  value={linkSelect}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v) addCanvasLink(v);
                  }}
                >
                  <option value="">{t('reference.select_canvas')}</option>
                  {linkableCanvases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              ) : null}
              <div className="space-y-2">
                {linkedIds.length === 0 ? (
                  <p className="text-[11px] text-[#8c8a84]">{t('reference.linked_empty')}</p>
                ) : (
                  linkedIds.map((cid) => {
                    const c = canvases.find((x) => x.id === cid);
                    return (
                      <div
                        key={cid}
                        className="flex items-start gap-2 p-3 bg-[#FAF9F6] border border-[#E6E4DF] rounded"
                      >
                        <BookOpen className="w-4 h-4 text-[#C2410C] mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => onOpenCanvas?.(cid)}
                            className="font-semibold text-[#1a1a1a] text-[11px] text-left hover:text-[#C2410C] hover:underline"
                            disabled={!onOpenCanvas}
                          >
                            {c?.name ?? cid}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCanvasLink(cid)}
                          className="shrink-0 text-[#8c8a84] hover:text-[#ef4444] p-1"
                          aria-label={t('reference.remove_link')}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[#8c8a84] font-semibold uppercase tracking-wider text-[10px] flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#5a5a54]" />
                  {t('reference.private_notes')}
                </h4>
                {noteStatus && (
                  <span
                    className={`text-[10px] ${noteStatus === 'Saved' ? 'text-green-600' : 'text-[#8c8a84]'}`}
                  >
                    {noteStatus}
                  </span>
                )}
              </div>
              <textarea
                value={notesLocal}
                onChange={(e) => onNotesChange(e.target.value)}
                disabled={!activeArticle}
                className="w-full h-40 bg-[#FAF9F6] border border-[#E6E4DF] rounded-md p-3 text-[#5a5a54] resize-none focus:outline-none focus:border-[#C2410C] focus:ring-1 focus:ring-[#C2410C] shadow-sm disabled:opacity-40"
                placeholder={t('reference.notes_placeholder')}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
