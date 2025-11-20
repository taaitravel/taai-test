import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query } = await req.json()
    
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: 'Query must be at least 2 characters long' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get Mapbox token from environment
    const mapboxToken = Deno.env.get('MAPBOX-TAAI-TOKEN')
    
    if (!mapboxToken) {
      return new Response(
        JSON.stringify({ error: 'Mapbox token not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Searching for: ${query}`)

    // Use Mapbox Geocoding API to search for places (cities, regions, countries)
    const geocodeResponse = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query.trim())}.json?access_token=${mapboxToken}&types=place,region,country&limit=8`
    )
    
    if (!geocodeResponse.ok) {
      console.error('Mapbox API error:', geocodeResponse.status, geocodeResponse.statusText)
      return new Response(
        JSON.stringify({ error: 'Failed to search locations' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const geocodeData = await geocodeResponse.json()
    console.log(`Found ${geocodeData.features?.length || 0} results`)
    
    const locations = geocodeData.features?.map((feature: any) => {
      const [longitude, latitude] = feature.center
      return {
        city: feature.text || feature.place_name,
        fullName: feature.place_name,
        lat: latitude,
        lng: longitude,
        country: feature.context?.find((c: any) => c.id.startsWith('country'))?.text || '',
        region: feature.context?.find((c: any) => c.id.startsWith('region'))?.text || ''
      }
    }) || []

    return new Response(
      JSON.stringify({ 
        locations,
        features: geocodeData.features // Include raw Mapbox features for compatibility
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )

  } catch (error) {
    console.error('Error in search-cities function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})