import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import {
  capGenericProviderPayload,
  normalizeHotelDetail,
  normalizeHotelSearchResponse,
} from "../_shared/hotel-contract.ts";


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
 * persisted.
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Expedia RapidAPI function called');

    // Verify user authentication
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('User authenticated:', user.id);

    if (!rapidApiKey) {
      console.error('RAPID_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Service configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate input
    const rawData = await req.json();
    
    let validatedData;
    
    try {
      validatedData = expediaRequestSchema.parse(rawData);
    } catch (validationError) {
      console.error('Validation error:', validationError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input parameters',
          details: validationError instanceof Error ? validationError.message : 'Validation failed',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { endpoint, method, params, body } = validatedData;

    // SSRF protection — only allow the Expedia RapidAPI host
    const ALLOWED_HOSTS = ['expedia13.p.rapidapi.com'];
    let parsedEndpoint: URL;
    try {
      parsedEndpoint = new URL(endpoint);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!ALLOWED_HOSTS.includes(parsedEndpoint.hostname) || parsedEndpoint.protocol !== 'https:') {
      return new Response(JSON.stringify({ error: 'Forbidden host' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Making RapidAPI request to:', endpoint);
    console.log('Parameters:', params);

    // Build query string from params
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = `${endpoint}${queryString ? '?' + queryString : ''}`;

    const rapidApiHeaders: Record<string, string> = {
      'X-RapidAPI-Key': rapidApiKey,
      'X-RapidAPI-Host': 'expedia13.p.rapidapi.com',
    };

    // Add content-type for POST/PUT requests
    if (method !== 'GET' && body) {
      rapidApiHeaders['Content-Type'] = 'application/json';
    }

    const response = await fetch(fullUrl, {
      method,
      headers: rapidApiHeaders,
      body: body ? JSON.stringify(body) : null,
    });

    if (!response.ok) {
      console.error('RapidAPI request failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      
      return new Response(
        JSON.stringify({ error: 'External API request failed' }), 
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();
    const shaped = shapeProviderPayload(parsedEndpoint.pathname, data, 'expedia');
    console.log('RapidAPI response received successfully');

    return new Response(JSON.stringify(shaped), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in expedia-rapid-api function:', error);
    return new Response(
      JSON.stringify({ error: 'Unable to process API request. Please try again.' }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});