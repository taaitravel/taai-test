import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "X-Content-Type-Options": "nosniff",
};

const jsonResponse = (body: Record<string, unknown>, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const authorization = req.headers.get("Authorization") || "";
    const token = authorization.replace(/^Bearer\s+/i, "").trim();
    if (!token) return jsonResponse({ error: "Unauthorized" }, 401);

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });
    const isInternalService = Boolean(serviceRoleKey) && token === serviceRoleKey;
    let callerUserId: string | null = null;
    if (!isInternalService) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) return jsonResponse({ error: "Unauthorized" }, 401);
      callerUserId = user.id;
    }

    const body = await req.json().catch(() => ({}));
    const stripeSessionId = typeof body?.stripe_session_id === "string"
      ? body.stripe_session_id.trim()
      : "";
    if (!stripeSessionId) return jsonResponse({ error: "stripe_session_id required" }, 400);

    // Identity is derived from the completed booking. Caller-supplied user IDs
    // are deliberately ignored so service-role writes cannot be redirected.
    const { data: completions, error: completionsError } = await supabase
      .from("booking_completions")
      .select("user_id, item_type, item_data")
      .eq("stripe_session_id", stripeSessionId);
    if (completionsError) throw completionsError;
    if (!completions || completions.length === 0) {
      return jsonResponse({ error: "Booking completion not found" }, 404);
    }

    const owners = Array.from(new Set(completions.map((completion) => completion.user_id).filter(Boolean)));
    if (owners.length !== 1) {
      console.error("learn-booking-preferences owner mismatch", { stripeSessionId, ownerCount: owners.length });
      return jsonResponse({ error: "Booking ownership is inconsistent" }, 409);
    }
    const targetUserId = owners[0];
    if (!isInternalService && callerUserId !== targetUserId) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    const update: Record<string, unknown> = {
      user_id: targetUserId,
      updated_at: new Date().toISOString(),
    };
    for (const completion of completions) {
      const itemData = asRecord(completion.item_data);
      const serviceDates = asRecord(itemData.service_dates);
      if (completion.item_type === "hotel") {
        if (serviceDates.room || serviceDates.room_type) {
          update.preferred_room_type = serviceDates.room || serviceDates.room_type;
        }
        if (serviceDates.bed_type) update.preferred_bed = serviceDates.bed_type;
      } else if (completion.item_type === "flight") {
        if (serviceDates.cabin) update.preferred_cabin_class = serviceDates.cabin;
        if (serviceDates.seat) update.preferred_seat = serviceDates.seat;
        if (serviceDates.meal) update.preferred_meal = serviceDates.meal;
      }
    }

    const { error: updateError } = await supabase
      .from("user_booking_preferences")
      .upsert(update, { onConflict: "user_id" });
    if (updateError) throw updateError;

    return jsonResponse({ ok: true }, 200);
  } catch (error) {
    console.error("learn-booking-preferences error:", error);
    return jsonResponse({ error: "Failed to learn booking preferences" }, 500);
  }
});
