import { useTranslation } from 'react-i18next';
import { Settings, X, Sparkles } from 'lucide-react';
import { MIMO_TOKEN_PLAN_BASE_URL } from '../constants/mimo';

export interface AIConfig {
  provider: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  metasoApiKey?: string;
}

export interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AIConfig;
  setConfig: React.Dispatch<React.SetStateAction<AIConfig>>;
}

export function AISettingsModal({ isOpen, onClose, config, setConfig }: AISettingsModalProps) {
  const { t, i18n } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-[#E6E4DF] flex items-center justify-between bg-[#F4F1ED]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] flex items-center justify-center text-[#C2410C]">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-[#1a1a1a]">{t('settings.title')}</h2>
              <p className="text-[10px] text-[#8c8a84] uppercase tracking-widest font-mono">{t('settings.ai_config')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#EAE7E2] rounded-full transition-colors">
            <X className="w-5 h-5 text-[#8c8a84]" />
          </button>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Language selection */}
          <div className="space-y-3">
            <label className="text-[10px] font-mono font-bold text-[#8c8a84] uppercase tracking-wider">{t('settings.language')}</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => { i18n.changeLanguage('en'); localStorage.setItem('app_language', 'en'); }}
                className={`flex items-center justify-center gap-2 h-10 px-4 rounded-lg border transition-all text-sm font-bold ${i18n.language === 'en' ? 'border-[#C2410C] bg-[#C2410C]/5 text-[#C2410C]' : 'border-[#E6E4DF] text-[#5a5a54] hover:border-[#C2410C]/30'}`}
              >
                English
              </button>
              <button 
                onClick={() => { i18n.changeLanguage('zh'); localStorage.setItem('app_language', 'zh'); }}
                className={`flex items-center justify-center gap-2 h-10 px-4 rounded-lg border transition-all text-sm font-bold ${i18n.language === 'zh' ? 'border-[#C2410C] bg-[#C2410C]/5 text-[#C2410C]' : 'border-[#E6E4DF] text-[#5a5a54] hover:border-[#C2410C]/30'}`}
              >
                中文
              </button>
            </div>
          </div>

          <div className="h-px bg-[#F4F1ED]"></div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <label className="text-[10px] font-mono font-bold text-[#8c8a84] uppercase tracking-wider">{t('settings.provider')}</label>
                 <select 
                   className="w-full h-10 px-3 bg-[#FAF9F6] border border-[#E6E4DF] rounded-lg text-sm outline-none focus:border-[#C2410C] focus:ring-1 focus:ring-[#C2410C] transition-all"
                   value={config.provider}
                   onChange={e => {
                     const newProvider = e.target.value;
                     const defaults: Record<string, { model: string; baseUrl: string }> = {
                       gemini: { model: 'gemini-1.5-flash', baseUrl: '' },
                       openai: { model: 'gpt-4o', baseUrl: '' },
                       anthropic: { model: 'claude-3-5-sonnet-20240620', baseUrl: '' },
                       mimo: { model: 'mimo-v2.5-pro', baseUrl: MIMO_TOKEN_PLAN_BASE_URL },
                       custom: { model: 'gpt-4o', baseUrl: '' }
                     };
                     const d = defaults[newProvider] || { model: '', baseUrl: '' };
                     setConfig({ ...config, provider: newProvider, model: d.model, baseUrl: d.baseUrl });
                   }}
                 >
                   <option value="gemini">Google Gemini</option>
                   <option value="openai">OpenAI (GPT)</option>
                   <option value="anthropic">Anthropic (Claude)</option>
                   <option value="mimo">MiMo (小米大模型)</option>
                   <option value="custom">Custom Endpoint</option>
                 </select>
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-mono font-bold text-[#8c8a84] uppercase tracking-wider">{t('settings.model')}</label>
                 <input 
                   type="text"
                   className="w-full h-10 px-3 bg-[#FAF9F6] border border-[#E6E4DF] rounded-lg text-sm outline-none focus:border-[#C2410C] focus:ring-1 focus:ring-[#C2410C] transition-all"
                   placeholder={config.provider === 'gemini' ? 'gemini-1.5-flash' : config.provider === 'mimo' ? 'mimo-v2.5-pro' : 'gpt-4o'}
                   value={config.model}
                   onChange={e => setConfig({ ...config, model: e.target.value })}
                 />
               </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono font-bold text-[#8c8a84] uppercase tracking-wider">{t('settings.api_key')}</label>
              <input 
                type="password"
                className="w-full h-10 px-3 bg-[#FAF9F6] border border-[#E6E4DF] rounded-lg text-sm outline-none focus:border-[#C2410C] focus:ring-1 focus:ring-[#C2410C] transition-all"
                placeholder="sk-..."
                value={config.apiKey}
                onChange={e => setConfig({ ...config, apiKey: e.target.value })}
              />
            </div>

            {(config.provider === 'custom' || config.provider === 'openai' || config.provider === 'mimo') && (
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold text-[#8c8a84] uppercase tracking-wider">{t('settings.base_url')}</label>
                <input
                  type="text"
                  className="w-full h-10 px-3 bg-[#FAF9F6] border border-[#E6E4DF] rounded-lg text-sm outline-none focus:border-[#C2410C] focus:ring-1 focus:ring-[#C2410C] transition-all"
                  placeholder={config.provider === 'mimo' ? MIMO_TOKEN_PLAN_BASE_URL : 'https://api.openai.com/v1'}
                  value={config.baseUrl}
                  onChange={e => setConfig({ ...config, baseUrl: e.target.value })}
                />
              </div>
            )}
          </div>

          <div className="h-px bg-[#F4F1ED]"></div>

          {/* Metaso Search API Key (optional) */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono font-bold text-[#8c8a84] uppercase tracking-wider">{t('settings.metaso_key')}</label>
            <input
              type="password"
              className="w-full h-10 px-3 bg-[#FAF9F6] border border-[#E6E4DF] rounded-lg text-sm outline-none focus:border-[#C2410C] focus:ring-1 focus:ring-[#C2410C] transition-all"
              placeholder="sk-metaso-..."
              value={config.metasoApiKey ?? ''}
              onChange={e => setConfig({ ...config, metasoApiKey: e.target.value })}
            />
            <p className="text-[10px] text-[#8c8a84] leading-relaxed">{t('settings.metaso_key_hint')}</p>
          </div>
          
          <div className="p-4 bg-[#F4F1ED] rounded-xl border border-[#E6E4DF] border-dashed">
            <div className="flex gap-3">
              <Sparkles className="w-4 h-4 text-[#C2410C] flex-shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed text-[#5a5a54]">
                {t('settings.save_success')}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-[#E6E4DF] bg-white flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-2.5 bg-[#1a1a1a] text-white rounded-xl font-sans font-bold hover:bg-[#333] transition-all text-sm shadow-md"
          >
            {t('settings.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
