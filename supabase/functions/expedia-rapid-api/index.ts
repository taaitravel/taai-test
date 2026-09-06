import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
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

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
const rapidApiKey = Deno.env.get('RAPID_API_KEY');

// Only a path from the allow-list plus string params are accepted. A
// caller-supplied absolute URL is never used as the request target.
const expediaRequestSchema = z.object({
  endpoint: z.string().min(1).max(500),
  params: z.record(z.string()).optional().default({}),
});

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
    // Anon-key client: the JWT is verified server-side and the user id comes
    // only from the verified token.
    const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const auth = await authenticate(req, async (token) => {
      const { data, error } = await supabase.auth.getUser(token);
      return { userId: error || !data?.user ? null : data.user.id };
    });
    if (!auth.ok) return json({ error: auth.error }, auth.status);

    if (!allowRequest(`expedia:${auth.userId}`)) {
      return json({ error: 'Too many requests. Please retry shortly.' }, 429);
    }

    if (!rapidApiKey) {
      console.error('RAPID_API_KEY not configured');
      return json({ error: 'Service configuration error' }, 500);
    }

    const parsedBody = await readBoundedJson(req);
    if (!parsedBody.ok) return json({ error: parsedBody.error }, 400);

    let validatedData;
    try {
      validatedData = expediaRequestSchema.parse(
        stripCallerIdentity((parsedBody.value ?? {}) as Record<string, unknown>),
      );
    } catch {
      return json({ error: 'Invalid input parameters' }, 400);
    }

    const target = resolveProviderUrl('expedia', validatedData.endpoint, validatedData.params);
    if (!target.ok) return json({ error: target.error }, target.status);

    const upstream = await fetchUpstreamJson(target.url.toString(), {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'expedia13.p.rapidapi.com',
      },
    });

    if (!upstream.ok) {
      console.error('Expedia upstream error status:', upstream.status);
      return json({ error: upstream.error }, upstream.status === 504 ? 504 : 502);
    }

    const shaped = shapeProviderPayload(target.path, upstream.data, 'expedia');
    const bounded = serializeBounded(shaped);
    if (!bounded.ok) return json({ error: bounded.error }, bounded.status);
    return new Response(bounded.body, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (_error) {
    console.error('Expedia proxy failed');
    return json({ error: 'Unable to process API request. Please try again.' }, 500);
  }
});
