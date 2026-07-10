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
  provider_confirmation_ready: boolean;
}

function pickServiceStart(item_data: any): Date | null {
  const sd = item_data?.service_dates ?? {};
  const raw = sd.start || sd.checkIn || sd.startDate || sd.depart || sd.date;
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Best-effort live re-price hook. Real provider adapters land in
 * supabase/functions/_shared/providers/* in a follow-up. For now we:
 *  - reject past service dates
 *  - re-read the last persisted price from cart_items as the authoritative value
 *  - flag a price change if the cart row's `price` differs from `last_price`
 */
async function repriceItem(row: any): Promise<ValidatedItem> {
  const start = pickServiceStart(row.item_data);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const base: ValidatedItem = {
    cart_item_id: row.id,
    type: row.type,
    name: row.item_data?.name || row.external_ref || row.type,
    provider: row.provider || row.item_data?.provider || "manual",
    external_id: row.external_id || row.item_data?.provider_ref?.external_id || null,
    old_price: Number(row.last_price ?? row.price ?? 0),
    new_price: Number(row.price ?? 0),
    status: "available",
    service_dates: row.item_data?.service_dates ?? null,
    provider_confirmation_ready: false,
  };

  if (start && start < today) {
    return { ...base, status: "expired_date", reason: "Service date is in the past" };
  }

  // Live commercial checkout requires explicit provider-confirmation capability.
  // Do not infer that a saved provider price is bookable.
  const providerRef = row.provider_ref || row.item_data?.provider_ref || {};
  const providerConfirmationReady = providerRef.bookable === true && (
    providerRef.live_booking_enabled === true ||
    providerRef.provider_confirmation_supported === true ||
    providerRef.manual_review_approved === true
  );
  if (!providerConfirmationReady) {
    return {
      ...base,
      status: "needs_review",
      reason: "Provider confirmation capability is not verified for live checkout",
      provider_confirmation_ready: false,
    };
  }

  // Price drift flag (placeholder until real provider reprice).
  if (base.old_price && Math.abs(base.new_price - base.old_price) / base.old_price > 0.02) {
    return { ...base, status: "price_changed", reason: "Provider rate has moved since you saved this item", provider_confirmation_ready: true };
  }

  return { ...base, provider_confirmation_ready: true };
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

    const bookable = validated.filter(v =>
      (v.status === "available" || v.status === "price_changed") && v.provider_confirmation_ready
    );
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
