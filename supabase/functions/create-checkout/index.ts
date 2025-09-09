import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    logStep("Checking Stripe key", { hasKey: !!stripeKey, keyPrefix: stripeKey?.substring(0, 7) });
    if (!stripeKey) {
      logStep("STRIPE_SECRET_KEY not found in environment");
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    // Use service role for database operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { tier, billing = 'monthly', isAuthenticated } = await req.json();
    logStep("Request parsed", { tier, isAuthenticated });

    let user = null;
    let userEmail = "guest@example.com";

    // If user is authenticated, get their info
    if (isAuthenticated) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
        if (!userError && userData.user) {
          user = userData.user;
          userEmail = user.email!;
          logStep("User authenticated", { userId: user.id, email: userEmail });
        }
      }
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get current prices from Stripe to ensure they exist
    const stripePricesResponse = await stripe.prices.list({ 
      active: true, 
      limit: 100 
    });
    
    logStep("Fetched Stripe prices", { count: stripePricesResponse.data.length });

    // Create a mapping of product names to price IDs
    const priceMapping: Record<string, { monthly?: string; annual?: string }> = {};
    
    for (const price of stripePricesResponse.data) {
      if (!price.product || typeof price.product !== 'object') continue;
      
      const product = price.product as any;
      const productName = product.name?.toLowerCase();
      const interval = price.recurring?.interval;
      
      logStep("Processing price", { 
        priceId: price.id, 
        productName, 
        interval, 
        amount: price.unit_amount 
      });

      // Map product names to our tier system
      if (productName?.includes('traveler+') || productName?.includes('traveler plus')) {
        if (!priceMapping.taai_traveler_plus) priceMapping.taai_traveler_plus = {};
        if (interval === 'month') priceMapping.taai_traveler_plus.monthly = price.id;
        if (interval === 'year') priceMapping.taai_traveler_plus.annual = price.id;
      }
      else if (productName?.includes('corp') && productName?.includes('traveler')) {
        if (!priceMapping.corp_taai_traveler_plus) priceMapping.corp_taai_traveler_plus = {};
        if (interval === 'month') priceMapping.corp_taai_traveler_plus.monthly = price.id;
        if (interval === 'year') priceMapping.corp_taai_traveler_plus.annual = price.id;
      }
      else if (productName?.includes('traveler') && !productName?.includes('plus')) {
        if (!priceMapping.taai_traveler) priceMapping.taai_traveler = {};
        if (interval === 'month') priceMapping.taai_traveler.monthly = price.id;
        if (interval === 'year') priceMapping.taai_traveler.annual = price.id;
      }
    }

    logStep("Price mapping created", priceMapping);

    // Get the correct price ID
    const tierPriceIds = priceMapping[tier as keyof typeof priceMapping];
    if (!tierPriceIds) {
      logStep("Invalid tier - no price mapping found", { tier, availableTiers: Object.keys(priceMapping) });
      throw new Error(`Invalid tier selected: ${tier}. Available tiers: ${Object.keys(priceMapping).join(', ')}`);
    }
    
    const priceId = tierPriceIds[billing as keyof typeof tierPriceIds];
    if (!priceId) {
      logStep("Invalid billing frequency", { tier, billing, availableFrequencies: Object.keys(tierPriceIds) });
      throw new Error(`Invalid billing frequency ${billing} for tier ${tier}. Available: ${Object.keys(tierPriceIds).join(', ')}`);
    }

    logStep("Using dynamic price ID", { tier, billing, priceId });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/subscription`,
      automatic_tax: {
        enabled: true, // Enable automatic tax calculation
      },
      customer_update: {
        address: "auto", // Collect address for tax calculation
      },
      metadata: {
        tier: tier,
        billing: billing,
        user_id: user?.id || 'guest'
      }
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    // Record payment attempt
    if (user) {
      await supabaseClient.from("payments").insert({
        user_id: user.id,
        stripe_session_id: session.id,
        subscription_tier: tier,
        billing_frequency: billing,
        payment_status: 'pending'
      });
      logStep("Payment record created");
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});