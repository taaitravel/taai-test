import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // For now, handle session lookup by ID (webhook signing can be added with STRIPE_WEBHOOK_SECRET later)
    const body = await req.json();
    const { session_id } = body;

    if (!session_id) {
      return new Response(JSON.stringify({ error: "session_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["line_items", "payment_intent"],
    });

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ error: "Payment not completed", status: session.payment_status }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only process booking-type sessions
    if (session.metadata?.type !== "booking") {
      return new Response(JSON.stringify({ error: "Not a booking session" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = session.metadata.user_id;
    const cartItemIds = session.metadata.cart_item_ids?.split(",") || [];
    const providerTotal = parseFloat(session.metadata.provider_total || "0");
    const serviceFee = parseFloat(session.metadata.service_fee || "0");
    const itineraryId = session.metadata.itinerary_id ? parseInt(session.metadata.itinerary_id) : null;
    const paymentIntent = session.payment_intent as Stripe.PaymentIntent;

    console.log("[BOOKING-WEBHOOK] Processing payment", {
      sessionId: session.id,
      userId,
      cartItemIds,
      amount: session.amount_total,
    });

    // Fetch cart items
    const { data: cartItems } = await supabaseClient
      .from("cart_items")
      .select("*")
      .in("id", cartItemIds);

    // Create booking completions for each cart item
    const completions = [];
    for (const item of (cartItems || [])) {
      const itemData = item.item_data as Record<string, unknown> || {};
      const itemPrice = item.price || 0;
      const itemServiceFee = Math.round(itemPrice * 0.08 * 100) / 100;
      const stripeFeeEstimate = Math.round((itemPrice + itemServiceFee) * 0.029 * 100) / 100 + 0.30;

      const { data: completion, error: completionError } = await supabaseClient
        .from("booking_completions")
        .insert({
          user_id: userId,
          provider: (itemData.provider as string) || item.type || "unknown",
          item_type: item.type,
          item_data: itemData,
          provider_cost: itemPrice,
          taai_service_fee: itemServiceFee,
          tax_amount: 0, // Stripe Tax handles this
          stripe_fee: stripeFeeEstimate,
          total_charged: itemPrice + itemServiceFee,
          net_revenue: itemServiceFee - stripeFeeEstimate,
          stripe_payment_intent_id: paymentIntent?.id,
          stripe_session_id: session.id,
          status: "confirmed",
          receipt_url: (paymentIntent as any)?.charges?.data?.[0]?.receipt_url || null,
        })
        .select("id")
        .single();

      if (completionError) {
        console.error("[BOOKING-WEBHOOK] Completion insert error:", completionError);
        continue;
      }

      completions.push(completion);

      // Create financial ledger entries
      if (completion) {
        await supabaseClient.from("financial_ledger").insert([
          {
            booking_completion_id: completion.id,
            entry_type: "charge",
            amount: itemPrice + itemServiceFee,
            description: `Booking charge for ${item.type}: ${item.external_ref}`,
          },
          {
            booking_completion_id: completion.id,
            entry_type: "service_fee",
            amount: itemServiceFee,
            description: "TAAI travel management fee (8%)",
          },
          {
            booking_completion_id: completion.id,
            entry_type: "stripe_fee",
            amount: -stripeFeeEstimate,
            description: "Stripe processing fee",
          },
        ]);
      }

      // Update cart item status
      await supabaseClient
        .from("cart_items")
        .update({ booking_status: "booked" })
        .eq("id", item.id);

      // Track booking_complete intent
      await supabaseClient.from("booking_intents").insert({
        user_id: userId,
        event_type: "booking_complete",
        provider: (itemData.provider as string) || item.type || "unknown",
        item_type: item.type,
        item_data: itemData,
        price_snapshot: itemPrice,
        cart_item_id: item.id,
        itinerary_id: itineraryId,
      });
    }

    // Send notification
    await supabaseClient.from("notifications").insert({
      user_id: userId,
      type: "booking_confirmed",
      title: "Booking Confirmed! 🎉",
      message: `Your booking for ${cartItems?.length || 0} item(s) has been confirmed. Total: $${(session.amount_total! / 100).toFixed(2)}`,
      reference_id: completions[0]?.id,
      reference_type: "booking_completion",
    });

    return new Response(JSON.stringify({
      success: true,
      completions: completions.length,
      total_charged: (session.amount_total! / 100).toFixed(2),
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[BOOKING-WEBHOOK] Error:", error);
    return new Response(JSON.stringify({ error: "Failed to process booking" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
