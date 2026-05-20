import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, ChevronUp, Loader2, X } from 'lucide-react';
import { buildIntentClarifiedRequest } from '../utils/buildIntentClarifiedRequest';

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
  const [selected, setSelected] = useState<number[]>([]);
  const [extraOpen, setExtraOpen] = useState(false);
  const [extra, setExtra] = useState('');

  useEffect(() => {
    if (open) {
      setSelected([]);
      setExtra('');
      setExtraOpen(false);
    }
  }, [open, original]);

  const toggle = (index: number) => {
    setSelected((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index].sort((a, b) => a - b),
    );
  };

  const submitSelected = () => {
    if (selected.length === 0) return;
    const picked = selected.map((i) => options[i]);
    const merged = buildIntentClarifiedRequest(original, picked, extra, {
      selectedIntro: t('ai.intent.selected_intro'),
      extraSection: t('ai.intent.extra_section'),
    });
    onConfirm(merged);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onCancel();
      if (e.key === 'Enter' && selected.length > 0 && !isSubmitting) {
        e.preventDefault();
        submitSelected();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, selected, isSubmitting, extra, options, original, onCancel, onConfirm, t]);

  if (!open) return null;

  const canConfirm = selected.length > 0 && !isSubmitting;

  return (
    <div
      role="region"
      aria-labelledby="intent-clarify-title"
      className="mb-2 w-full animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <div className="rounded-xl border border-[#E6E4DF]/90 bg-white/95 backdrop-blur-md shadow-lg shadow-[#1a1a1a]/5 overflow-hidden">
        <div className="flex items-start gap-2 px-3 py-2 border-b border-[#F4F1ED]/80">
          <p
            id="intent-clarify-title"
            className="flex-1 text-[11px] leading-snug text-[#8c8a84] pt-0.5"
          >
            {hint || t('ai.intent.panel_hint')}
          </p>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="shrink-0 p-1 rounded-md text-[#a8a6a0] hover:text-[#5a5a54] hover:bg-[#F4F1ED] disabled:opacity-50"
            aria-label={t('ai.intent.cancel')}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <ul
          className="py-1.5 px-1.5 space-y-0.5"
          aria-label={t('ai.intent.modal_choose')}
        >
          {options.map((opt, i) => {
            const isChecked = selected.includes(i);
            return (
              <li key={i}>
                <label
                  className={`flex items-start gap-2.5 cursor-pointer rounded-lg px-2.5 py-2 transition-colors ${
                    isChecked
                      ? 'bg-[#FFF7ED]/80 ring-1 ring-[#C2410C]/25'
                      : 'hover:bg-[#F4F1ED]/70'
                  } ${isSubmitting ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={isChecked}
                    disabled={isSubmitting}
                    onChange={() => toggle(i)}
                  />
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                      isChecked
                        ? 'border-[#C2410C] bg-[#C2410C] text-white'
                        : 'border-[#D4D2CC] bg-white'
                    }`}
                    aria-hidden
                  >
                    {isChecked ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : null}
                  </span>
                  <span className="text-xs text-[#1a1a1a] leading-snug">{opt}</span>
                </label>
              </li>
            );
          })}
        </ul>

        <div className="px-2.5 pb-2 flex flex-col gap-1.5 border-t border-[#F4F1ED]/80">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => setExtraOpen((v) => !v)}
            className="flex items-center gap-1 text-[10px] font-medium text-[#8c8a84] hover:text-[#5a5a54] disabled:opacity-50 self-start px-0.5 py-1"
          >
            {extraOpen ? (
              <ChevronUp className="w-3 h-3" aria-hidden />
            ) : (
              <ChevronDown className="w-3 h-3" aria-hidden />
            )}
            {t('ai.intent.extra_toggle')}
          </button>
          {extraOpen ? (
            <textarea
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              disabled={isSubmitting}
              rows={2}
              placeholder={t('ai.intent.extra_placeholder')}
              className="w-full rounded-lg border border-[#E6E4DF] bg-[#FAF9F6]/80 px-2.5 py-1.5 text-xs text-[#1a1a1a] placeholder:text-[#a8a6a0] focus:outline-none focus:ring-1 focus:ring-[#C2410C]/30 disabled:opacity-50 resize-none"
            />
          ) : null}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <span className="text-[10px] text-[#a8a6a0]">
              {selected.length > 0
                ? t('ai.intent.selected_count', { count: selected.length })
                : t('ai.intent.select_at_least_one')}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="text-[11px] text-[#8c8a84] hover:text-[#5a5a54] disabled:opacity-50 px-1"
              >
                {t('ai.intent.cancel')}
              </button>
              <button
                type="button"
                disabled={!canConfirm}
                onClick={submitSelected}
                className="text-[11px] font-bold text-[#C2410C] hover:text-[#a0350a] disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 px-1"
              >
                {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" aria-hidden /> : null}
                {t('ai.intent.confirm')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
