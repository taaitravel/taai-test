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
  buildCorsHeaders,
  fetchUpstreamJson,
  readBoundedJson,
} from "../_shared/edge-guard.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const rapidApiKey = Deno.env.get('RAPID_API_KEY');

// Input validation schema
const expediaRequestSchema = z.object({
  endpoint: z.string().url().max(500),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('GET'),
  params: z.record(z.string()).optional().default({}),
  body: z.any().optional()
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
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Authentication required' }, 401);

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) return json({ error: 'Unauthorized' }, 401);

    if (!allowRequest(`expedia:${user.id}`)) {
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
      validatedData = expediaRequestSchema.parse(parsedBody.value);
    } catch {
      return json({ error: 'Invalid input parameters' }, 400);
    }

    const { endpoint, method, params, body } = validatedData;

    // SSRF protection — only allow the Expedia RapidAPI host
    const ALLOWED_HOSTS = ['expedia13.p.rapidapi.com'];
    let parsedEndpoint: URL;
    try {
      parsedEndpoint = new URL(endpoint);
    } catch {
      return json({ error: 'Invalid endpoint' }, 400);
    }
    if (!ALLOWED_HOSTS.includes(parsedEndpoint.hostname) || parsedEndpoint.protocol !== 'https:') {
      return json({ error: 'Forbidden host' }, 403);
    }

    const queryString = new URLSearchParams(params).toString();
    const fullUrl = `${endpoint}${queryString ? '?' + queryString : ''}`;

    const rapidApiHeaders: Record<string, string> = {
      'X-RapidAPI-Key': rapidApiKey,
      'X-RapidAPI-Host': 'expedia13.p.rapidapi.com',
    };
    if (method !== 'GET' && body) rapidApiHeaders['Content-Type'] = 'application/json';

    const upstream = await fetchUpstreamJson(fullUrl, {
      method,
      headers: rapidApiHeaders,
      body: body ? JSON.stringify(body) : null,
    });

    if (!upstream.ok) {
      console.error('Expedia upstream error status:', upstream.status);
      return json({ error: upstream.error }, upstream.status === 504 ? 504 : 502);
    }

    const shaped = shapeProviderPayload(parsedEndpoint.pathname, upstream.data, 'expedia');
    return json(shaped);
  } catch (_error) {
    console.error('Expedia proxy failed');
    return json({ error: 'Unable to process API request. Please try again.' }, 500);
  }
});
