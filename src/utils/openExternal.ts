/** Open URL in system browser (Tauri) or new tab (browser dev). */
export async function openExternalUrl(url: string): Promise<void> {
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    console.warn('[Scribe AI] openExternalUrl skipped non-http(s) URL');
    return;
  }

  const isTauri =
    typeof window !== 'undefined' &&
    Object.prototype.hasOwnProperty.call(window, '__TAURI_INTERNALS__');

  if (isTauri) {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('open_external_url', { url: trimmed });
    return;
  }

  window.open(trimmed, '_blank', 'noopener,noreferrer');
}
