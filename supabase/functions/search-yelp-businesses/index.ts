// Yelp search proxy Edge Function
// Uses YELP_API_KEY secret; returns minimal business data for UI

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { term, location, latitude, longitude } = await req.json().catch(() => ({}));
    if (!term || (typeof term !== "string") || term.length < 2) {
      return new Response(JSON.stringify({ error: "Missing or invalid term" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const apiKey = Deno.env.get("YELP_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Yelp API key not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const params = new URLSearchParams({ term, limit: "20" });
    if (location) params.set("location", String(location));
    if (latitude && longitude) {
      params.set("latitude", String(latitude));
      params.set("longitude", String(longitude));
    }

    const url = `https://api.yelp.com/v3/businesses/search?${params.toString()}`;
    console.log("Yelp request URL:", url);
    const yelpResp = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
    console.log("Yelp API status:", yelpResp.status);
    const data = await yelpResp.json();
    console.log("Yelp API response keys:", Object.keys(data));
    if (data.error) {
      console.error("Yelp API error:", JSON.stringify(data.error));
      return new Response(JSON.stringify({ error: data.error?.description || "Yelp API error", yelp_error: data.error }), {
        status: yelpResp.status >= 400 ? yelpResp.status : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!yelpResp.ok) {
      console.error("Yelp non-OK response:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: `Yelp API returned ${yelpResp.status}` }), {
        status: yelpResp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Yelp returned ${(data.businesses || []).length} businesses`);
    return new Response(JSON.stringify({ businesses: data.businesses || [] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("search-yelp-businesses error", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
