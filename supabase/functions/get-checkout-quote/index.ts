import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "X-Content-Type-Options": "nosniff",
};

type TravelerDetails = Record<string, unknown>;

interface TravelerDataForRedaction {
  lead?: TravelerDetails;
  additional?: TravelerDetails[];
  special_requests?: unknown;
  pax?: unknown;
}

interface QuoteTravelerRowForRedaction extends Record<string, unknown> {
  traveler_data?: TravelerDataForRedaction | null;
}

function redactTravelerData(row: QuoteTravelerRowForRedaction) {
  const sanitizeTraveler = (traveler: Record<string, unknown> = {}) => ({
    first_name: traveler.first_name ?? "",
    last_name: traveler.last_name ?? "",
    middle_name: traveler.middle_name ?? "",
    email: traveler.email ?? "",
    phone: traveler.phone ?? "",
  });

  return {
    ...row,
    traveler_data: {
      lead: sanitizeTraveler(row?.traveler_data?.lead),
      additional: Array.isArray(row?.traveler_data?.additional)
        ? row.traveler_data.additional.map(sanitizeTraveler)
        : [],
      special_requests: row?.traveler_data?.special_requests ?? null,
      pax: row?.traveler_data?.pax ?? 1,
    },
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const quoteId = body?.quote_id;
    if (!quoteId || typeof quoteId !== "string") {
      return new Response(JSON.stringify({ error: "quote_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: quote, error: qErr } = await supabase
      .from("booking_quotes")
      .select("*")
      .eq("id", quoteId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (qErr || !quote) {
      return new Response(JSON.stringify({ error: "Quote not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: travelers } = await supabase
      .from("quote_travelers")
      .select("cart_item_id, item_type, traveler_data")
      .eq("quote_id", quoteId);

    // Profile, saved travelers, and booking preferences so the client can
    // prefill the traveler form and currency/payer-mode defaults.
    const { data: profile } = await supabase
      .from("users")
      .select("first_name, last_name, email, cell, currency")
      .eq("userid", user.id)
      .maybeSingle();
    const { data: savedTravelers } = await supabase
      .from("saved_travelers")
      .select("*")
      .eq("user_id", user.id)
      .order("is_self", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(20);
    const { data: prefs } = await supabase
      .from("user_booking_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    return new Response(JSON.stringify({
      quote,
      travelers: (travelers ?? []).map(redactTravelerData),
      profile: profile ?? null,
      saved_travelers: savedTravelers ?? [],
      preferences: prefs ?? null,
      expired: quote.status !== "active" || new Date(quote.expires_at) < new Date(),
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("get-checkout-quote error:", e);
    return new Response(JSON.stringify({ error: "Failed to load quote" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});