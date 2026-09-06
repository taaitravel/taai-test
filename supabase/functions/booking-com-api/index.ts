import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3"
import {
  capGenericProviderPayload,
  normalizeHotelDetail,
  normalizeHotelSearchResponse,
} from "../_shared/hotel-contract.ts";
import {
  allowRequest,
  authenticate,
  buildCorsHeaders,
  fetchUpstreamJson,
  guardOrigin,
  readBoundedJson,
  resolveProviderUrl,
  serializeBounded,
  stripCallerIdentity,
} from "../_shared/edge-guard.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const rapidApiKey = Deno.env.get('RAPID_API_KEY')!

/**
 * Egress containment: the browser never receives the full upstream provider
 * response. Hotel search/detail payloads are normalized to the canonical
 * contract (capped at 20 results, affiliate attribution preserved); any other
 * endpoint is array-capped and stripped of raw/debug envelopes. Nothing is
 * persisted and no upstream body is logged.
 */
const shapeProviderPayload = (path: string, upstream: unknown, provider: string) => {
  const p = path.toLowerCase();
  if (p.includes('hotel') && (p.includes('search') || p.includes('list'))) {
    return normalizeHotelSearchResponse(upstream, provider);
  }
  if (p.includes('hotel') && (p.includes('detail') || p.includes('info'))) {
    return normalizeHotelDetail(upstream, provider);
  }
  return capGenericProviderPayload(upstream);
};

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = buildCorsHeaders(origin);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  const originCheck = guardOrigin(origin);
  if (!originCheck.ok) return json({ error: originCheck.error }, originCheck.status);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const auth = await authenticate(req, async (token) => {
      const { data, error } = await supabase.auth.getUser(token);
      return { userId: error || !data?.user ? null : data.user.id };
    });
    if (!auth.ok) return json({ error: auth.error }, auth.status);

    if (!allowRequest(`booking:${auth.userId}`)) {
      return json({ error: 'Too many requests. Please retry shortly.' }, 429);
    }

    const parsedBody = await readBoundedJson(req);
    if (!parsedBody.ok) return json({ error: parsedBody.error }, 400);
    const payload = stripCallerIdentity((parsedBody.value ?? {}) as Record<string, unknown>);
    const params = (payload.params && typeof payload.params === 'object' ? payload.params : {}) as Record<string, unknown>;

    const target = resolveProviderUrl('booking.com', payload.endpoint, params);
    if (!target.ok) return json({ error: target.error }, target.status);

    const upstream = await fetchUpstreamJson(target.url.toString(), {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'booking-com15.p.rapidapi.com',
        'x-rapidapi-key': rapidApiKey,
      },
    });

    if (!upstream.ok) {
      if (upstream.status === 429) {
        return json({
          error: 'QUOTA_EXCEEDED',
          message: 'The Booking.com API quota has been exceeded. Please try again later.',
          statusCode: 429,
        });
      }
      console.error('🏨 Booking.com upstream error status:', upstream.status);
      return json({ error: upstream.error }, upstream.status === 504 ? 504 : 502);
    }

    const shaped = shapeProviderPayload(target.path, upstream.data, 'booking.com')
    const bounded = serializeBounded(shaped);
    if (!bounded.ok) return json({ error: bounded.error }, bounded.status);
    return new Response(bounded.body, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (_error) {
    console.error('🏨 Booking.com proxy failed');
    return json({ error: 'Unable to process request. Please try again.' }, 400);
  }
})
