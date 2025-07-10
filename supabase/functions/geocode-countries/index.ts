import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

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
    const { countries } = await req.json()
    
    if (!countries || !Array.isArray(countries)) {
      return new Response(
        JSON.stringify({ error: 'Invalid countries array' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const geocodedCountries = []

    for (const countryName of countries) {
      // First check if we already have coordinates for this country
      const { data: existingCountry } = await supabase
        .from('country_coordinates')
        .select('country_name, latitude, longitude, country_code')
        .eq('country_name', countryName)
        .single()

      if (existingCountry) {
        geocodedCountries.push(existingCountry)
      } else {
        // Try to geocode using Mapbox Geocoding API
        const mapboxToken = Deno.env.get('MAPBOX_PK')
        
        if (mapboxToken) {
          try {
            const geocodeResponse = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(countryName)}.json?access_token=${mapboxToken}&types=country&limit=1`
            )
            
            if (geocodeResponse.ok) {
              const geocodeData = await geocodeResponse.json()
              
              if (geocodeData.features && geocodeData.features.length > 0) {
                const feature = geocodeData.features[0]
                const [longitude, latitude] = feature.center
                const countryCode = feature.properties?.short_code?.toUpperCase() || ''
                
                // Save to database for future use
                const { error: insertError } = await supabase
                  .from('country_coordinates')
                  .insert({
                    country_name: countryName,
                    country_code: countryCode,
                    latitude: latitude,
                    longitude: longitude
                  })
                
                if (!insertError) {
                  geocodedCountries.push({
                    country_name: countryName,
                    latitude: latitude,
                    longitude: longitude,
                    country_code: countryCode
                  })
                } else {
                  console.error('Error inserting country coordinates:', insertError)
                }
              }
            }
          } catch (error) {
            console.error(`Error geocoding ${countryName}:`, error)
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ countries: geocodedCountries }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})