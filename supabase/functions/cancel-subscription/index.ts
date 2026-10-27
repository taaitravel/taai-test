import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { authenticate, buildCorsHeaders, guardOrigin, readBoundedJson } from "../_shared/edge-guard.ts";
import { adminClient, cancelAtPeriodEnd, stripeClient } from "../_shared/account-service.ts";

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = buildCorsHeaders(origin);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  const originCheck = guardOrigin(origin);
  if (!originCheck.ok) return json({ error: originCheck.error }, originCheck.status);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const bounded = await readBoundedJson(req);
  if (!bounded.ok) return json({ error: bounded.error }, 400);

  try {
    const stripe = stripeClient();
    if (!stripe) return json({ error: 'Billing is not configured.' }, 500);
    const admin = adminClient();
    const auth = await authenticate(req, async (token) => {
      const { data, error } = await admin.auth.getUser(token);
      return { userId: error || !data.user ? null : data.user.id };
    });
    if (!auth.ok) return json({ error: auth.error }, auth.status);
    const result = await cancelAtPeriodEnd(admin, stripe, auth.userId);
    if (!result.ok) return json({ error: result.error }, result.status);
    return json(result);
  } catch (error) {
    console.error('cancel-subscription failed', error instanceof Error ? error.message : 'error');
    return json({ error: 'Could not cancel the subscription.' }, 500);
  }
});
