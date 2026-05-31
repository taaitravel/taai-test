import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "X-Content-Type-Options": "nosniff",
};

const TravelerSchema = z.object({
  first_name: z.string().trim().min(1).max(80),
  last_name: z.string().trim().min(1).max(80),
  middle_name: z.string().trim().max(80).optional(),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(7).max(25),
  dob: z.string().trim().optional(),
  gender: z.enum(["male", "female", "x"]).optional(),
  nationality: z.string().trim().max(60).optional(),
  passport_number: z.string().trim().max(40).optional(),
  passport_expiry: z.string().trim().optional(),
});

const ItemTravelersSchema = z.object({
  cart_item_id: z.string().uuid(),
  item_type: z.string().min(1),
  lead: TravelerSchema,
  additional: z.array(TravelerSchema).max(9).default([]),
  special_requests: z.string().max(500).optional(),
  pax: z.number().int().positive().max(20).optional(),
});

const BodySchema = z.object({
  quote_id: z.string().uuid(),
  travelers: z.array(ItemTravelersSchema).min(1).max(50),
});

function validateByType(item: z.infer<typeof ItemTravelersSchema>): string | null {
  const t = item.item_type.toLowerCase();
  if (t === "flight") {
    const l = item.lead;
    if (!l.dob) return "Flight requires date of birth";
    if (!l.passport_number) return "Flight requires passport number";
    if (!l.passport_expiry) return "Flight requires passport expiry";
    if (!l.nationality) return "Flight requires nationality";
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { quote_id, travelers } = parsed.data;

    // Verify quote belongs to user and is active.
    const { data: quote, error: qErr } = await supabase
      .from("booking_quotes")
      .select("id, user_id, status, expires_at, items")
      .eq("id", quote_id)
      .maybeSingle();
    if (qErr || !quote || quote.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Quote not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (quote.status !== "active" || new Date(quote.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Quote expired" }), {
        status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Per-type validation.
    for (const t of travelers) {
      const err = validateByType(t);
      if (err) {
        return new Response(JSON.stringify({ error: err, cart_item_id: t.cart_item_id }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Upsert traveler rows.
    const rows = travelers.map((t) => ({
      quote_id,
      cart_item_id: t.cart_item_id,
      user_id: user.id,
      item_type: t.item_type,
      traveler_data: {
        lead: t.lead,
        additional: t.additional,
        special_requests: t.special_requests ?? null,
        pax: t.pax ?? 1 + (t.additional?.length ?? 0),
      },
    }));

    const { error: upErr } = await supabase
      .from("quote_travelers")
      .upsert(rows, { onConflict: "quote_id,cart_item_id" });
    if (upErr) throw upErr;

    return new Response(JSON.stringify({ ready: true, count: rows.length }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("save-traveler-details error:", e);
    return new Response(JSON.stringify({ error: "Failed to save traveler details" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});