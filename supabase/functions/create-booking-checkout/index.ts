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

const TAAI_SERVICE_FEE_RATE = 0.08; // 8% service fee

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
  items: z.array(ItemSchema).min(1).max(50),
  itinerary_id: z.number().optional(),
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

    const { items, itinerary_id } = parsed.data;

    // Calculate totals
    const providerTotal = items.reduce((sum, item) => sum + item.price, 0);
    const serviceFee = Math.round(providerTotal * TAAI_SERVICE_FEE_RATE * 100) / 100;
    const totalAmount = providerTotal + serviceFee;

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

    // Add TAAI service fee as a separate line item
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: "TAAI Travel Management Fee",
          description: "AI-powered trip planning, booking management, and 24/7 support",
        },
        unit_amount: Math.round(serviceFee * 100),
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

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_update: { address: "auto" },
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get("origin")}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/search`,
      automatic_tax: { enabled: true },
      metadata: {
        type: "booking",
        user_id: user.id,
        itinerary_id: String(itinerary_id || ""),
        cart_item_ids: items.map((i) => i.cart_item_id).join(","),
        provider_total: String(providerTotal),
        service_fee: String(serviceFee),
      },
    });

    console.log("[BOOKING-CHECKOUT] Session created", {
      sessionId: session.id,
      total: totalAmount,
      items: items.length,
    });

    return new Response(JSON.stringify({
      url: session.url,
      session_id: session.id,
      breakdown: {
        provider_total: providerTotal,
        service_fee: serviceFee,
        total: totalAmount,
      },
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("create-booking-checkout error:", error);
    return new Response(JSON.stringify({
      error: "Unable to create checkout session. Please try again.",
    }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
