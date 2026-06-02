/**
 * Volcengine Ark (火山方舟) OpenAI-compatible API for Doubao models.
 * Chat endpoint: {DOUBAO_ARK_BASE_URL}/chat/completions
 */
export const DOUBAO_ARK_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';

/** Ark inference endpoint ID (控制台「推理接入点」). Used as the `model` field in chat/completions. */
export const DOUBAO_DEFAULT_MODEL = 'ep-20260218175314-xrnrn';

/**
 * Optional hosted Doubao key baked in at build time (Vite: VITE_BUILTIN_DOUBAO_API_KEY).
 * WARNING: visible in the shipped JS bundle — only for low-friction demos; rotate if leaked.
 */
export function getBuiltinDoubaoApiKey(): string {
  const raw = import.meta.env.VITE_BUILTIN_DOUBAO_API_KEY;
  return typeof raw === 'string' ? raw.trim() : '';
}

export function hasBuiltinDoubaoApiKey(): boolean {
  return getBuiltinDoubaoApiKey().length > 0;
}

/** User key wins; otherwise built-in key when configured. */
export function resolveDoubaoApiKey(userKey?: string): string {
  const user = (userKey ?? '').trim();
  if (user) return user;
  return getBuiltinDoubaoApiKey();
}
