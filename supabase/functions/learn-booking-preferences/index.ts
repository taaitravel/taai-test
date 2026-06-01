import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );
    const { user_id, stripe_session_id } = await req.json();
    if (!user_id || !stripe_session_id) {
      return new Response(JSON.stringify({ error: "missing args" }), { status: 400, headers: corsHeaders });
    }
    const { data: completions } = await supabase
      .from("booking_completions")
      .select("item_type, item_data")
      .eq("stripe_session_id", stripe_session_id);
    const update: Record<string, any> = { user_id, updated_at: new Date().toISOString() };
    for (const c of completions || []) {
      const sd: any = (c.item_data as any)?.service_dates || {};
      if (c.item_type === "hotel") {
        if (sd.room || sd.room_type) update.preferred_room_type = sd.room || sd.room_type;
        if (sd.bed_type) update.preferred_bed = sd.bed_type;
      } else if (c.item_type === "flight") {
        if (sd.cabin) update.preferred_cabin_class = sd.cabin;
        if (sd.seat) update.preferred_seat = sd.seat;
        if (sd.meal) update.preferred_meal = sd.meal;
      }
    }
    await supabase.from("user_booking_preferences").upsert(update, { onConflict: "user_id" });
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("learn-booking-preferences error:", e);
    return new Response(JSON.stringify({ error: "failed" }), { status: 500, headers: corsHeaders });
  }
});