import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

/** Best-effort usage row. A missing migration must not take search or chat down. */
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

/** Returns remaining credits after this turn, 0 when blocked, -1 when unlimited or the RPC is not deployed yet. */
export const consumeAiCredit = async (userId: string): Promise<number> => {
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key || !userId) return -1;
    const admin = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await admin.rpc('consume_ai_credit', { uid: userId });
    if (error) {
      console.error('consume_ai_credit unavailable', error.message);
      return -1;
    }
    const remaining = typeof data === 'number' ? data : Number(data);
    return Number.isFinite(remaining) ? remaining : -1;
  } catch (error) {
    console.error('consume_ai_credit unavailable', error instanceof Error ? error.message : 'error');
    return -1;
  }
};
