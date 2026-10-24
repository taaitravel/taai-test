import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { authenticate, buildCorsHeaders, guardOrigin, readBoundedJson } from "../_shared/edge-guard.ts";
import { PUBLISHED_LIMITS, normalizeTier } from "../_shared/tier-map.ts";

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

  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  );
  const auth = await authenticate(req, async (token) => {
    const { data, error } = await admin.auth.getUser(token);
    return { userId: error || !data?.user ? null : data.user.id };
  });
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const { data: roles } = await admin.from('user_roles').select('role').eq('user_id', auth.userId);
  if (!(roles ?? []).some((row: { role: string }) => row.role === 'admin')) {
    return json({ error: 'Admin access required' }, 403);
  }

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const activeSince = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: subscribers }, { data: users }, { data: usage }, { count: tripCount }] = await Promise.all([
    admin.from('subscribers').select('user_id, email, subscription_tier, subscribed'),
    admin.from('users').select('userid, email, utm_source, last_active_at, created_at').limit(500),
    admin.from('usage_tracking').select('user_id, usage_type, credits_used, created_at').gte('created_at', monthStart.toISOString()).limit(5000),
    admin.from('itinerary').select('id', { count: 'exact', head: true }),
  ]);

  const tripsByUser = new Map<string, number>();
  const { data: tripRows } = await admin.from('itinerary').select('userid').limit(5000);
  for (const row of tripRows ?? []) {
    if (!row.userid) continue;
    tripsByUser.set(row.userid, (tripsByUser.get(row.userid) ?? 0) + 1);
  }

  const usageByUser = new Map<string, { ai: number; searches: number; messages: number }>();
  for (const row of usage ?? []) {
    const bucket = usageByUser.get(row.user_id) ?? { ai: 0, searches: 0, messages: 0 };
    if (row.usage_type === 'ai_turn') bucket.ai += row.credits_used || 0;
    if (row.usage_type === 'search') bucket.searches += 1;
    if (row.usage_type === 'ai_message') bucket.messages += 1;
    usageByUser.set(row.user_id, bucket);
  }

  const tierOf = new Map<string, string>();
  const counts: Record<string, number> = {};
  for (const row of subscribers ?? []) {
    const tier = normalizeTier(row.subscription_tier) ?? 'traveler';
    if (row.user_id) tierOf.set(row.user_id, tier);
    counts[tier] = (counts[tier] ?? 0) + 1;
  }

  const rows = (users ?? []).map((user: {
    userid: string;
    email: string | null;
    utm_source: string | null;
    last_active_at: string | null;
    created_at: string | null;
  }) => {
    const tier = tierOf.get(user.userid) ?? 'traveler';
    const limits = PUBLISHED_LIMITS[tier];
    const used = usageByUser.get(user.userid) ?? { ai: 0, searches: 0, messages: 0 };
    const trips = tripsByUser.get(user.userid) ?? 0;
    const tripRatio = limits.maxItineraries < 0 ? 0 : trips / limits.maxItineraries;
    const creditRatio = limits.monthlyAiCredits < 0 ? 0 : used.ai / limits.monthlyAiCredits;
    return {
      user_id: user.userid,
      email: user.email,
      tier,
      signup_source: user.utm_source,
      last_active_at: user.last_active_at,
      created_at: user.created_at,
      trips,
      ai_credits_used: used.ai,
      ai_messages: used.messages,
      searches: used.searches,
      near_limit: tripRatio >= 0.8 || creditRatio >= 0.8,
    };
  });

  const activeUsers = rows.filter((row) => row.last_active_at && row.last_active_at >= activeSince).length;
  return json({
    generated_at: new Date().toISOString(),
    users_by_tier: counts,
    active_users_30d: activeUsers,
    trips_total: tripCount ?? 0,
    users: rows.sort((a, b) => b.ai_credits_used - a.ai_credits_used || b.trips - a.trips).slice(0, 200),
    power_users: rows.filter((row) => row.near_limit).slice(0, 50),
  });
});
