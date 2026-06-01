import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "X-Content-Type-Options": "nosniff",
};

function fmtMoney(n: number, currency: string) {
  try { return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n); }
  catch { return `${n.toFixed(2)} ${currency}`; }
}

function renderHtml(r: any): string {
  const currency = r.currency || "USD";
  const lines = (r.lines || []).map((ln: any) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #eee">
        <div style="font-weight:600">${ln.name || ""}</div>
        <div style="font-size:12px;color:#666">${ln.type || ""}${ln.dates ? " · " + ln.dates : ""}${ln.room ? " · " + ln.room : ""}${ln.pax ? " · " + ln.pax + " guest(s)" : ""}</div>
      </td>
      <td style="padding:8px 0;text-align:right;border-bottom:1px solid #eee;white-space:nowrap">${fmtMoney(Number(ln.amount || 0), currency)}</td>
    </tr>`).join("");
  return `
    <div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;color:#111">
      <h1 style="margin:0 0 4px">TAAI</h1>
      <div style="color:#666;font-size:13px;margin-bottom:24px">Booking receipt · ${r.receipt_number}</div>
      <div style="font-size:14px;margin-bottom:16px">Hi ${r.billed_to?.name || "there"}, your booking is confirmed. Receipt below.</div>
      <table style="width:100%;border-collapse:collapse">${lines}</table>
      <table style="width:100%;border-collapse:collapse;margin-top:16px">
        <tr><td style="color:#666">Subtotal</td><td style="text-align:right">${fmtMoney(Number(r.totals?.subtotal || 0), currency)}</td></tr>
        <tr><td style="color:#666">Taxes & fees</td><td style="text-align:right">${fmtMoney(Number(r.totals?.taxes_and_fees || 0), currency)}</td></tr>
        <tr><td style="font-weight:700;padding-top:8px;border-top:1px solid #eee">Total</td><td style="text-align:right;font-weight:700;padding-top:8px;border-top:1px solid #eee">${fmtMoney(Number(r.totals?.total || 0), currency)} ${currency}</td></tr>
      </table>
      <p style="color:#888;font-size:12px;margin-top:24px">A PDF copy of this receipt is attached. Policies are confirmed with the provider after booking.</p>
    </div>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );
    const { receipt_id } = await req.json();
    if (!receipt_id) {
      return new Response(JSON.stringify({ error: "receipt_id required" }), { status: 400, headers: corsHeaders });
    }
    const { data: r } = await supabase.from("booking_receipts").select("*").eq("id", receipt_id).maybeSingle();
    if (!r) return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: corsHeaders });
    const to = r.receipt_json?.billed_to?.email;
    if (!to) return new Response(JSON.stringify({ ok: false, reason: "no recipient" }), { status: 200, headers: corsHeaders });

    // Attach PDF if available
    let attachment: any = null;
    if (r.pdf_path) {
      const { data: file } = await supabase.storage.from("receipts").download(r.pdf_path);
      if (file) {
        const buf = new Uint8Array(await file.arrayBuffer());
        let bin = "";
        for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
        attachment = {
          filename: `${r.receipt_number}.pdf`,
          content: btoa(bin),
        };
      }
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!RESEND_API_KEY || !LOVABLE_API_KEY) {
      console.warn("Resend not configured — skipping email send");
      return new Response(JSON.stringify({ ok: false, reason: "email not configured" }), { status: 200, headers: corsHeaders });
    }

    const resp = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: "TAAI <onboarding@resend.dev>",
        to: [to],
        subject: `Your TAAI booking receipt · ${r.receipt_number}`,
        html: renderHtml(r.receipt_json),
        attachments: attachment ? [attachment] : undefined,
      }),
    });
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      console.error("Resend error", json);
      return new Response(JSON.stringify({ ok: false, error: json }), { status: 200, headers: corsHeaders });
    }

    await supabase.from("booking_receipts").update({ sent_to: [to] }).eq("id", r.id);
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("send-booking-receipt error:", e);
    return new Response(JSON.stringify({ error: "Failed to send" }), { status: 500, headers: corsHeaders });
  }
});