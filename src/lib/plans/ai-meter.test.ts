import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  addTokenUsage,
  assistantErrorPresentation,
  creditDenial,
  interpretCreditRpc,
  tokenUsageFromGateway,
  tokensPerCredit,
} from '../../../supabase/functions/_shared/ai-meter';

const USAGE_ID = '11111111-1111-4111-8111-111111111111';

describe('AI credit gate', () => {
  it('fails closed when the check errors or the payload is unusable', () => {
    for (const data of [null, undefined, 'nope', {}, { ok: true }, { remaining: 1.5 }, { ok: true, remaining: -4 }]) {
      expect(interpretCreditRpc({ failed: false, data })).toEqual({ ok: false, reason: 'unavailable' });
    }
    expect(interpretCreditRpc({ failed: true, data: -1 })).toEqual({ ok: false, reason: 'unavailable' });
    expect(interpretCreditRpc({ failed: true, data: { ok: true, remaining: -1 } })).toEqual({
      ok: false,
      reason: 'unavailable',
    });
    expect(creditDenial({ ok: false, reason: 'unavailable' })).toMatchObject({
      status: 503,
      body: { code: 'AI_CREDIT_CHECK_FAILED' },
    });
  });

  it('blocks a balance that is already at or below zero and still allows the last included credit', () => {
    expect(interpretCreditRpc({ failed: false, data: 0 })).toEqual({ ok: false, reason: 'exhausted' });
    expect(interpretCreditRpc({ failed: false, data: -2 })).toEqual({ ok: false, reason: 'exhausted' });
    expect(interpretCreditRpc({
      failed: false,
      data: { ok: false, remaining: 0, credits_charged: 0 },
    })).toEqual({ ok: false, reason: 'exhausted' });
    expect(interpretCreditRpc({
      failed: false,
      data: { ok: false, remaining: -1 },
    })).toEqual({ ok: false, reason: 'exhausted' });

    expect(interpretCreditRpc({
      failed: false,
      data: { ok: true, remaining: 0, usage_id: USAGE_ID, credits_charged: 1 },
    })).toEqual({ ok: true, remaining: 0, usageId: USAGE_ID, creditsCharged: 1 });
    expect(interpretCreditRpc({ failed: false, data: 4 })).toEqual({
      ok: true,
      remaining: 4,
      usageId: null,
      creditsCharged: 1,
    });
    expect(creditDenial({ ok: false, reason: 'exhausted' }).body.code).toBe('PLAN_LIMIT_AI');
  });

  it('treats a successful -1 as unlimited and does not charge a credit', () => {
    expect(interpretCreditRpc({ failed: false, data: -1 })).toMatchObject({
      ok: true,
      remaining: -1,
      creditsCharged: 0,
    });
    expect(interpretCreditRpc({
      failed: false,
      data: JSON.stringify({ ok: true, remaining: -1, usage_id: USAGE_ID, credits_charged: 0 }),
    })).toEqual({ ok: true, remaining: -1, usageId: USAGE_ID, creditsCharged: 0 });
  });

  it('shows the upgrade modal only for a real planning-credit block', () => {
    expect(assistantErrorPresentation({
      code: 'PLAN_LIMIT_AI',
      error: 'You have used this month\'s planning credits.',
    })).toEqual({ kind: 'upgrade', code: 'PLAN_LIMIT_AI' });
    const outage = assistantErrorPresentation({
      code: 'AI_CREDIT_CHECK_FAILED',
      error: 'Planning credits could not be verified. Please try again.',
    });
    expect(outage).toEqual({
      kind: 'message',
      message: 'Planning credits could not be verified. Please try again.',
    });
  });
});

describe('tokens per AI turn and per credit', () => {
  it('reads OpenAI and Gemini usage and sums the follow-up call into the same turn', () => {
    const first = tokenUsageFromGateway({
      model: 'google/gemini-2.5-flash',
      usage: { prompt_tokens: 100, completion_tokens: 40, total_tokens: 140 },
    });
    const followUp = tokenUsageFromGateway({
      usageMetadata: { promptTokenCount: 20, candidatesTokenCount: 10, totalTokenCount: 30 },
    });
    const turn = addTokenUsage(first, followUp);
    expect(turn).toEqual({ promptTokens: 120, completionTokens: 50, totalTokens: 170 });
    expect(tokensPerCredit(turn, 1)).toBe(170);
    expect(tokensPerCredit(turn, 0)).toBeNull();
    expect(tokenUsageFromGateway({ choices: [] })).toBeNull();
  });
});

describe('chat meters every turn before the model', () => {
  const chat = readFileSync('supabase/functions/chat-with-gpt/index.ts', 'utf8');
  const migration = readFileSync('supabase/migrations/20261026234741_ai_turn_credit_metering.sql', 'utf8');

  it('spends the tier credit before the gateway call, including plain chat', () => {
    const spend = chat.indexOf('credit = await consumeAiCredit');
    const gateway = chat.indexOf('https://ai.gateway.lovable.dev');
    expect(spend).toBeGreaterThan(-1);
    expect(spend).toBeLessThan(gateway);
    expect(chat.slice(chat.indexOf('SEARCH_TOOLS.has(functionName)'))).not.toContain('consumeAiCredit');
    expect(chat).toContain('recordAiTurnTokens');
    expect(chat).not.toContain('remaining === 0');
    const usage = readFileSync('supabase/functions/_shared/usage.ts', 'utf8');
    expect(usage).toContain("event: 'ai_turn_usage'");
    expect(usage).toContain('tokens_per_credit');
    expect(usage).toContain('interpretCreditRpc({ failed: true, data: null })');
  });

  it('stores tokens on the credited turn and blocks when this month is already used up', () => {
    expect(migration).toContain('add column if not exists prompt_tokens integer');
    expect(migration).toContain('add column if not exists completion_tokens integer');
    expect(migration).toContain('add column if not exists total_tokens integer');
    expect(migration).toContain('add column if not exists model text');
    expect(migration).toContain('drop constraint if exists usage_tracking_usage_type_check');
    expect(migration).toContain("perform pg_advisory_xact_lock");
    expect(migration).toContain('if used >= lim then');
    expect(migration).toContain("'credits_charged', 1");
    expect(migration).toContain("'credits_charged', 0");
    expect(migration).toContain('function public.record_ai_turn_tokens');
    expect(migration).toContain('function public.release_ai_credit');
    expect(migration).toContain('revoke all on function public.consume_ai_credit(uuid) from public, anon, authenticated');
    expect(migration).not.toMatch(/unit_amount|checkout\.sessions|price_id/i);
  });

  it('keeps travel booking checkout off', () => {
    const checkout = readFileSync('supabase/functions/create-booking-checkout/index.ts', 'utf8');
    expect(checkout).toContain('Deno.env.get("TRAVEL_BOOKING_CHECKOUT_ENABLED") !== "true"');
    expect(checkout).toContain('Travel booking checkout is not available');
  });
});
