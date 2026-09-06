import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3"
import {
  capGenericProviderPayload,
  normalizeHotelDetail,
  normalizeHotelSearchResponse,
} from "../_shared/hotel-contract.ts";


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const rapidApiKey = Deno.env.get('RAPID_API_KEY')!


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
    // Create Supabase client for user authentication
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get the JWT token from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Invalid token')
    }

    console.log('🏨 Authenticated user:', user.id)

    // Parse the request body
    const { endpoint, method = 'GET', params = {}, body = null } = await req.json()

    console.log('🏨 Booking.com API call:', { endpoint, method, params })

    // SSRF protection — only allow the booking.com RapidAPI host
    const ALLOWED_HOSTS = ['booking-com15.p.rapidapi.com'];
    let parsed: URL;
    try {
      parsed = new URL(endpoint);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!ALLOWED_HOSTS.includes(parsed.hostname) || parsed.protocol !== 'https:') {
      return new Response(JSON.stringify({ error: 'Forbidden host' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Construct the URL with parameters
    const url = parsed
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.append(key, String(value))
      }
    })

    console.log('🏨 Final URL:', url.toString())

    // Make the request to booking.com API
    const headers: Record<string, string> = {
      'x-rapidapi-host': 'booking-com15.p.rapidapi.com',
      'x-rapidapi-key': rapidApiKey,
    }

    if (method === 'POST' && body) {
      headers['Content-Type'] = 'application/json'
    }

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: method === 'POST' && body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('🏨 Booking.com API error:', response.status, errorText)
      
      // Handle rate limit / quota exceeded errors
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'QUOTA_EXCEEDED',
            message: 'The Booking.com API quota has been exceeded. Please try again later or contact support to upgrade your plan.',
            statusCode: 429
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      
      throw new Error(`API request failed: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    const shaped = shapeProviderPayload(parsed.pathname, data, 'booking.com')
    console.log('🏨 Booking.com API success:', { status: response.status })

    return new Response(JSON.stringify(shaped), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error('🏨 Booking.com API error:', error.message)
    return new Response(
      JSON.stringify({ error: 'Unable to process request. Please try again.' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})