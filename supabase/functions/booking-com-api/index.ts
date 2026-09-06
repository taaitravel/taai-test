import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3"
import {
  capGenericProviderPayload,
  normalizeHotelDetail,
  normalizeHotelSearchResponse,
} from "../_shared/hotel-contract.ts";
import {
  allowRequest,
  buildCorsHeaders,
  fetchUpstreamJson,
  readBoundedJson,
} from "../_shared/edge-guard.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
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
  const corsHeaders = buildCorsHeaders(req.headers.get('origin'));
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Authentication required' }, 401);

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) return json({ error: 'Unauthorized' }, 401);

    if (!allowRequest(`booking:${user.id}`)) {
      return json({ error: 'Too many requests. Please retry shortly.' }, 429);
    }

    const parsedBody = await readBoundedJson(req);
    if (!parsedBody.ok) return json({ error: parsedBody.error }, 400);
    const payload = (parsedBody.value ?? {}) as Record<string, unknown>;
    const endpoint = typeof payload.endpoint === 'string' ? payload.endpoint : '';
    const method = payload.method === 'POST' ? 'POST' : 'GET';
    const params = (payload.params && typeof payload.params === 'object' ? payload.params : {}) as Record<string, unknown>;
    const body = payload.body ?? null;

    // SSRF protection — only allow the booking.com RapidAPI host
    const ALLOWED_HOSTS = ['booking-com15.p.rapidapi.com'];
    let parsed: URL;
    try {
      parsed = new URL(endpoint);
    } catch {
      return json({ error: 'Invalid endpoint' }, 400);
    }
    if (!ALLOWED_HOSTS.includes(parsed.hostname) || parsed.protocol !== 'https:') {
      return json({ error: 'Forbidden host' }, 403);
    }

    const url = parsed
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        url.searchParams.append(key, String(value))
      }
    })

    const headers: Record<string, string> = {
      'x-rapidapi-host': 'booking-com15.p.rapidapi.com',
      'x-rapidapi-key': rapidApiKey,
    }
    if (method === 'POST' && body) headers['Content-Type'] = 'application/json'

    const upstream = await fetchUpstreamJson(url.toString(), {
      method,
      headers,
      body: method === 'POST' && body ? JSON.stringify(body) : undefined,
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

    const shaped = shapeProviderPayload(parsed.pathname, upstream.data, 'booking.com')
    return json(shaped);
  } catch (_error) {
    console.error('🏨 Booking.com proxy failed');
    return json({ error: 'Unable to process request. Please try again.' }, 400);
  }
})
