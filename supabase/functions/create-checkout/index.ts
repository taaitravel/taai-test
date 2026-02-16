import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Security-Policy": "default-src 'self'",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

// Rate limiting: 5 checkout sessions per IP per hour
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const checkRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  
  if (!record || now > record.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + 3600000 }); // 1 hour
    return true;
  }
  
  if (record.count >= 5) {
    return false; // Rate limit exceeded
  }
  
  record.count++;
  return true;
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

    // Rate limiting check
    const clientIp = req.headers.get("x-forwarded-for")?.split(',')[0] || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    
    if (!checkRateLimit(clientIp)) {
      logStep("Rate limit exceeded", { ip: clientIp });
      return new Response(
        JSON.stringify({ error: "Too many checkout attempts. Please try again in an hour." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
      );
    }

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
    logStep("Request parsed", { tier, billing, isAuthenticated });

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

    // Get current prices from Stripe
    const stripePricesResponse = await stripe.prices.list({ 
      active: true, 
      limit: 100 
    });
    
    logStep("Fetched Stripe prices", { count: stripePricesResponse.data.length });

    // Get products to better understand naming
    const products = await stripe.products.list({ active: true, limit: 100 });
    logStep("Fetched Stripe products", { count: products.data.length });
    
    // Create a mapping of tier names to price IDs by scanning all products
    const priceMapping: Record<string, { monthly?: string; annual?: string }> = {
      taai_traveler: {},
      taai_traveler_plus: {},
      corp_taai_traveler_plus: {}
    };
    
    for (const price of stripePricesResponse.data) {
      if (!price.product || typeof price.product !== 'string') continue;
      
      // Find the product details
      const product = products.data.find(p => p.id === price.product);
      if (!product) continue;
      
      const productName = product.name?.toLowerCase() || '';
      const interval = price.recurring?.interval;
      
      logStep("Processing price", { 
        priceId: price.id, 
        productName: product.name, 
        interval, 
        amount: price.unit_amount 
      });

      // Map product names to our tier system with more flexible matching
      if (productName.includes('corp') && productName.includes('traveler')) {
        if (interval === 'month') priceMapping.corp_taai_traveler_plus.monthly = price.id;
        if (interval === 'year') priceMapping.corp_taai_traveler_plus.annual = price.id;
        logStep("Mapped corporate tier", { tier: 'corp_taai_traveler_plus', interval, priceId: price.id });
      }
      else if (productName.includes('traveler+') || productName.includes('traveler plus')) {
        if (interval === 'month') priceMapping.taai_traveler_plus.monthly = price.id;
        if (interval === 'year') priceMapping.taai_traveler_plus.annual = price.id;
        logStep("Mapped traveler+ tier", { tier: 'taai_traveler_plus', interval, priceId: price.id });
      }
      else if (productName.includes('traveler') && !productName.includes('plus') && !productName.includes('+')) {
        if (interval === 'month') priceMapping.taai_traveler.monthly = price.id;
        if (interval === 'year') priceMapping.taai_traveler.annual = price.id;
        logStep("Mapped traveler tier", { tier: 'taai_traveler', interval, priceId: price.id });
      }
    }

    logStep("Final price mapping", priceMapping);

    // Get the correct price ID for the requested tier
    const tierPriceIds = priceMapping[tier as keyof typeof priceMapping];
    if (!tierPriceIds || Object.keys(tierPriceIds).length === 0) {
      logStep("Invalid tier - no price mapping found", { 
        tier, 
        availableTiers: Object.keys(priceMapping).filter(k => Object.keys(priceMapping[k]).length > 0),
        fullMapping: priceMapping
      });
      throw new Error(`Invalid tier selected: ${tier}. Available tiers: ${Object.keys(priceMapping).filter(k => Object.keys(priceMapping[k]).length > 0).join(', ')}`);
    }
    
    const priceId = tierPriceIds[billing as keyof typeof tierPriceIds];
    if (!priceId) {
      logStep("Invalid billing frequency", { 
        tier, 
        billing, 
        availableFrequencies: Object.keys(tierPriceIds),
        tierPriceIds 
      });
      throw new Error(`Invalid billing frequency ${billing} for tier ${tier}. Available: ${Object.keys(tierPriceIds).join(', ')}`);
    }

    logStep("Using dynamic price ID", { tier, billing, priceId });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      logStep("No existing customer found, will create during checkout");
    }

    const sessionParams: any = {
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
        enabled: true,
      },
      metadata: {
        tier: tier,
        billing: billing,
        user_id: user?.id || 'guest'
      }
    };

    if (customerId) {
      sessionParams.customer = customerId;
      sessionParams.customer_update = { address: "auto" };
    } else {
      sessionParams.customer_email = userEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    logStep("Checkout session created successfully", { sessionId: session.id, url: session.url });

    // Record payment attempt - only for authenticated users
    if (user) {
      try {
        await supabaseClient.from("payments").insert({
          user_id: user.id,
          stripe_session_id: session.id,
          subscription_tier: tier,
          amount: 0, // Will be updated after payment completion
          payment_status: 'pending'
        });
        logStep("Payment record created");
      } catch (dbError) {
        logStep("Database insert failed but continuing", { error: dbError });
        // Don't fail the checkout if DB insert fails
      }
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    // Log detailed error server-side only
    console.error('Checkout creation error:', error);
    logStep("ERROR in create-checkout", { message: error instanceof Error ? error.message : String(error) });
    
    // Return safe, generic error to client
    return new Response(
      JSON.stringify({ 
        error: 'Unable to create checkout session. Please try again or contact support.' 
      }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});