import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "X-Content-Type-Options": "nosniff",
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

const OverrideSchema = z.object({
  cart_item_id: z.string().uuid(),
  check_in: z.string().optional(),
  check_out: z.string().optional(),
  pax: z.number().int().positive().max(20).optional(),
  room_code: z.string().optional(),
});

const BodySchema = z.object({
  quote_id: z.string().uuid(),
  overrides: z.array(OverrideSchema).max(50).default([]),
});

function nightsBetween(start?: string, end?: string): number {
  if (!start || !end) return 0;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (isNaN(s) || isNaN(e)) return 0;
  return Math.max(0, Math.round((e - s) / 86400000));
}

/**
 * Re-quote each item against the user's current selection. v1 uses the
 * captured per-unit price from item_data (nightly for hotels, per-pax for
 * flights/activities) and re-applies it to the new dates/pax. Real provider
 * adapters (Booking.com / Amadeus) can replace `reprice` later without
 * changing the contract.
 */
function reprice(quoteItem: any, override: any) {
  const type = String(quoteItem.type || "").toLowerCase();
  const sd = { ...(quoteItem.service_dates || {}) };
  const oldPrice = Number(quoteItem.new_price ?? quoteItem.old_price ?? 0);

  const checkIn = override?.check_in || sd.check_in || sd.checkIn || sd.start || sd.startDate || sd.date;
  const checkOut = override?.check_out || sd.check_out || sd.checkOut || sd.end || sd.endDate;
  const occupancy = { ...(quoteItem.occupancy || {}) };
  const rooms = Math.max(1, Number(occupancy.rooms || 1));
  const pax = Number(override?.pax ?? occupancy.adults ?? sd.pax ?? sd.guests ?? sd.adults ?? 1) || 1;

  const selectedProduct = quoteItem.selected_product || {};
  const providerQuote = quoteItem.provider_quote || {};
  if ((type === "hotel" || type === "rental") && selectedProduct.room_id && selectedProduct.rate_id) {
    const quoteOccupancy = providerQuote.occupancy || {};
    const quotedPax = Number(quoteOccupancy.adults || 0) + Number(quoteOccupancy.children || 0);
    const selectionChanged = checkIn !== providerQuote.check_in
      || checkOut !== providerQuote.check_out
      || pax !== quotedPax;
    if (selectionChanged) {
      return {
        ...quoteItem,
        old_price: oldPrice,
        new_price: oldPrice,
        status: "needs_review",
        reason: "Dates or guests changed — select a new room and rate",
      };
    }
  }

  let newPrice = oldPrice;
  let unit = 0;
  let nights = 0;

  if (type === "hotel" || type === "rental") {
    const prevNights = nightsBetween(sd.check_in || sd.checkIn || sd.start, sd.check_out || sd.checkOut || sd.end) || 1;
    unit = oldPrice && prevNights ? oldPrice / (prevNights * rooms) : Number(sd.unit_price || 0);
    nights = nightsBetween(checkIn, checkOut) || 1;
    newPrice = round2(unit * nights * rooms);
    sd.check_in = checkIn;
    sd.check_out = checkOut;
    sd.pax = pax;
    sd.unit_price = round2(unit);
    sd.nights = nights;
  } else if (type === "flight") {
    const prevPax = Number(sd.pax || sd.adults || 1) || 1;
    unit = oldPrice && prevPax ? oldPrice / prevPax : Number(sd.unit_price || 0);
    newPrice = round2(unit * pax);
    sd.pax = pax;
    sd.unit_price = round2(unit);
  } else if (type === "activity") {
    const prevPax = Number(sd.pax || sd.adults || 1) || 1;
    unit = oldPrice && prevPax ? oldPrice / prevPax : Number(sd.unit_price || 0);
    newPrice = round2(unit * pax);
    sd.date = checkIn || sd.date;
    sd.pax = pax;
    sd.unit_price = round2(unit);
  } else {
    newPrice = oldPrice;
  }

  let status: string = quoteItem.status || "available";
  let reason: string | undefined;
  if (Math.abs(newPrice - oldPrice) > 0.01) {
    status = "price_changed";
    reason = "Updated to reflect your latest selection";
  }

  return {
    ...quoteItem,
    service_dates: sd,
    occupancy,
    pricing: type === "hotel" || type === "rental" ? {
      ...(quoteItem.pricing || {}),
      price_scope: "stay_total",
      price_per_night: round2(unit),
      provider_total: newPrice,
    } : quoteItem.pricing,
    old_price: oldPrice,
    new_price: newPrice,
    status,
    reason,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { quote_id, overrides } = parsed.data;

    const { data: quote, error: qErr } = await supabase
      .from("booking_quotes")
      .select("*")
      .eq("id", quote_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (qErr || !quote) {
      return new Response(JSON.stringify({ error: "Quote not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ovMap = new Map(overrides.map((o) => [o.cart_item_id, o]));
    const items = Array.isArray(quote.items) ? (quote.items as any[]) : [];
    const events: any[] = [];
    const repriced = items.map((it) => {
      const ov = ovMap.get(it.cart_item_id);
      const next = reprice(it, ov);
      if (Math.abs(Number(next.new_price) - Number(it.new_price || 0)) > 0.01) {
        events.push({
          quote_id,
          cart_item_id: it.cart_item_id,
          user_id: user.id,
          old_price: Number(it.new_price || 0),
          new_price: Number(next.new_price),
          status: next.status,
          reason: next.reason || null,
          inputs: ov || {},
        });
      }
      return next;
    });

    const bookable = repriced.filter((v: any) => v.status === "available" || v.status === "price_changed");
    const providerTotal = round2(bookable.reduce((s: number, v: any) => s + Number(v.new_price || 0), 0));

    const { data: subRow } = await supabase
      .from("subscribers")
      .select("subscription_tier, subscribed")
      .eq("user_id", user.id)
      .maybeSingle();
    const tier = (subRow?.subscribed ? subRow?.subscription_tier : "traveler") || "traveler";
    const taaiFeeRate = getTaaiFeeRate(tier);
    const combinedRate = SALES_TAX_RATE + taaiFeeRate;
    const taxes = round2(providerTotal * combinedRate);
    const total = round2(providerTotal + taxes);

    // Push expiry forward so the user doesn't get kicked out mid-edit.
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: updErr } = await supabase
      .from("booking_quotes")
      .update({
        items: repriced,
        provider_total: providerTotal,
        taxes_and_fees: taxes,
        total,
        expires_at: expiresAt,
        status: "active",
      })
      .eq("id", quote_id)
      .eq("user_id", user.id);
    if (updErr) throw updErr;

    // Mirror service_dates and price back to cart_items so the rest of the
    // app (cart, itinerary) stays in sync with what the user just set.
    for (const it of repriced) {
      const { data: row } = await supabase
        .from("cart_items")
        .select("item_data, price")
        .eq("id", it.cart_item_id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!row) continue;
      const nextData = {
        ...(row.item_data || {}),
        check_in: it.service_dates?.check_in,
        check_out: it.service_dates?.check_out,
        service_dates: it.service_dates,
        occupancy: it.occupancy,
        pricing: it.pricing,
        price_per_night: it.pricing?.price_per_night,
        total_price: Number(it.new_price),
      };
      await supabase
        .from("cart_items")
        .update({
          item_data: nextData,
          price: Number(it.new_price),
          last_price: Number(it.new_price),
          last_repriced_at: new Date().toISOString(),
        })
        .eq("id", it.cart_item_id)
        .eq("user_id", user.id);
    }

    if (events.length > 0) {
      await supabase.from("quote_reprice_events").insert(events);
    }

    return new Response(JSON.stringify({
      quote_id,
      expires_at: expiresAt,
      items: repriced,
      breakdown: {
        provider_total: providerTotal,
        taxes_and_fees: taxes,
        combined_rate: combinedRate,
        total,
        subscription_tier: tier,
      },
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("reprice-quote error:", e);
    return new Response(JSON.stringify({ error: (e as Error)?.message || "Reprice failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
