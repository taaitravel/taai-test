import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    // Auth validation
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email = claimsData.claims.email as string;
    if (!email) throw new Error("No email in token claims");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Find customer by email
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length === 0) {
      return new Response(
        JSON.stringify({
          has_payment_method: false,
          default_method: null,
          all_methods: [],
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const customerId = customers.data[0].id;

    // Retrieve customer with expanded default payment method
    const customer = await stripe.customers.retrieve(customerId, {
      expand: ["invoice_settings.default_payment_method"],
    });

    if (customer.deleted) {
      return new Response(
        JSON.stringify({
          has_payment_method: false,
          default_method: null,
          all_methods: [],
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // List all card payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    });

    const defaultPm = customer.invoice_settings?.default_payment_method;
    const defaultPmId =
      typeof defaultPm === "string" ? defaultPm : defaultPm?.id ?? null;

    const allMethods = paymentMethods.data.map((pm) => ({
      brand: pm.card?.brand ?? "unknown",
      last4: pm.card?.last4 ?? "????",
      exp_month: pm.card?.exp_month ?? 0,
      exp_year: pm.card?.exp_year ?? 0,
      is_default: pm.id === defaultPmId,
    }));

    const defaultMethod = allMethods.find((m) => m.is_default) ?? allMethods[0] ?? null;

    return new Response(
      JSON.stringify({
        has_payment_method: allMethods.length > 0,
        default_method: defaultMethod
          ? {
              brand: defaultMethod.brand,
              last4: defaultMethod.last4,
              exp_month: defaultMethod.exp_month,
              exp_year: defaultMethod.exp_year,
            }
          : null,
        all_methods: allMethods,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("get-payment-info error:", error);
    return new Response(
      JSON.stringify({ error: "Unable to retrieve payment information." }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
