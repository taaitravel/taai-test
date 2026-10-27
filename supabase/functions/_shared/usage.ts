import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import {
  interpretCreditRpc,
  tokensPerCredit,
  type CreditAllowance,
  type TokenUsage,
} from './ai-meter.ts';

/** Best-effort product metric. A missing migration must not take search down. */
export const recordUsage = async (
  userId: string,
  kind: 'search' | 'ai_message' | 'trip_created',
  credits = 0,
): Promise<void> => {
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key || !userId) return;
    const admin = createClient(url, key, { auth: { persistSession: false } });
    const { error } = await admin.rpc('record_usage', { uid: userId, kind, credits });
    if (error) console.error('record_usage skipped', error.message);
  } catch (error) {
    console.error('record_usage skipped', error instanceof Error ? error.message : 'error');
  }
};

const adminClient = () => {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
};

/**
 * Atomically spends one planning credit for this tier, or reports unlimited.
 * Errors fail closed: callers must not run the model when ok is false.
 */
export const consumeAiCredit = async (userId: string): Promise<CreditAllowance> => {
  try {
    const admin = adminClient();
    if (!admin || !userId) return interpretCreditRpc({ failed: true, data: null });
    const { data, error } = await admin.rpc('consume_ai_credit', { uid: userId });
    if (error) {
      console.error('consume_ai_credit unavailable', error.message);
      return interpretCreditRpc({ failed: true, data: null });
    }
    return interpretCreditRpc({ failed: false, data });
  } catch (error) {
    console.error('consume_ai_credit unavailable', error instanceof Error ? error.message : 'error');
    return interpretCreditRpc({ failed: true, data: null });
  }
};

/** Returns a credit when the model never produced a completion. Best-effort. */
export const releaseAiCredit = async (userId: string, usageId: string | null): Promise<void> => {
  if (!userId || !usageId) return;
  try {
    const admin = adminClient();
    if (!admin) return;
    const { error } = await admin.rpc('release_ai_credit', { uid: userId, usage_id: usageId });
    if (error) console.error('release_ai_credit skipped', error.message);
  } catch (error) {
    console.error('release_ai_credit skipped', error instanceof Error ? error.message : 'error');
  }
};

/**
 * Logs tokens for the turn and, when this turn spent a credit, tokens per credit.
 * Persistence is best-effort; the structured log is written either way.
 */
export const recordAiTurnTokens = async (input: {
  userId: string;
  usageId: string | null;
  creditsCharged: number;
  usage: TokenUsage | null;
  model: string | null;
}): Promise<void> => {
  const perCredit = tokensPerCredit(input.usage, input.creditsCharged);
  console.log(JSON.stringify({
    event: 'ai_turn_usage',
    user_id: input.userId,
    usage_id: input.usageId,
    credits_charged: input.creditsCharged,
    prompt_tokens: input.usage?.promptTokens ?? null,
    completion_tokens: input.usage?.completionTokens ?? null,
    total_tokens: input.usage?.totalTokens ?? null,
    tokens_per_credit: perCredit,
    model: input.model,
  }));
  if (!input.userId || !input.usageId || !input.usage) return;
  try {
    const admin = adminClient();
    if (!admin) return;
    const { error } = await admin.rpc('record_ai_turn_tokens', {
      uid: input.userId,
      usage_id: input.usageId,
      p_prompt_tokens: input.usage.promptTokens,
      p_completion_tokens: input.usage.completionTokens,
      p_total_tokens: input.usage.totalTokens,
      p_model: input.model,
    });
    if (error) console.error('record_ai_turn_tokens skipped', error.message);
  } catch (error) {
    console.error('record_ai_turn_tokens skipped', error instanceof Error ? error.message : 'error');
  }
};
