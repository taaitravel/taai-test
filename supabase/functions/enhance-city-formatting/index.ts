import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type EnhancedLocation = {
  originalQuery: string;
  formattedName: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  type: 'city' | 'poi' | 'region';
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { queries } = await req.json().catch(() => ({ queries: [] }));
    console.log('enhance-city-formatting: Processing queries:', queries);
    
    if (!Array.isArray(queries) || queries.length === 0) {
      return new Response(JSON.stringify({ error: "queries must be a non-empty array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = Deno.env.get("MAPBOX_TAAI_TOKEN") || Deno.env.get("MAPBOX-TAAI-TOKEN");
    if (!token) {
      return new Response(JSON.stringify({ error: "Mapbox token not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: EnhancedLocation[] = [];

    for (const q of queries) {
      if (typeof q !== "string" || q.trim().length < 2) continue;
      
      console.log('enhance-city-formatting: Processing query:', q);
      
      // Prioritize cities and places for proper formatting
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q.trim())}.json?access_token=${token}&types=place,region&limit=1`;
      
      try {
        const resp = await fetch(url);
        if (!resp.ok) {
          console.warn('enhance-city-formatting: Mapbox API error for', q, resp.status);
          continue;
        }
        
        const data = await resp.json();
        const feature = data.features?.[0];
        
        if (!feature || !Array.isArray(feature.center)) {
          console.warn('enhance-city-formatting: No valid feature found for', q);
          continue;
        }
        
        const [lng, lat] = feature.center;
        const context = feature.context || [];
        
        // Extract country from context
        const countryContext = context.find((c: any) => c.id?.startsWith('country.'));
        const country = countryContext?.text || '';
        
        // Build properly formatted name
        const city = feature.text || q;
        const formattedName = country ? `${city}, ${country}` : city;
        
        // Determine type
        let type: 'city' | 'poi' | 'region' = 'city';
        if (feature.properties?.category?.includes('place')) type = 'city';
        else if (feature.place_type?.includes('region')) type = 'region';
        else if (feature.place_type?.includes('poi')) type = 'poi';
        
        results.push({
          originalQuery: q,
          formattedName,
          city,
          country,
          lat,
          lng,
          type,
        });
        
        console.log('enhance-city-formatting: Successfully processed', q, 'as', formattedName);
        
      } catch (fetchError) {
        console.error('enhance-city-formatting: Error fetching for', q, fetchError);
      }
    }

    console.log('enhance-city-formatting: Returning results:', results);
    
    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    
  } catch (err) {
    console.error("enhance-city-formatting error", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});