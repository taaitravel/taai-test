import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Security-Policy": "default-src 'self'",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

// Authoritative server-side fee math. Never trust client-supplied rates.
const SALES_TAX_RATE = 0.07;
function getTaaiFeeRate(tier: string | null | undefined): number {
  switch (tier) {
    case "taai_traveler":
      return 0.007;
    case "taai_traveler_plus":
    case "corp_taai_traveler_plus":
    case "taai_enterprise_plus":
      return 0.0035;
    case "traveler":
    default:
      return 0.01;
  }
}
const round2 = (n: number) => Math.round(n * 100) / 100;

const ItemSchema = z.object({
  cart_item_id: z.string().uuid(),
  type: z.string(),
  name: z.string().max(255),
  price: z.number().positive(),
  provider: z.string().max(50),
  item_data: z.record(z.unknown()).default({}),
  guest_details: z.record(z.unknown()).optional(),
  service_dates: z.record(z.unknown()).optional(),
});

const CheckoutSchema = z.object({
  items: z.array(ItemSchema).min(1).max(50).optional(),
  quote_id: z.string().uuid().optional(),
  itinerary_id: z.number().optional(),
  ui_mode: z.enum(["embedded", "hosted"]).optional().default("hosted"),
}).refine((d) => d.quote_id || (d.items && d.items.length), {
  message: "Either quote_id or items[] is required",
});

// Rate limiting
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const checkRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + 3600000 });
    return true;
  }
  if (record.count >= 10) return false;
  record.count++;
  return true;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    if (!checkRateLimit(clientIp)) {
      return new Response(JSON.stringify({ error: "Too many checkout attempts. Try again later." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Auth
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

    // Validate input
    const body = await req.json();
    const parsed = CheckoutSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let { items, itinerary_id } = parsed.data;
    const quote_id = parsed.data.quote_id;
    const ui_mode = parsed.data.ui_mode;

    // Quote-first path: server-validated cart snapshot from pre-checkout-validate.
    let quoteRow: any = null;
    if (quote_id) {
      const { data: q, error: qErr } = await supabaseClient
        .from("booking_quotes")
        .select("*")
        .eq("id", quote_id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (qErr || !q) {
        return new Response(JSON.stringify({ error: "Quote not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (q.status !== "active" || new Date(q.expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: "Quote expired — please re-verify your cart" }), {
          status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      quoteRow = q;
      itinerary_id = q.itinerary_id ?? itinerary_id;
      // Hydrate items from validated quote, ignoring anything the client tried to send.
      const bookable = (q.items as any[]).filter(
        (v) => (v.status === "available" || v.status === "price_changed") && v.provider_confirmation_ready === true
      );
      if (bookable.length === 0) {
        return new Response(JSON.stringify({ error: "No provider-confirmable items in quote" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      items = bookable.map((v: any) => ({
        cart_item_id: v.cart_item_id,
        type: v.type,
        name: v.name,
        price: Number(v.new_price),
        provider: v.provider,
        item_data: { external_id: v.external_id, service_dates: v.service_dates },
      }));
    }
    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ error: "No items to checkout" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For embedded checkout, require traveler details for every cart item in the quote.
    if (ui_mode === "embedded" && quote_id) {
      const cartItemIds = items.map((i) => i.cart_item_id);
      const { data: travelers } = await supabaseClient
        .from("quote_travelers")
        .select("cart_item_id")
        .eq("quote_id", quote_id)
        .in("cart_item_id", cartItemIds);
      const haveIds = new Set((travelers || []).map((t: any) => t.cart_item_id));
      const missing = cartItemIds.filter((id) => !haveIds.has(id));
      if (missing.length > 0) {
        return new Response(JSON.stringify({
          error: "Traveler details required before payment",
          missing_cart_item_ids: missing,
        }), {
          status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Resolve user's subscription tier server-side (never trust the client).
    const { data: subRow } = await supabaseClient
      .from("subscribers")
      .select("subscription_tier, subscribed")
      .eq("user_id", user.id)
      .maybeSingle();
    const tier = (subRow?.subscribed ? subRow?.subscription_tier : "traveler") || "traveler";
    const taaiFeeRate = getTaaiFeeRate(tier);
    const combinedRate = SALES_TAX_RATE + taaiFeeRate;

    // Calculate totals
    const providerTotal = round2(items.reduce((sum, item) => sum + item.price, 0));
    const salesTax = round2(providerTotal * SALES_TAX_RATE);
    const taaiFee = round2(providerTotal * taaiFeeRate);
    const taxesAndFees = round2(salesTax + taaiFee);
    const totalAmount = round2(providerTotal + taxesAndFees);

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
    }

    // Build line items for Stripe Checkout
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: `${item.type.charAt(0).toUpperCase() + item.type.slice(1)}: ${item.name}`,
          metadata: {
            provider: item.provider,
            cart_item_id: item.cart_item_id,
          },
        },
        unit_amount: Math.round(item.price * 100), // cents
      },
      quantity: 1,
    }));

    // Single combined "Taxes & Fees" line shown to the user.
    // The sales-tax / TAAI-fee split lives only in metadata (and the receipt).
    const combinedPctLabel = `${(combinedRate * 100).toFixed(2).replace(/\.?0+$/, "")}%`;
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: `Taxes & Fees (${combinedPctLabel})`,
          description: "Includes applicable sales tax and TAAI travel management fee.",
        },
        unit_amount: Math.round(taxesAndFees * 100),
      },
      quantity: 1,
    });

    // Track checkout_start intent for each item
    for (const item of items) {
      await supabaseClient.from("booking_intents").insert({
        user_id: user.id,
        event_type: "checkout_start",
        provider: item.provider,
        item_type: item.type,
        item_id: item.cart_item_id,
        item_data: item.item_data,
        price_snapshot: item.price,
        guest_details: item.guest_details,
        service_dates: item.service_dates,
        itinerary_id: itinerary_id,
        cart_item_id: item.cart_item_id,
      });

      // Update cart status
      await supabaseClient
        .from("cart_items")
        .update({ booking_status: "checkout_started" })
        .eq("id", item.cart_item_id)
        .eq("user_id", user.id);
    }

    const origin = req.headers.get("origin") || "";
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      line_items: lineItems,
      mode: "payment",
      billing_address_collection: "auto",
      metadata: {
        type: "booking",
        user_id: user.id,
        itinerary_id: String(itinerary_id || ""),
        quote_id: quote_id || "",
        cart_item_ids: items.map((i) => i.cart_item_id).join(","),
        provider_total: String(providerTotal),
        taxes_and_fees: String(taxesAndFees),
        sales_tax: String(salesTax),
        taai_fee: String(taaiFee),
        sales_tax_rate: String(SALES_TAX_RATE),
        taai_fee_rate: String(taaiFeeRate),
        combined_rate: String(combinedRate),
        subscription_tier: tier,
        booking_state: "payment_completed_provider_pending",
      },
    };
    if (ui_mode === "embedded") {
      sessionParams.ui_mode = "embedded";
      sessionParams.return_url = `${origin}/booking-success?session_id={CHECKOUT_SESSION_ID}`;
    } else {
      sessionParams.success_url = `${origin}/booking-success?session_id={CHECKOUT_SESSION_ID}`;
      sessionParams.cancel_url = `${origin}/cart`;
      sessionParams.customer_update = { address: "auto" };
      sessionParams.automatic_tax = { enabled: true };
    }
    const session = await stripe.checkout.sessions.create(sessionParams);

    if (quoteRow) {
      await supabaseClient
        .from("booking_quotes")
        .update({ stripe_session_id: session.id })
        .eq("id", quoteRow.id);
    }

    console.log("[BOOKING-CHECKOUT] Session created", {
      sessionId: session.id,
      total: totalAmount,
      items: items.length,
    });

    return new Response(JSON.stringify({
      url: session.url,
      session_id: session.id,
      client_secret: (session as any).client_secret ?? null,
      breakdown: {
        provider_total: providerTotal,
        taxes_and_fees: taxesAndFees,
        sales_tax: salesTax,
        taai_fee: taaiFee,
        combined_rate: combinedRate,
        subscription_tier: tier,
        total: totalAmount,
      },
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = (error as any)?.message || "Unable to create checkout session.";
    console.error("create-booking-checkout error:", msg, error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
