import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { authenticate, buildCorsHeaders, guardOrigin, readBoundedJson } from "../_shared/edge-guard.ts";
import { adminClient, sendWelcomeIfNeeded } from "../_shared/account-service.ts";

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
    const admin = adminClient();
    const auth = await authenticate(req, async (token) => {
      const { data, error } = await admin.auth.getUser(token);
      return { userId: error || !data.user ? null : data.user.id };
    });
    if (!auth.ok) return json({ error: auth.error }, auth.status);
    const token = req.headers.get('Authorization')!.replace('Bearer ', '');
    const { data: userData, error } = await admin.auth.getUser(token);
    if (error || !userData.user?.email) return json({ error: 'Authentication required' }, 401);
    const metadata = userData.user.user_metadata ?? {};
    const name = typeof metadata.first_name === 'string' && metadata.first_name.trim()
      ? metadata.first_name.trim()
      : userData.user.email.split('@')[0];
    const result = await sendWelcomeIfNeeded(admin, {
      id: userData.user.id,
      email: userData.user.email,
      emailConfirmedAt: userData.user.email_confirmed_at ?? null,
      name,
    });
    if (!result.ok) return json({ error: 'Could not send the welcome email.' }, 500);
    return json(result);
  } catch (error) {
    console.error('send-lifecycle-email failed', error instanceof Error ? error.message : 'error');
    return json({ error: 'Could not send the welcome email.' }, 500);
  }
});
