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

    // Resolve session_id either from a verified Stripe webhook signature
    // (authoritative, when STRIPE_WEBHOOK_SECRET is configured) or from a
    // signed-in client polling after redirect (guarded fallback). Payment
    // completion never means provider confirmation.
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const stripeSig = req.headers.get("stripe-signature");
    let session_id: string | undefined;
    let fallbackUserId: string | null = null;
    let verifiedStripeWebhook = false;

    if (webhookSecret && stripeSig) {
      const rawBody = await req.text();
      try {
        const event = await stripe.webhooks.constructEventAsync(
          rawBody,
          stripeSig,
          webhookSecret,
        );
        if (event.type !== "checkout.session.completed") {
          return new Response(JSON.stringify({ ok: "ignored" }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        session_id = (event.data.object as Stripe.Checkout.Session).id;
        verifiedStripeWebhook = true;
      } catch (err) {
        console.error("[BOOKING-WEBHOOK] Signature verification failed", err);
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // Authenticated client fallback: must present a Supabase JWT.
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: ud, error: ue } = await supabaseClient.auth.getUser(
        authHeader.replace("Bearer ", ""),
      );
      if (ue || !ud?.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      fallbackUserId = ud.user.id;
      const body = await req.json().catch(() => ({}));
      session_id = body.session_id;
      if (!session_id) {
        return new Response(JSON.stringify({ error: "session_id required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Idempotency: skip if this Stripe session already produced completions
    const { data: existingCompletion } = await supabaseClient
      .from("booking_completions")
      .select("id")
      .eq("stripe_session_id", session_id)
      .maybeSingle();
    if (existingCompletion) {
      return new Response(JSON.stringify({ ok: "already processed" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
    if (!userId) {
      return new Response(JSON.stringify({ error: "Booking session missing user metadata" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!verifiedStripeWebhook && fallbackUserId !== userId) {
      return new Response(JSON.stringify({ error: "Session does not belong to authenticated user" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const cartItemIds = session.metadata.cart_item_ids?.split(",") || [];
    const providerTotal = parseFloat(session.metadata.provider_total || "0");
    // Tiered breakdown from checkout metadata. Falls back to legacy 8% flat
    // for any in-flight session created before tiered pricing shipped.
    const legacyServiceFee = parseFloat(session.metadata.service_fee || "0");
    const sessSalesTaxRate = parseFloat(session.metadata.sales_tax_rate || "0");
    const sessTaaiFeeRate = parseFloat(session.metadata.taai_fee_rate || "0");
    const subscriptionTier = session.metadata.subscription_tier || "traveler";
    const hasTieredMeta = sessSalesTaxRate > 0 || sessTaaiFeeRate > 0;
    const itineraryId = session.metadata.itinerary_id ? parseInt(session.metadata.itinerary_id) : null;
    const paymentIntent = session.payment_intent as Stripe.PaymentIntent;
    const paymentState = "payment_completed";
    const providerState = "provider_pending";
    const bookingState = "payment_completed_provider_pending";

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
      .in("id", cartItemIds)
      .eq("user_id", userId);

    if (!cartItems || cartItems.length !== cartItemIds.length) {
      return new Response(JSON.stringify({ error: "Cart item ownership mismatch" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create booking completions for each cart item
    const completions = [];
    for (const item of (cartItems || [])) {
      const itemData = item.item_data as Record<string, unknown> || {};
      const itemPrice = item.price || 0;
      const itemSalesTax = hasTieredMeta
        ? Math.round(itemPrice * sessSalesTaxRate * 100) / 100
        : 0;
      const itemTaaiFee = hasTieredMeta
        ? Math.round(itemPrice * sessTaaiFeeRate * 100) / 100
        : legacyServiceFee && providerTotal
          ? Math.round((itemPrice / providerTotal) * legacyServiceFee * 100) / 100
          : Math.round(itemPrice * 0.08 * 100) / 100;
      const itemTaxesAndFees = Math.round((itemSalesTax + itemTaaiFee) * 100) / 100;
      const itemTotal = Math.round((itemPrice + itemTaxesAndFees) * 100) / 100;
      const stripeFeeEstimate = Math.round(itemTotal * 0.029 * 100) / 100 + 0.30;

      const { data: completion, error: completionError } = await supabaseClient
        .from("booking_completions")
        .insert({
          user_id: userId,
          provider: (itemData.provider as string) || item.type || "unknown",
          item_type: item.type,
          item_data: itemData,
          provider_cost: itemPrice,
          taai_service_fee: itemTaaiFee,
          tax_amount: itemSalesTax,
          stripe_fee: stripeFeeEstimate,
          total_charged: itemTotal,
          net_revenue: Math.round((itemTaaiFee - stripeFeeEstimate) * 100) / 100,
          stripe_payment_intent_id: paymentIntent?.id,
          stripe_session_id: session.id,
          status: bookingState,
          payment_status: paymentState,
          provider_status: providerState,
          provider_confirmation_required: true,
          traveler_notification_status: "not_sent",
          receipt_url: (paymentIntent as any)?.charges?.data?.[0]?.receipt_url || null,
          notes: `tier=${subscriptionTier}; sales_tax_rate=${sessSalesTaxRate}; taai_fee_rate=${sessTaaiFeeRate}; provider_confirmation=pending`,
        })
        .select("id")
        .single();

      if (completionError) {
        console.error("[BOOKING-WEBHOOK] Completion insert error:", completionError);
        throw completionError;
      }

      completions.push(completion);

      // Create financial ledger entries
      if (completion) {
        await supabaseClient.from("financial_ledger").insert([
          {
            booking_completion_id: completion.id,
            entry_type: "charge",
            amount: itemTotal,
            description: `Booking charge for ${item.type}: ${item.external_ref}`,
          },
          {
            booking_completion_id: completion.id,
            entry_type: "sales_tax",
            amount: itemSalesTax,
            description: `Sales tax (${(sessSalesTaxRate * 100).toFixed(2)}%)`,
          },
          {
            booking_completion_id: completion.id,
            entry_type: "service_fee",
            amount: itemTaaiFee,
            description: `TAAI travel management fee (${(sessTaaiFeeRate * 100).toFixed(3).replace(/\.?0+$/, "")}%, tier=${subscriptionTier})`,
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
        .update({
          booking_status: bookingState,
          payment_status: paymentState,
          provider_status: providerState,
        })
        .eq("id", item.id);

      // ── Cost-splitting: flip splits to "covered" against the organizer
      // (the user that ran checkout) and recompute the proportional Taxes
      // & Fees per attendee. The recompute_balances_for_item function then
      // writes one attendee_balances row per non-organizer attendee.
      try {
        const { data: itemSplits } = await supabaseClient
          .from("cart_item_splits")
          .select("id, computed_amount")
          .eq("cart_item_id", item.id);
        if (itemSplits && itemSplits.length > 0 && itemPrice > 0) {
          for (const s of itemSplits) {
            const proportion = (s.computed_amount || 0) / itemPrice;
            const taxesShare = Math.round(itemTaxesAndFees * proportion * 100) / 100;
            await supabaseClient
              .from("cart_item_splits")
              .update({
                payment_status: "covered",
                paid_by_user_id: userId,
                computed_taxes_and_fees: taxesShare,
              })
              .eq("id", s.id);
          }
          await supabaseClient.rpc("recompute_balances_for_item", {
            _cart_item_id: item.id,
          });
        }
      } catch (splitErr) {
        console.error("[BOOKING-WEBHOOK] split/balance update failed", splitErr);
      }

      // Track booking_complete intent
      await supabaseClient.from("booking_intents").insert({
        user_id: userId,
        event_type: "payment_complete_provider_pending",
        provider: (itemData.provider as string) || item.type || "unknown",
        item_type: item.type,
        item_data: itemData,
        price_snapshot: itemPrice,
        cart_item_id: item.id,
        itinerary_id: itineraryId,
      });
    }

    // Do not send taai traveler-facing notifications until provider confirmation
    // evidence exists. Stripe may still issue its payment receipt separately.

    return new Response(JSON.stringify({
      success: true,
      completions: completions.length,
      total_charged: (session.amount_total! / 100).toFixed(2),
      status: bookingState,
      payment_status: paymentState,
      provider_status: providerState,
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
