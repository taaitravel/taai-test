import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { session_id, receipt_id } = await req.json();
    let q = supabase.from("booking_receipts").select("pdf_path, user_id").eq("user_id", user.id);
    if (receipt_id) q = q.eq("id", receipt_id);
    else if (session_id) q = q.eq("stripe_session_id", session_id);
    else return new Response(JSON.stringify({ error: "missing id" }), { status: 400, headers: corsHeaders });
    const { data: r } = await q.maybeSingle();
    if (!r?.pdf_path) {
      return new Response(JSON.stringify({ error: "Receipt not ready" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: signed } = await supabase.storage.from("receipts").createSignedUrl(r.pdf_path, 600);
    return new Response(JSON.stringify({ url: signed?.signedUrl }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("download-receipt error:", e);
    return new Response(JSON.stringify({ error: "failed" }), { status: 500, headers: corsHeaders });
  }
});