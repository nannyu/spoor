import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, X } from 'lucide-react';

export interface IntentClarificationModalProps {
  open: boolean;
  original: string;
  options: [string, string, string];
  hint?: string;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: (finalRequest: string) => void;
}

export function IntentClarificationModal({
  open,
  original,
  options,
  hint,
  isSubmitting,
  onCancel,
  onConfirm,
}: IntentClarificationModalProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<number | null>(null);
  const [extra, setExtra] = useState('');

  useEffect(() => {
    if (open) {
      setSelected(null);
      setExtra('');
    }
  }, [open, original]);

  if (!open) return null;

  const canConfirm = selected !== null && !isSubmitting;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="intent-clarify-title"
      onMouseDown={(e) => e.target === e.currentTarget && !isSubmitting && onCancel()}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E6E4DF] overflow-hidden max-h-[90vh] flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E6E4DF] bg-[#FAF9F6]">
          <h2 id="intent-clarify-title" className="text-sm font-bold text-[#1a1a1a]">
            {t('ai.intent.modal_title')}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-[#5a5a54] hover:bg-[#EAE7E2] disabled:opacity-50"
            aria-label={t('ai.intent.cancel')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-3 overflow-y-auto flex-1 space-y-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#8c8a84] mb-1">
              {t('ai.intent.modal_original')}
            </div>
            <p className="text-sm text-[#4a4a44] whitespace-pre-wrap rounded-lg bg-[#F4F1ED]/80 px-3 py-2 border border-[#E6E4DF]">
              {original}
            </p>
          </div>

          {hint ? (
            <p className="text-xs text-[#8c8a84] leading-relaxed">{hint}</p>
          ) : null}

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#8c8a84] mb-2">
              {t('ai.intent.modal_choose')}
            </div>
            <ul className="space-y-2">
              {options.map((opt, i) => (
                <li key={i}>
                  <label className="flex gap-3 cursor-pointer items-start rounded-xl border border-[#E6E4DF] px-3 py-2.5 hover:bg-[#FFF7ED]/50 has-[:checked]:border-[#C2410C]/50 has-[:checked]:bg-[#FFF7ED]/30">
                    <input
                      type="radio"
                      name="intent-option"
                      className="mt-1 accent-[#C2410C]"
                      checked={selected === i}
                      onChange={() => setSelected(i)}
                      disabled={isSubmitting}
                    />
                    <span className="text-sm text-[#1a1a1a] leading-snug">{opt}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#8c8a84] mb-1">
              {t('ai.intent.extra_section')}
            </div>
            <textarea
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              disabled={isSubmitting}
              rows={2}
              placeholder={t('ai.intent.extra_placeholder')}
              className="w-full rounded-lg border border-[#E6E4DF] bg-white px-3 py-2 text-sm text-[#1a1a1a] placeholder:text-[#a8a6a0] focus:outline-none focus:ring-1 focus:ring-[#C2410C]/40 disabled:opacity-50 resize-y min-h-[64px]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-[#E6E4DF] bg-[#FAF9F6]">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-sm font-medium text-[#5a5a54] hover:bg-[#EAE7E2] disabled:opacity-50"
          >
            {t('ai.intent.cancel')}
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={() => {
              if (selected === null) return;
              const base = options[selected];
              const tail = extra.trim();
              const merged = tail
                ? `${base}\n\n${t('ai.intent.extra_section')}：${tail}`
                : base;
              onConfirm(merged);
            }}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-[#C2410C] hover:bg-[#a33508] disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : null}
            {t('ai.intent.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
