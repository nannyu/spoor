import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getBuiltinDoubaoApiKey,
  hasBuiltinDoubaoApiKey,
  resolveDoubaoApiKey,
} from '../../src/constants/doubao';

describe('doubao builtin API key', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('resolveDoubaoApiKey prefers user key over builtin', () => {
    vi.stubEnv('VITE_BUILTIN_DOUBAO_API_KEY', 'ark-builtin');
    expect(resolveDoubaoApiKey('ark-user')).toBe('ark-user');
  });

  it('resolveDoubaoApiKey falls back to builtin when user empty', () => {
    vi.stubEnv('VITE_BUILTIN_DOUBAO_API_KEY', 'ark-builtin');
    expect(resolveDoubaoApiKey('')).toBe('ark-builtin');
    expect(resolveDoubaoApiKey('   ')).toBe('ark-builtin');
  });

  it('hasBuiltinDoubaoApiKey is false when env unset', () => {
    vi.stubEnv('VITE_BUILTIN_DOUBAO_API_KEY', '');
    expect(getBuiltinDoubaoApiKey()).toBe('');
    expect(hasBuiltinDoubaoApiKey()).toBe(false);
    expect(resolveDoubaoApiKey('')).toBe('');
  });
});
