import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { authenticateCronRequest } from "../_shared/cron-auth.ts";
import { adminClient, purgeClosedAccount, stripeClient } from "../_shared/account-service.ts";

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const unauthorized = authenticateCronRequest(req);
  if (unauthorized) return unauthorized;

  const admin = adminClient();
  const stripe = stripeClient();
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from('account_closures')
    .select('user_id')
    .is('reopened_at', null)
    .lte('purge_after', now);
  if (error) return new Response(JSON.stringify({ error: 'Could not list closed accounts' }), { status: 500 });

  const results: Array<{ userId: string; ok: boolean; error?: string }> = [];
  for (const row of data ?? []) {
    const userId = row.user_id as string;
    try {
      await purgeClosedAccount(admin, stripe, userId);
      results.push({ userId, ok: true });
    } catch (purgeError) {
      console.error('purge failed', purgeError instanceof Error ? purgeError.message : 'error');
      results.push({ userId, ok: false, error: 'purge_failed' });
    }
  }

  const failed = results.filter((result) => !result.ok).length;
  return new Response(JSON.stringify({ purged: results.length - failed, failed }), {
    status: failed ? 500 : 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
