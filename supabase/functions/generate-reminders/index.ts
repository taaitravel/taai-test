import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get auth user from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const itineraryId = body.itinerary_id;

    if (!itineraryId) {
      return new Response(
        JSON.stringify({ error: "itinerary_id required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch the itinerary
    const { data: itin, error: itinError } = await supabase
      .from("itinerary")
      .select(
        "id, itin_name, flights, hotels, activities, reservations, userid"
      )
      .eq("id", itineraryId)
      .single();

    if (itinError || !itin) {
      return new Response(
        JSON.stringify({ error: "Itinerary not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Only generate for owner or attendees
    if (itin.userid !== user.id) {
      const { data: attendee } = await supabase
        .from("itinerary_attendees")
        .select("id")
        .eq("itinerary_id", itineraryId)
        .eq("user_id", user.id)
        .eq("status", "accepted")
        .maybeSingle();

      if (!attendee) {
        return new Response(
          JSON.stringify({ error: "Not authorized" }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const notifications: Array<{
      user_id: string;
      type: string;
      title: string;
      message: string;
      reference_type: string;
      reference_id: string;
    }> = [];

    const safeDate = (val?: string) => {
      if (!val) return null;
      const dt = new Date(val);
      return isNaN(dt.getTime()) ? null : dt;
    };

    const isUpcoming = (dt: Date | null) =>
      dt && dt >= now && dt <= tomorrow;

    const formatTime = (dt: Date) =>
      dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

    const formatShortDate = (dt: Date) =>
      `${String(dt.getMonth() + 1).padStart(2, "0")}/${String(dt.getDate()).padStart(2, "0")}`;

    // Flights
    const flights = Array.isArray(itin.flights) ? itin.flights : [];
    for (const f of flights as any[]) {
      const dt = safeDate(f?.departure);
      if (isUpcoming(dt)) {
        notifications.push({
          user_id: user.id,
          type: "reminder",
          title: `✈ Flight ${f?.flight_number || ""} departing soon`,
          message: `${f?.from || ""} → ${f?.to || ""} at ${formatTime(dt!)} (${formatShortDate(dt!)})`,
          reference_type: "itinerary",
          reference_id: String(itineraryId),
        });
      }
    }

    // Hotels check-in
    const hotels = Array.isArray(itin.hotels) ? itin.hotels : [];
    for (const h of hotels as any[]) {
      const dt = safeDate(h?.check_in);
      if (isUpcoming(dt)) {
        notifications.push({
          user_id: user.id,
          type: "reminder",
          title: `🏨 Check in at ${h?.name || "hotel"}`,
          message: `Remember to check in on ${formatShortDate(dt!)}${h?.city ? ` in ${h.city}` : ""}`,
          reference_type: "itinerary",
          reference_id: String(itineraryId),
        });
      }
    }

    // Activities
    const activities = Array.isArray(itin.activities) ? itin.activities : [];
    for (const a of activities as any[]) {
      const dt = safeDate(a?.date);
      if (isUpcoming(dt)) {
        notifications.push({
          user_id: user.id,
          type: "reminder",
          title: `🎯 ${a?.name || "Activity"} coming up`,
          message: `Scheduled for ${formatTime(dt!)} on ${formatShortDate(dt!)}${a?.city ? ` in ${a.city}` : ""}`,
          reference_type: "itinerary",
          reference_id: String(itineraryId),
        });
      }
    }

    // Reservations
    const reservations = Array.isArray(itin.reservations)
      ? itin.reservations
      : [];
    for (const r of reservations as any[]) {
      const dateStr = r?.date;
      const timeStr = r?.time;
      let dt: Date | null = null;
      if (dateStr) {
        dt = timeStr
          ? new Date(`${dateStr}T${timeStr}`)
          : new Date(dateStr);
        if (isNaN(dt.getTime())) dt = null;
      }
      if (isUpcoming(dt)) {
        notifications.push({
          user_id: user.id,
          type: "reminder",
          title: `🍽 ${r?.type || "Reservation"} at ${r?.name || ""}`,
          message: `Don't forget your reservation at ${formatTime(dt!)} on ${formatShortDate(dt!)}`,
          reference_type: "itinerary",
          reference_id: String(itineraryId),
        });
      }
    }

    // Check for existing notifications to avoid duplicates (same title + reference)
    let inserted = 0;
    for (const n of notifications) {
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", n.user_id)
        .eq("title", n.title)
        .eq("reference_id", n.reference_id)
        .maybeSingle();

      if (!existing) {
        await supabase.from("notifications").insert(n);
        inserted++;
      }
    }

    return new Response(
      JSON.stringify({
        generated: inserted,
        total_upcoming: notifications.length,
        message: `Generated ${inserted} new reminder(s)`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Error generating reminders:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
