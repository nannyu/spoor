import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createDebouncedThemePersist, persistThemeField } from '../../src/utils/themeNodePersistence';
import { db } from '../../src/db';

vi.mock('../../src/db', () => ({
  db: { nodes: { update: vi.fn() } },
}));

vi.mock('../../src/config/persistence', () => ({
  isContentBlurPersistenceDisabled: () => false,
}));

describe('themeNodePersistence', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(db.nodes.update).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('persistThemeField 立即写入对应字段', () => {
    persistThemeField('n1', 'description', '研究说明');
    expect(db.nodes.update).toHaveBeenCalledWith('n1', { description: '研究说明' });
  });

  it('createDebouncedThemePersist 在输入后延迟写库', () => {
    const schedule = createDebouncedThemePersist('n1');
    schedule('description', '打字中');
    expect(db.nodes.update).not.toHaveBeenCalled();
    vi.advanceTimersByTime(400);
    expect(db.nodes.update).toHaveBeenCalledWith('n1', { description: '打字中' });
  });
});
