/**
 * Blur persistence: note/article text written to IndexedDB when a field loses focus.
 *
 * `DISABLE_CONTENT_BLUR_PERSISTENCE_PROJECT`: set to `false` in this file to restore blur saving for all users.
 * When project default is “off”, re-enable in browser: `localStorage.setItem('SCRIBE_DISABLE_CONTENT_AUTOSAVE','0')` then reload.
 *
 * Alternatively use `VITE_DISABLE_CONTENT_AUTOSAVE=true` in `.env` when the project default is `false`.
 */
export const DISABLE_CONTENT_BLUR_PERSISTENCE_PROJECT = true;

export function isContentBlurPersistenceDisabled(): boolean {
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('SCRIBE_DISABLE_CONTENT_AUTOSAVE') === '0') {
      return false;
    }
  } catch {
    // ignore
  }
  if (DISABLE_CONTENT_BLUR_PERSISTENCE_PROJECT) return true;
  if (import.meta.env.VITE_DISABLE_CONTENT_AUTOSAVE === 'true') return true;
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem('SCRIBE_DISABLE_CONTENT_AUTOSAVE') === '1';
  } catch {
    return false;
  }
}
