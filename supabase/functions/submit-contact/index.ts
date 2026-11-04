import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  CONTACT_RATE_LIMIT,
  allowRequest,
  buildCorsHeaders,
  guardOrigin,
  readBoundedJson,
} from "../_shared/edge-guard.ts";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const text = (value: unknown, max: number): string =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

/** Best-effort client address. Supabase sets x-forwarded-for on browser calls. */
const clientAddress = (req: Request): string => {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip")?.trim() || "unknown";
};

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get("origin"));
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  const originGuard = guardOrigin(req.headers.get("origin"));
  if (!originGuard.ok) return json({ error: originGuard.error }, originGuard.status);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // Process-local limiter. See RATE_LIMIT_NOTE in edge-guard.ts.
  if (!allowRequest(`contact:${clientAddress(req)}`, Date.now(), CONTACT_RATE_LIMIT)) {
    return json({ error: "Too many messages. Please wait a few minutes and try again.", code: "rate_limited" }, 429);
  }

  const bounded = await readBoundedJson(req);
  if (!bounded.ok) return json({ error: bounded.error }, 400);
  const body = bounded.value && typeof bounded.value === "object" ? bounded.value as Record<string, unknown> : {};

  const name = text(body.name, 100);
  const email = text(body.email, 255);
  const companyName = text(body.companyName ?? body.company_name, 100);
  const inquiryType = body.inquiryType ?? body.inquiry_type;
  const subject = text(body.subject, 200);
  const message = text(body.message, 2000);

  if (!name || !EMAIL.test(email) || (inquiryType !== "individual" && inquiryType !== "corporate")) {
    return json({ error: "Please check the form for errors" }, 400);
  }
  if (!subject || message.length < 10) {
    return json({ error: "Please check the form for errors" }, 400);
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );
  const { error } = await admin.from("contact_inquiries").insert({
    name,
    email,
    company_name: companyName || null,
    inquiry_type: inquiryType,
    subject,
    message,
  });
  if (error) {
    console.error("contact inquiry insert failed");
    return json({ error: "Failed to send message. Please try again." }, 500);
  }
  return json({ ok: true });
});
