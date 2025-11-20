import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const rapidApiKey = Deno.env.get('RAPID_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('AirScraper API function called');

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

    if (!rapidApiKey) {
      console.error('RAPID_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Service configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { origin, destination, departureDate, adults, children, cabinClass } = await req.json();
    
    console.log('Searching flights:', { origin, destination, departureDate, adults });

    // Step 1: Search for origin airport
    const originSearchUrl = `https://sky-scrapper.p.rapidapi.com/api/v1/flights/searchAirport?query=${encodeURIComponent(origin)}`;
    const originResponse = await fetch(originSearchUrl, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'sky-scrapper.p.rapidapi.com',
      },
    });

    if (!originResponse.ok) {
      console.error('Origin airport search failed:', originResponse.status);
      return new Response(
        JSON.stringify({ error: 'Failed to find origin airport' }), 
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const originData = await originResponse.json();
    const originAirport = originData.data?.[0];
    if (!originAirport) {
      return new Response(
        JSON.stringify({ error: 'Origin airport not found' }), 
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 2: Search for destination airport
    const destSearchUrl = `https://sky-scrapper.p.rapidapi.com/api/v1/flights/searchAirport?query=${encodeURIComponent(destination)}`;
    const destResponse = await fetch(destSearchUrl, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'sky-scrapper.p.rapidapi.com',
      },
    });

    if (!destResponse.ok) {
      console.error('Destination airport search failed:', destResponse.status);
      return new Response(
        JSON.stringify({ error: 'Failed to find destination airport' }), 
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const destData = await destResponse.json();
    const destAirport = destData.data?.[0];
    if (!destAirport) {
      return new Response(
        JSON.stringify({ error: 'Destination airport not found' }), 
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Found airports:', {
      origin: originAirport.skyId,
      destination: destAirport.skyId
    });

    // Step 3: Search for flights
    const url = `https://sky-scrapper.p.rapidapi.com/api/v1/flights/searchFlights`;
    const params = new URLSearchParams({
      originSkyId: originAirport.skyId,
      destinationSkyId: destAirport.skyId,
      originEntityId: originAirport.entityId,
      destinationEntityId: destAirport.entityId,
      date: departureDate,
      adults: String(adults || 1),
      children: String(children || 0),
      cabinClass: cabinClass || 'economy',
      sortBy: 'best',
      currency: 'USD',
      market: 'en-US',
      countryCode: 'US'
    });

    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'sky-scrapper.p.rapidapi.com',
      },
    });

    if (!response.ok) {
      console.error('AirScraper API request failed:', response.status);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      
      return new Response(
        JSON.stringify({ error: 'Flight search failed' }), 
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();
    console.log('AirScraper API response received');

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in air-scraper-api function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
