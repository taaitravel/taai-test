import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type BatchResponse = {
  query: string;
  fullName: string;
  city: string;
  lat: number;
  lng: number;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { data: u, error: ue } = await supabaseAuth.auth.getUser(authHeader.replace('Bearer ', ''));
    if (ue || !u?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { queries } = await req.json().catch(() => ({ queries: [] }));
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

    const results: BatchResponse[] = [];

    for (const q of queries) {
      if (typeof q !== "string" || q.trim().length < 2) continue;
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q.trim())}.json?access_token=${token}&types=poi,place,region&limit=1`;
      const resp = await fetch(url);
      if (!resp.ok) continue;
      const data = await resp.json();
      const feature = data.features?.[0];
      if (!feature || !Array.isArray(feature.center)) continue;
      const [lng, lat] = feature.center;
      results.push({
        query: q,
        fullName: feature.place_name || q,
        city: feature.text || q,
        lat,
        lng,
      });
    }

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("batch-geocode error", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
