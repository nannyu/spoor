import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Coffee, Sparkles } from 'lucide-react';
import Markdown from 'react-markdown';
import { db } from '../../db';
import type { NodeContentProps } from './types';
import { isContentBlurPersistenceDisabled } from '../../config/persistence';

function receiptDerivedFromId(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  }
  const u = Math.abs(h);
  const store = (u % 90) + 10;
  const txn = (u % 900000) + 100000;
  const barcodeTail = (u % 1000000).toString().padStart(6, '0');
  return { store, txn, barcodeTail };
}

export function NoteNode({
  node,
  editingNodeId,
  setEditingNodeId,
}: NodeContentProps) {
  const { t, i18n } = useTranslation();
  const isGlass = node.layout === 1;
  const isReceipt = node.layout === 4;

  const receiptMeta = useMemo(() => receiptDerivedFromId(node.id), [node.id]);
  const receiptStamp = useMemo(() => {
    const d = new Date();
    const loc = i18n.language?.startsWith('zh') ? 'zh-CN' : 'en-US';
    return {
      date: d.toLocaleDateString(loc),
      time: d.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' }),
    };
  }, [node.id, i18n.language]);

  const barcodeLine = `${String(receiptMeta.store).padStart(3, '0')} ${receiptMeta.txn} ${receiptMeta.barcodeTail}`;

  if (isReceipt) {
    const editReceipt =
      'focus:outline-none rounded px-1 -mx-1 transition-all cursor-text min-h-[50px] select-text font-mono text-[13px] leading-[1.4] text-[#2c281f] [text-shadow:0_0_1px_rgba(44,40,31,0.2)]';
    const viewReceipt =
      'markdown-body cursor-text min-h-[50px] font-mono text-[13px] leading-[1.4] text-[#2c281f] [text-shadow:0_0_1px_rgba(44,40,31,0.2)]';

    return (
      <div
        className="receipt-note-shadow flex h-full w-full min-h-0 flex-col transition-all duration-500"
        style={{ outline: '1px solid transparent' }}
      >
        <div className="receipt-jagged-top shrink-0 rotate-180 bg-[#fcf8f9]" aria-hidden />
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#fcf8f9] px-5 py-5">
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03] mix-blend-multiply"
            aria-hidden
          >
            <Coffee className="h-40 w-40 text-[#2c281f]" strokeWidth={1} />
          </div>

          <div className="relative z-10 mb-5 border-b-2 border-dashed border-[#c7c5d4] pb-5 text-center text-[#2c281f] [text-shadow:0_0_1px_rgba(44,40,31,0.2)]">
            <h2 className="mb-2 font-mono text-[12px] font-semibold uppercase tracking-[0.2em]">
              {t('nodes.receipt_title')}
            </h2>
            <p className="font-mono text-[13px] uppercase">{t('nodes.receipt_store', { num: receiptMeta.store })}</p>
            <p className="mt-4 font-mono text-[13px]">
              {t('nodes.receipt_date')} {receiptStamp.date}
            </p>
            <p className="font-mono text-[13px]">
              {t('nodes.receipt_time')} {receiptStamp.time}
            </p>
            <p className="font-mono text-[13px]">
              {t('nodes.receipt_txn')} {receiptMeta.txn}
            </p>
          </div>

          <div className="relative z-10 mb-1 flex justify-between border-b border-dashed border-[#c7c5d4] pb-2 font-mono text-[12px] font-semibold uppercase tracking-widest text-[#2c281f] [text-shadow:0_0_1px_rgba(44,40,31,0.2)]">
            <span>{t('nodes.receipt_col_item')}</span>
            <span>{t('nodes.receipt_col_amt')}</span>
          </div>
          <div className="relative z-10 -mt-1 mb-3 flex justify-between font-mono text-[13px] text-[#2c281f]/80 [text-shadow:0_0_1px_rgba(44,40,31,0.15)]">
            <span className="pr-4">{node.type === 'note' ? t('nodes.observation') : t('nodes.note')}</span>
            <span className="shrink-0">{t('nodes.receipt_row_value')}</span>
          </div>

          <div className="note-receipt-markdown relative z-10 min-h-0 flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {editingNodeId === node.id ? (
              <div
                autoFocus
                className={`${editReceipt} empty:before:text-[#2c281f]/40 empty:before:content-['${t('nodes.type_something')}']`}
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => {
                  if (!isContentBlurPersistenceDisabled()) {
                    db.nodes.update(node.id, { content: e.currentTarget.innerText });
                  }
                  setEditingNodeId(null);
                }}
              >
                {node.content}
              </div>
            ) : (
              <div onClick={() => setEditingNodeId(node.id)} className={viewReceipt}>
                <Markdown>{node.content || `_${t('nodes.empty_note')}_`}</Markdown>
              </div>
            )}
          </div>

          <div className="relative z-10 mt-auto border-t-2 border-dashed border-[#c7c5d4] pt-5 text-center text-[#2c281f] [text-shadow:0_0_1px_rgba(44,40,31,0.2)]">
            <div className="mb-4 flex justify-between font-mono text-[12px] font-semibold uppercase tracking-widest">
              <span>{t('nodes.receipt_total')}</span>
              <span>{t('nodes.receipt_paid')}</span>
            </div>
            <p className="mb-2 font-mono text-[13px] uppercase opacity-80">{t('nodes.receipt_thanks')}</p>
            <p className="mb-4 font-mono text-[11px] opacity-60">{t('nodes.receipt_policy')}</p>
            <div className="receipt-barcode mb-2 opacity-80 mix-blend-multiply" aria-hidden />
            <p className="font-mono text-[11px] tracking-widest opacity-90">{barcodeLine}</p>
          </div>
        </div>
        <div className="receipt-jagged-bottom shrink-0 rotate-180 bg-[#fcf8f9]" aria-hidden />
      </div>
    );
  }

  const outerClass = isGlass
    ? 'w-full h-full transition-all duration-500 flex flex-col relative overflow-hidden rounded-xl border border-white/60 bg-white/40 backdrop-blur-[12px] shadow-[0_0_24px_rgba(21,21,125,0.15)]'
    : `w-full h-full transition-all duration-500 border-2 flex flex-col ${
        node.layout === 3 ? 'shadow-[4px_4px_0px_0px_#1b1b1c]' : 'shadow-lg'
      } ${
        node.layout === 2
          ? 'p-4 bg-[#F4F1ED] border-transparent shadow-sm'
          : node.layout === 3
            ? 'p-6 gap-4 bg-[#fcf8f9] border-[#1b1b1c]'
            : 'p-5 bg-white border-[#E6E4DF]'
      }`;

  const editTypography = isGlass
    ? 'font-sans text-[18px] font-normal leading-[1.6] text-[#464652]'
    : node.layout === 2
      ? 'text-xs font-mono leading-5 text-[#5a5a54]'
      : node.layout === 3
        ? 'font-newsreader text-[24px] font-medium leading-[1.3] tracking-[-0.02em] text-[#1b1b1c] pt-2'
        : 'text-sm font-serif leading-relaxed text-[#4a4a44]';

  const viewTypography = isGlass
    ? 'markdown-body font-sans text-[18px] font-normal leading-[1.6] text-[#464652]'
    : node.layout === 2
      ? 'markdown-body text-xs font-mono leading-5 text-[#5a5a54]'
      : node.layout === 3
        ? 'markdown-body font-newsreader text-[24px] font-medium leading-[1.3] tracking-[-0.02em] text-[#1b1b1c] pt-2'
        : 'markdown-body text-sm font-serif leading-relaxed text-[#4a4a44]';

  return (
    <div className={outerClass} style={{ outline: '1px solid transparent' }}>
      {isGlass && (
        <>
          <div
            className="pointer-events-none absolute inset-0 rounded-xl border border-transparent shadow-[inset_1px_1px_0_rgba(255,255,255,0.8)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-[#c0c1ff]/40 via-[#c6eccd]/20 to-transparent opacity-80 mix-blend-overlay"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute left-0 top-0 h-24 w-24 rounded-xl bg-gradient-to-br from-[#e1e0ff]/50 to-transparent blur-md"
            aria-hidden
          />
        </>
      )}

      {isGlass ? (
        <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-4 p-6">
          <header className="flex shrink-0 items-center justify-between">
            <Sparkles className="h-7 w-7 shrink-0 text-[#15157d]" strokeWidth={1.5} aria-hidden />
            <span className="text-right font-sans text-[12px] font-semibold uppercase leading-none tracking-[0.05em] text-[#15157d]/70">
              {t('nodes.thought_node')}
            </span>
          </header>
          <div className="note-glass-markdown mt-2 min-h-0 flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {editingNodeId === node.id ? (
              <div
                autoFocus
                className={`focus:outline-none rounded px-1 -mx-1 transition-all cursor-text min-h-[50px] select-text empty:before:content-['${t('nodes.type_something')}'] empty:before:text-gray-300/80 ${editTypography}`}
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => {
                  if (!isContentBlurPersistenceDisabled()) {
                    db.nodes.update(node.id, { content: e.currentTarget.innerText });
                  }
                  setEditingNodeId(null);
                }}
              >
                {node.content}
              </div>
            ) : (
              <div onClick={() => setEditingNodeId(node.id)} className={`cursor-text min-h-[50px] ${viewTypography}`}>
                <Markdown>{node.content || `_${t('nodes.empty_note')}_`}</Markdown>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className={`flex items-center space-x-2 ${node.layout === 3 ? '' : 'mb-2'}`}>
            <span
              className={`font-sans uppercase tracking-wider ${
                node.layout === 3
                  ? 'bg-[#1b1b1c] text-white px-2 py-1 text-[12px] font-semibold leading-none'
                  : 'text-[10px] font-bold text-[#8c8a84]'
              }`}
            >
              {node.type === 'note' ? t('nodes.observation') : t('nodes.note')}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 pr-1 custom-scrollbar">
            {editingNodeId === node.id ? (
              <div
                autoFocus
                className={`focus:outline-none rounded px-1 -mx-1 transition-all cursor-text min-h-[50px] select-text empty:before:content-['${t('nodes.type_something')}'] empty:before:text-gray-300 ${editTypography}`}
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => {
                  if (!isContentBlurPersistenceDisabled()) {
                    db.nodes.update(node.id, { content: e.currentTarget.innerText });
                  }
                  setEditingNodeId(null);
                }}
              >
                {node.content}
              </div>
            ) : (
              <div onClick={() => setEditingNodeId(node.id)} className={`cursor-text min-h-[50px] ${viewTypography}`}>
                <Markdown>{node.content || `_${t('nodes.empty_note')}_`}</Markdown>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
