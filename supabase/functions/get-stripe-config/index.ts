import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { buildCorsHeaders, guardOrigin } from "../_shared/edge-guard.ts";



serve(async (req) => {
  const corsHeaders: Record<string, string> = {
    ...buildCorsHeaders(req.headers.get("origin")),
    "X-Content-Type-Options": "nosniff",
  };
  const originGuard = guardOrigin(req.headers.get("origin"));
  if (!originGuard.ok) {
    return new Response(JSON.stringify({ error: originGuard.error }), {
      status: originGuard.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const key = Deno.env.get("STRIPE_PUBLISHABLE_KEY") ?? "";
  return new Response(JSON.stringify({ publishable_key: key }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});