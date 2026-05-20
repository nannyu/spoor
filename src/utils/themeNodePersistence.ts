import { db } from '../db';
import { isContentBlurPersistenceDisabled } from '../config/persistence';

export type ThemePersistField = 'content' | 'description' | 'themeTag';

export function persistThemeField(nodeId: string, field: ThemePersistField, raw: string): void {
  if (isContentBlurPersistenceDisabled()) return;
  const patch =
    field === 'themeTag'
      ? { themeTag: raw.replace(/\s+/g, ' ').trim() }
      : { [field]: raw };
  void db.nodes.update(nodeId, patch);
}

const DEBOUNCE_MS = 400;

export function createDebouncedThemePersist(nodeId: string) {
  const timers: Partial<Record<ThemePersistField, ReturnType<typeof setTimeout>>> = {};

  return (field: ThemePersistField, raw: string) => {
    const prev = timers[field];
    if (prev) clearTimeout(prev);
    timers[field] = setTimeout(() => persistThemeField(nodeId, field, raw), DEBOUNCE_MS);
  };
}
