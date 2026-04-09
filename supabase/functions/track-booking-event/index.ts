import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EventSchema = z.object({
  event_type: z.enum(["view", "add_to_cart", "add_to_itinerary", "checkout_start", "booking_complete"]),
  provider: z.string().min(1).max(50),
  item_type: z.enum(["hotel", "flight", "activity", "restaurant", "package"]),
  item_id: z.string().max(255).optional(),
  item_data: z.record(z.unknown()).default({}),
  price_snapshot: z.number().nonnegative().optional(),
  currency: z.string().max(3).default("USD"),
  guest_details: z.record(z.unknown()).optional(),
  service_dates: z.record(z.unknown()).optional(),
  itinerary_id: z.number().optional(),
  cart_item_id: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).default({}),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const parsed = EventSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: intent, error: insertError } = await supabaseClient
      .from("booking_intents")
      .insert({
        user_id: user.id,
        ...parsed.data,
      })
      .select("id")
      .single();

    if (insertError) throw insertError;

    // If checkout_start, update cart_item booking_status
    if (parsed.data.event_type === "checkout_start" && parsed.data.cart_item_id) {
      await supabaseClient
        .from("cart_items")
        .update({ booking_status: "checkout_started" })
        .eq("id", parsed.data.cart_item_id)
        .eq("user_id", user.id);
    }

    if (parsed.data.event_type === "add_to_cart" && parsed.data.cart_item_id) {
      await supabaseClient
        .from("cart_items")
        .update({ booking_status: "interested" })
        .eq("id", parsed.data.cart_item_id)
        .eq("user_id", user.id);
    }

    return new Response(JSON.stringify({ id: intent.id }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("track-booking-event error:", error);
    return new Response(JSON.stringify({ error: "Failed to track event" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
