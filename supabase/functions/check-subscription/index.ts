import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, updating free tier");
      await supabaseClient.from("subscribers").upsert({
        email: user.email,
        user_id: user.id,
        stripe_customer_id: null,
        subscribed: false,
        subscription_tier: 'traveler',
        subscription_end: null,
        credits_remaining: 5,
        max_itineraries: 3,
        max_shared_friends: 10,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });

      return new Response(JSON.stringify({ 
        subscribed: false, 
        subscription_tier: 'traveler',
        credits_remaining: 5,
        max_itineraries: 3,
        max_shared_friends: 10
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionTier = 'traveler';
    let subscriptionEnd = null;
    let creditsRemaining = 5;
    let maxItineraries = 3;
    let maxSharedFriends = 10;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      
      // Get the actual price from Stripe
      const priceId = subscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      const amount = price.unit_amount || 0;
      
      logStep("Found subscription with price", { priceId, amount, interval: price.recurring?.interval });
      
      // Map price IDs to tiers (using your actual Stripe price IDs)
      const priceIdToTier: Record<string, any> = {
        // Monthly prices
        'price_1QnqYlP0pUOcQcULV8VsVVfP': {
          tier: "taai_traveler",
          credits: 50,
          maxItineraries: 20,
          maxSharedFriends: 20
        },
        'price_1QnqZlP0pUOcQcULOdKfTKhG': {
          tier: "taai_traveler_plus", 
          credits: 100,
          maxItineraries: -1,
          maxSharedFriends: -1
        },
        'price_1QnqaXP0pUOcQcUL8VNhQmxD': {
          tier: "corp_taai_traveler_plus",
          credits: 200,
          maxItineraries: 100,
          maxSharedFriends: 50
        },
        // Annual prices  
        'price_1QnqZKP0pUOcQcULqtXgYPXk': {
          tier: "taai_traveler",
          credits: 50,
          maxItineraries: 20,
          maxSharedFriends: 20
        },
        'price_1Qnqa9P0pUOcQcULM3XfNf3L': {
          tier: "taai_traveler_plus",
          credits: 100, 
          maxItineraries: -1,
          maxSharedFriends: -1
        },
        'price_1QnqauP0pUOcQcULRtWxNQzY': {
          tier: "corp_taai_traveler_plus",
          credits: 200,
          maxItineraries: 100,
          maxSharedFriends: 50
        }
      };
      
      const tierInfo = priceIdToTier[priceId];
      if (tierInfo) {
        subscriptionTier = tierInfo.tier;
        creditsRemaining = tierInfo.credits;
        maxItineraries = tierInfo.maxItineraries;
        maxSharedFriends = tierInfo.maxSharedFriends;
        logStep("Mapped to tier", { subscriptionTier, creditsRemaining, maxItineraries, maxSharedFriends });
      } else {
        logStep("Unknown price ID, defaulting to traveler tier", { priceId });
      }
    }

    await supabaseClient.from("subscribers").upsert({
      email: user.email,
      user_id: user.id,
      stripe_customer_id: customerId,
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      credits_remaining: creditsRemaining,
      max_itineraries: maxItineraries,
      max_shared_friends: maxSharedFriends,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      credits_remaining: creditsRemaining,
      max_itineraries: maxItineraries,
      max_shared_friends: maxSharedFriends
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    // Log detailed error server-side only
    console.error('Subscription check error:', error);
    logStep("ERROR in check-subscription", { message: error instanceof Error ? error.message : String(error) });
    
    // Return safe, generic error to client
    return new Response(
      JSON.stringify({ 
        error: 'Unable to check subscription status. Please try again or contact support.' 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});