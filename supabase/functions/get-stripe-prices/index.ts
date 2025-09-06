import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-STRIPE-PRICES] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Fetch all products and their prices
    const products = await stripe.products.list({ active: true, limit: 100 });
    logStep("Fetched products", { count: products.data.length });

    const priceMapping: Record<string, any> = {};
    const tierMapping: Record<string, any> = {};

    for (const product of products.data) {
      const prices = await stripe.prices.list({ 
        product: product.id, 
        active: true,
        limit: 100
      });
      
      logStep("Processing product", { 
        productId: product.id, 
        name: product.name,
        priceCount: prices.data.length 
      });

      // Map product names to our tier system
      let tierName = '';
      if (product.name.toLowerCase().includes('taaitraveler+') || product.name.toLowerCase().includes('taai traveler+')) {
        tierName = 'taai_traveler_plus';
      } else if (product.name.toLowerCase().includes('taaitraveler') || product.name.toLowerCase().includes('taai traveler')) {
        tierName = 'taai_traveler';
      } else if (product.name.toLowerCase().includes('corp') || product.name.toLowerCase().includes('corporate')) {
        tierName = 'corp_taai_traveler_plus';
      }

      if (tierName) {
        if (!tierMapping[tierName]) {
          tierMapping[tierName] = {
            productId: product.id,
            name: product.name,
            prices: {}
          };
        }

        for (const price of prices.data) {
          const amount = price.unit_amount ? price.unit_amount / 100 : 0;
          const interval = price.recurring?.interval;
          
          priceMapping[price.id] = {
            tier: tierName,
            amount: amount,
            interval: interval,
            productName: product.name
          };

          if (interval === 'month') {
            tierMapping[tierName].prices.monthly = {
              priceId: price.id,
              amount: amount
            };
          } else if (interval === 'year') {
            tierMapping[tierName].prices.annual = {
              priceId: price.id,
              amount: amount
            };
          }
        }
      }
    }

    logStep("Price mapping completed", { 
      totalPrices: Object.keys(priceMapping).length,
      tiers: Object.keys(tierMapping)
    });

    return new Response(JSON.stringify({
      priceMapping,
      tierMapping,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in get-stripe-prices", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});