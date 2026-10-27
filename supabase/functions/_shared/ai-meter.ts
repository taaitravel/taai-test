import { planLimitCodeFromText, type PlanLimitCode } from './plan-limits.ts';

/** -1 is the successful unlimited-tier sentinel. Any other non-positive balance is a block. */
export const UNLIMITED_REMAINING = -1;

export type CreditAllowance =
  | {
      ok: true;
      /** Credits left after this turn. -1 means the tier is unlimited. 0 means this turn spent the last included credit. */
      remaining: number;
      usageId: string | null;
      creditsCharged: number;
    }
  | {
      ok: false;
      /** exhausted: balance is already at or below 0. unavailable: the check itself failed. */
      reason: 'exhausted' | 'unavailable';
    };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const finiteInteger = (value: unknown): number | null => {
  const numeric = typeof value === 'number'
    ? value
    : typeof value === 'string' && value.trim() !== ''
      ? Number(value.trim())
      : NaN;
  if (!Number.isFinite(numeric) || !Number.isInteger(numeric)) return null;
  return numeric;
};

const usageIdFrom = (value: unknown): string | null =>
  typeof value === 'string' && UUID_RE.test(value) ? value : null;

const unwrapRpcData = (data: unknown): unknown => {
  if (typeof data !== 'string') return data;
  const trimmed = data.trim();
  if (!trimmed.startsWith('{')) return trimmed;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return trimmed;
  }
};

/**
 * Legacy consume_ai_credit returned a bare integer: -1 unlimited, >0 remaining
 * after a charge, and 0 for both "already out" and "this was the last credit".
 * Those two zeros cannot be told apart, so a non-positive integer blocks.
 */
const legacyNumberGate = (remaining: number): CreditAllowance => {
  if (remaining === UNLIMITED_REMAINING) {
    return { ok: true, remaining: UNLIMITED_REMAINING, usageId: null, creditsCharged: 0 };
  }
  if (remaining <= 0) return { ok: false, reason: 'exhausted' };
  return { ok: true, remaining, usageId: null, creditsCharged: 1 };
};

/**
 * Interpret consume_ai_credit. A transport error, missing payload, or
 * unexpected shape fails closed. Unlimited is allowed only when the RPC
 * succeeded and explicitly reported the -1 sentinel.
 */
export const interpretCreditRpc = (input: { failed: boolean; data: unknown }): CreditAllowance => {
  if (input.failed) return { ok: false, reason: 'unavailable' };

  const data = unwrapRpcData(input.data);
  if (typeof data === 'number' || typeof data === 'string') {
    const remaining = finiteInteger(data);
    if (remaining == null) return { ok: false, reason: 'unavailable' };
    return legacyNumberGate(remaining);
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { ok: false, reason: 'unavailable' };
  }

  const record = data as Record<string, unknown>;
  const remaining = finiteInteger(record.remaining);
  if (remaining == null) return { ok: false, reason: 'unavailable' };
  const usageId = usageIdFrom(record.usage_id);

  if (record.ok === true && remaining === UNLIMITED_REMAINING) {
    return { ok: true, remaining, usageId, creditsCharged: 0 };
  }
  if (record.ok === true && remaining >= 0) {
    const charged = finiteInteger(record.credits_charged);
    return {
      ok: true,
      remaining,
      usageId,
      creditsCharged: charged == null ? 1 : Math.max(charged, 0),
    };
  }
  if (record.ok === false) return { ok: false, reason: 'exhausted' };
  if (record.ok == null) {
    const gate = legacyNumberGate(remaining);
    return gate.ok ? { ...gate, usageId } : gate;
  }
  return { ok: false, reason: 'unavailable' };
};

export const creditDenial = (gate: Extract<CreditAllowance, { ok: false }>) => {
  if (gate.reason === 'exhausted') {
    return {
      status: 402,
      body: {
        error: 'You have used this month\'s planning credits.',
        code: 'PLAN_LIMIT_AI' as const,
        remaining: 0,
        upgrade_url: '/subscription?limit=PLAN_LIMIT_AI',
      },
    };
  }
  return {
    status: 503,
    body: {
      error: 'Planning credits could not be verified. Please try again.',
      code: 'AI_CREDIT_CHECK_FAILED' as const,
    },
  };
};

export type TokenUsage = {
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
};

const MAX_TOKEN_COUNT = 50_000_000;

const tokenCount = (...values: unknown[]): number | null => {
  for (const value of values) {
    const numeric = typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim() !== ''
        ? Number(value.trim())
        : NaN;
    if (Number.isFinite(numeric) && numeric >= 0 && numeric <= MAX_TOKEN_COUNT) {
      return Math.round(numeric);
    }
  }
  return null;
};

const usageRecord = (payload: unknown): Record<string, unknown> | null => {
  if (!payload || typeof payload !== 'object') return null;
  const body = payload as Record<string, unknown>;
  const usage = body.usage ?? body.usageMetadata;
  if (!usage || typeof usage !== 'object' || Array.isArray(usage)) return null;
  return usage as Record<string, unknown>;
};

/** Read an OpenAI-compatible or Gemini usage object from one gateway response. */
export const tokenUsageFromGateway = (payload: unknown): TokenUsage | null => {
  const usage = usageRecord(payload);
  if (!usage) return null;
  const promptTokens = tokenCount(usage.prompt_tokens, usage.input_tokens, usage.promptTokenCount);
  const completionTokens = tokenCount(
    usage.completion_tokens,
    usage.output_tokens,
    usage.candidatesTokenCount,
  );
  const totalTokens = tokenCount(usage.total_tokens, usage.totalTokenCount)
    ?? (promptTokens != null && completionTokens != null ? promptTokens + completionTokens : null);
  if (promptTokens == null && completionTokens == null && totalTokens == null) return null;
  return { promptTokens, completionTokens, totalTokens };
};

const sumCount = (left: number | null, right: number | null): number | null => {
  if (left == null && right == null) return null;
  return (left ?? 0) + (right ?? 0);
};

/** One planning credit covers the whole turn, including the tool follow-up call. */
export const addTokenUsage = (left: TokenUsage | null, right: TokenUsage | null): TokenUsage | null => {
  if (!left) return right;
  if (!right) return left;
  return {
    promptTokens: sumCount(left.promptTokens, right.promptTokens),
    completionTokens: sumCount(left.completionTokens, right.completionTokens),
    totalTokens: sumCount(left.totalTokens, right.totalTokens),
  };
};

/** Null when the turn was not charged (unlimited) or the gateway omitted a total. */
export const tokensPerCredit = (usage: TokenUsage | null, creditsCharged: number): number | null => {
  if (!usage || usage.totalTokens == null || !(creditsCharged > 0)) return null;
  return usage.totalTokens / creditsCharged;
};

export const assistantErrorPresentation = (
  body: unknown,
  fallbackMessage?: string,
): { kind: 'upgrade'; code: PlanLimitCode } | { kind: 'message'; message: string } => {
  const record = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const code = planLimitCodeFromText(record.code)
    ?? planLimitCodeFromText(record.error)
    ?? planLimitCodeFromText(fallbackMessage);
  if (code) return { kind: 'upgrade', code };
  if (typeof record.error === 'string' && record.error.trim()) {
    return { kind: 'message', message: record.error.trim() };
  }
  return { kind: 'message', message: 'Failed to send message. Please try again.' };
};
