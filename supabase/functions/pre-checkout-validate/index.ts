import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

const SALES_TAX_RATE = 0.07;
function getTaaiFeeRate(tier: string | null | undefined): number {
  switch (tier) {
    case "taai_traveler": return 0.007;
    case "taai_traveler_plus":
    case "corp_taai_traveler_plus":
    case "taai_enterprise_plus": return 0.0035;
    default: return 0.01;
  }
}
const round2 = (n: number) => Math.round(n * 100) / 100;

const BodySchema = z.object({
  cart_item_ids: z.array(z.string().uuid()).min(1).max(50),
  itinerary_id: z.number().optional(),
});

type ItemStatus = "available" | "price_changed" | "sold_out" | "expired_date" | "needs_review";

interface ValidatedItem {
  cart_item_id: string;
  type: string;
  name: string;
  provider: string;
  external_id: string | null;
  old_price: number;
  new_price: number;
  status: ItemStatus;
  reason?: string;
  service_dates: Record<string, unknown> | null;
  occupancy: Record<string, unknown> | null;
  pricing: Record<string, unknown> | null;
  booking_context: Record<string, unknown> | null;
  selected_product: Record<string, unknown> | null;
  policies: Record<string, unknown> | null;
  provider_quote: Record<string, unknown> | null;
  earnings: Record<string, unknown> | null;
}

function parseServiceDate(raw: unknown): Date | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const dateOnly = raw.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (!dateOnly) return null;
  const parsed = new Date(`${dateOnly}T00:00:00Z`);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeServiceDates(item_data: any): Record<string, unknown> | null {
  const sd = item_data?.service_dates ?? {};
  const checkIn = sd.check_in || sd.checkIn || sd.start || sd.startDate
    || item_data?.check_in || item_data?.checkIn || item_data?.checkin;
  const checkOut = sd.check_out || sd.checkOut || sd.end || sd.endDate
    || item_data?.check_out || item_data?.checkOut || item_data?.checkout;
  const start = checkIn || sd.depart || sd.date || item_data?.departure || item_data?.date;
  const end = checkOut || sd.return || item_data?.arrival;
  if (!start && !end) return null;
  return checkIn || checkOut
    ? { check_in: checkIn ?? null, check_out: checkOut ?? null }
    : { start: start ?? null, end: end ?? null };
}

/**
 * Best-effort live re-price hook. Real provider adapters land in
 * supabase/functions/_shared/providers/* in a follow-up. For now we:
 *  - reject past service dates
 *  - re-read the last persisted price from cart_items as the authoritative value
 *  - flag a price change if the cart row's `price` differs from `last_price`
 */
async function repriceItem(row: any): Promise<ValidatedItem> {
  const serviceDates = normalizeServiceDates(row.item_data);
  const startRaw = serviceDates?.check_in || serviceDates?.start;
  const endRaw = serviceDates?.check_out || serviceDates?.end;
  const start = parseServiceDate(startRaw);
  const end = parseServiceDate(endRaw);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const base: ValidatedItem = {
    cart_item_id: row.id,
    type: row.type,
    name: row.item_data?.name || row.external_ref || row.type,
    provider: row.provider || row.item_data?.provider || "manual",
    external_id: row.external_id || row.item_data?.provider_ref?.external_id || null,
    old_price: Number(row.last_price ?? row.price ?? 0),
    new_price: Number(row.price ?? 0),
    status: "needs_review",
    service_dates: serviceDates,
    occupancy: row.item_data?.occupancy ?? null,
    pricing: row.item_data?.pricing ?? null,
    booking_context: row.item_data?.booking_context ?? null,
    selected_product: row.item_data?.selected_product ?? null,
    policies: row.item_data?.policies ?? null,
    provider_quote: row.item_data?.provider_quote ?? null,
    earnings: row.item_data?.earnings ?? null,
  };

  if (!start || (row.type === "hotel" && !end)) {
    return { ...base, reason: row.type === "hotel"
      ? "Check-in and check-out dates are required before checkout"
      : "A service date is required before checkout" };
  }

  if (row.type === "hotel" && end && end <= start) {
    return { ...base, reason: "Check-out must be after check-in" };
  }

  if (start < today) {
    return { ...base, status: "expired_date", reason: "Service date is in the past" };
  }

  if (!(base.new_price > 0)) {
    return { ...base, reason: "A valid total price is required before checkout" };
  }

  if (row.type === "hotel") {
    const occupancy = row.item_data?.occupancy ?? {};
    const rooms = Number(occupancy.rooms ?? row.item_data?.rooms ?? 0);
    const adults = Number(occupancy.adults ?? row.item_data?.adults ?? row.item_data?.guests ?? 0);
    if (!(rooms >= 1) || !(adults >= 1)) {
      return { ...base, reason: "Room and guest occupancy are required before checkout" };
    }

    const selectedProduct = row.item_data?.selected_product ?? {};
    if (!selectedProduct.room_id || !selectedProduct.rate_id) {
      return { ...base, reason: "Select a room and rate before checkout" };
    }

    const providerQuote = row.item_data?.provider_quote ?? {};
    const quoteOccupancy = providerQuote.occupancy ?? {};
    const exactDatesMatch = providerQuote.exact_selection === true
      && providerQuote.check_in === serviceDates?.check_in
      && providerQuote.check_out === serviceDates?.check_out;
    const exactOccupancyMatches = Number(quoteOccupancy.rooms) === rooms
      && Number(quoteOccupancy.adults) === adults
      && Number(quoteOccupancy.children ?? 0) === Number(occupancy.children ?? 0);
    if (!exactDatesMatch || !exactOccupancyMatches) {
      return { ...base, reason: "The selected room must be refreshed for these exact dates and guests" };
    }

    const rateExpiresAt = row.rate_expires_at ? new Date(row.rate_expires_at) : null;
    if (rateExpiresAt && !isNaN(rateExpiresAt.getTime()) && rateExpiresAt <= new Date()) {
      return { ...base, status: "expired_date", reason: "The selected room rate has expired" };
    }
  }

  // A search result or outbound URL is not proof that the selected dates/rate are bookable.
  const bookable = row.provider_ref?.bookable;
  if (bookable !== true || !base.external_id) {
    return { ...base, reason: "Live availability has not been confirmed for this exact selection" };
  }

  // Price drift flag (placeholder until real provider reprice).
  if (base.old_price && Math.abs(base.new_price - base.old_price) / base.old_price > 0.02) {
    return { ...base, status: "price_changed", reason: "Provider rate has moved since you saved this item" };
  }

  return { ...base, status: "available" };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { cart_item_ids, itinerary_id } = parsed.data;

    const { data: rows, error: fetchErr } = await supabaseClient
      .from("cart_items")
      .select("*")
      .in("id", cart_item_ids)
      .eq("user_id", user.id);

    if (fetchErr) throw fetchErr;
    if (!rows || rows.length === 0) {
      return new Response(JSON.stringify({ error: "No cart items found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validated: ValidatedItem[] = [];
    for (const row of rows) {
      const result = await repriceItem(row);
      validated.push(result);

      // Persist reprice telemetry on the cart row
      await supabaseClient
        .from("cart_items")
        .update({
          last_repriced_at: new Date().toISOString(),
          last_price: result.new_price,
        })
        .eq("id", row.id)
        .eq("user_id", user.id);

      await supabaseClient.from("booking_attempts").insert({
        user_id: user.id,
        cart_item_id: row.id,
        itinerary_id: itinerary_id ?? null,
        provider: result.provider,
        phase: "reprice",
        request: { cart_item_id: row.id, external_id: result.external_id },
        response: { status: result.status, new_price: result.new_price, reason: result.reason },
        success: result.status === "available" || result.status === "price_changed",
      });
    }

    const bookable = validated.filter(v => v.status === "available" || v.status === "price_changed");
    const providerTotal = round2(bookable.reduce((s, v) => s + v.new_price, 0));

    const { data: subRow } = await supabaseClient
      .from("subscribers")
      .select("subscription_tier, subscribed")
      .eq("user_id", user.id)
      .maybeSingle();
    const tier = (subRow?.subscribed ? subRow?.subscription_tier : "traveler") || "traveler";
    const taaiFeeRate = getTaaiFeeRate(tier);
    const taxes = round2(providerTotal * (SALES_TAX_RATE + taaiFeeRate));
    const total = round2(providerTotal + taxes);

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const diffs = validated
      .filter(v => v.status !== "available")
      .map(v => ({
        cart_item_id: v.cart_item_id,
        status: v.status,
        reason: v.reason,
        old_price: v.old_price,
        new_price: v.new_price,
      }));

    const { data: quoteRow, error: quoteErr } = await supabaseClient
      .from("booking_quotes")
      .insert({
        user_id: user.id,
        itinerary_id: itinerary_id ?? null,
        items: validated,
        diffs,
        provider_total: providerTotal,
        taxes_and_fees: taxes,
        total,
        currency: "USD",
        status: "active",
        expires_at: expiresAt,
      })
      .select("id, expires_at")
      .single();

    if (quoteErr) throw quoteErr;

    return new Response(JSON.stringify({
      quote_id: quoteRow.id,
      expires_at: quoteRow.expires_at,
      items: validated,
      diffs,
      breakdown: {
        provider_total: providerTotal,
        taxes_and_fees: taxes,
        total,
        subscription_tier: tier,
      },
      all_available: diffs.length === 0,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("pre-checkout-validate error:", err);
    return new Response(JSON.stringify({ error: "Validation failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
