import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "X-Content-Type-Options": "nosniff",
};

function fmtMoney(n: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
  } catch { return `${n.toFixed(2)} ${currency}`; }
}

async function buildPdf(receipt: any): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]); // US Letter
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const c = (r: number, g: number, b: number) => rgb(r / 255, g / 255, b / 255);

  let y = 750;
  page.drawText("TAAI", { x: 50, y, size: 22, font: bold, color: c(20, 20, 20) });
  page.drawText("Booking receipt", { x: 50, y: y - 22, size: 11, font, color: c(110, 110, 110) });

  // Right column meta
  page.drawText(`Receipt #: ${receipt.receipt_number}`, { x: 360, y, size: 10, font });
  page.drawText(`Date: ${new Date(receipt.created_at || Date.now()).toLocaleString()}`, { x: 360, y: y - 14, size: 10, font });
  if (receipt.stripe_session_id) {
    page.drawText(`Session: ${String(receipt.stripe_session_id).slice(0, 32)}`, { x: 360, y: y - 28, size: 9, font, color: c(120,120,120) });
  }

  y -= 60;
  page.drawLine({ start: { x: 50, y }, end: { x: 562, y }, thickness: 1, color: c(220,220,220) });
  y -= 24;

  page.drawText("Billed to", { x: 50, y, size: 10, font: bold });
  y -= 14;
  const billedTo = receipt.billed_to || {};
  page.drawText(`${billedTo.name || ""}`, { x: 50, y, size: 11, font });
  y -= 13;
  page.drawText(`${billedTo.email || ""}`, { x: 50, y, size: 10, font, color: c(100,100,100) });
  if (billedTo.phone) {
    y -= 12;
    page.drawText(billedTo.phone, { x: 50, y, size: 10, font, color: c(100,100,100) });
  }

  y -= 28;
  page.drawText("Items", { x: 50, y, size: 10, font: bold });
  y -= 6;
  page.drawLine({ start: { x: 50, y }, end: { x: 562, y }, thickness: 0.5, color: c(220,220,220) });
  y -= 14;

  const currency = receipt.currency || "USD";
  const lines: any[] = receipt.lines || [];
  for (const ln of lines) {
    if (y < 120) { y = 750; pdf.addPage([612, 792]); }
    page.drawText(`${ln.type ? `[${ln.type}] ` : ""}${ln.name || ""}`, { x: 50, y, size: 11, font: bold });
    page.drawText(fmtMoney(Number(ln.amount || 0), currency), { x: 500, y, size: 11, font, color: c(20,20,20) });
    y -= 13;
    if (ln.dates) {
      page.drawText(`Dates: ${ln.dates}`, { x: 50, y, size: 9, font, color: c(110,110,110) });
      y -= 11;
    }
    if (ln.room || ln.pax) {
      const meta = [ln.room ? `Room: ${ln.room}` : null, ln.pax ? `Guests: ${ln.pax}` : null].filter(Boolean).join("  ·  ");
      page.drawText(meta, { x: 50, y, size: 9, font, color: c(110,110,110) });
      y -= 11;
    }
    if (ln.travelers && Array.isArray(ln.travelers) && ln.travelers.length) {
      page.drawText(`Travelers: ${ln.travelers.join(", ")}`, { x: 50, y, size: 9, font, color: c(110,110,110) });
      y -= 11;
    }
    y -= 6;
  }

  y -= 6;
  page.drawLine({ start: { x: 50, y }, end: { x: 562, y }, thickness: 0.5, color: c(220,220,220) });
  y -= 16;

  const totals = receipt.totals || {};
  const drawRow = (label: string, amount: number, bold_ = false) => {
    page.drawText(label, { x: 350, y, size: bold_ ? 12 : 10, font: bold_ ? bold : font });
    page.drawText(fmtMoney(amount, currency), { x: 500, y, size: bold_ ? 12 : 10, font: bold_ ? bold : font });
    y -= bold_ ? 16 : 13;
  };
  drawRow("Subtotal", Number(totals.subtotal || 0));
  drawRow("Taxes & fees", Number(totals.taxes_and_fees || 0));
  drawRow("Total", Number(totals.total || 0), true);

  if (receipt.split && Array.isArray(receipt.split) && receipt.split.length) {
    y -= 8;
    page.drawText("Per-person split", { x: 50, y, size: 10, font: bold });
    y -= 14;
    for (const sp of receipt.split) {
      if (y < 80) { y = 750; pdf.addPage([612, 792]); }
      page.drawText(`${sp.label}`, { x: 50, y, size: 10, font });
      page.drawText(fmtMoney(Number(sp.amount || 0), currency), { x: 500, y, size: 10, font });
      y -= 12;
    }
  }

  y -= 18;
  page.drawText("Thanks for booking with TAAI. Policies confirmed with provider after booking.", {
    x: 50, y: Math.max(y, 60), size: 9, font, color: c(140,140,140),
  });

  return await pdf.save();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const body = await req.json().catch(() => ({}));
    const sessionId: string | undefined = body?.stripe_session_id;
    if (!sessionId) {
      return new Response(JSON.stringify({ error: "stripe_session_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Idempotency
    const { data: existing } = await supabase
      .from("booking_receipts")
      .select("id, pdf_path, sent_to, user_id")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ ok: true, receipt_id: existing.id, pdf_path: existing.pdf_path, skipped: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: completions } = await supabase
      .from("booking_completions")
      .select("*")
      .eq("stripe_session_id", sessionId);
    if (!completions || completions.length === 0) {
      return new Response(JSON.stringify({ error: "No completions for session" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = completions[0].user_id;
    const currency = (completions[0].currency || "USD").toUpperCase();

    const { data: profile } = await supabase
      .from("users")
      .select("first_name, last_name, email, cell")
      .eq("userid", userId)
      .maybeSingle();

    // Best-effort: pull traveler details for richer line items
    const { data: quoteRows } = await supabase
      .from("booking_quotes")
      .select("id, items, currency")
      .eq("stripe_session_id", sessionId)
      .limit(1);
    const quoteRow = quoteRows?.[0];
    const travelers = quoteRow ? (await supabase
      .from("quote_travelers")
      .select("cart_item_id, traveler_data")
      .eq("quote_id", quoteRow.id)).data ?? [] : [];
    const travelersByItem = new Map<string, any>();
    travelers.forEach((t: any) => travelersByItem.set(t.cart_item_id, t.traveler_data));

    const lines: any[] = [];
    let subtotal = 0;
    let taxesAndFees = 0;
    let total = 0;
    for (const cmp of completions) {
      const itemData: any = cmp.item_data || {};
      const sd: any = itemData.service_dates || {};
      const selectedProduct: any = itemData.selected_product || {};
      const start = sd.check_in || sd.checkIn || sd.start || sd.startDate || sd.depart || sd.date;
      const end = sd.check_out || sd.checkOut || sd.end || sd.endDate || sd.return;
      const tr = travelersByItem.get(itemData.cart_item_id) || null;
      const leadName = tr?.lead ? `${tr.lead.first_name || ""} ${tr.lead.last_name || ""}`.trim() : null;
      lines.push({
        type: cmp.item_type,
        name: itemData.name || cmp.provider || "Item",
        amount: Number(cmp.provider_cost || 0),
        dates: start ? (end && end !== start ? `${start} → ${end}` : start) : null,
        room: [selectedProduct.room_name, selectedProduct.rate_name].filter(Boolean).join(" · ")
          || sd.room || sd.room_type || null,
        pax: tr?.pax || sd.pax || null,
        travelers: leadName ? [leadName] : [],
      });
      subtotal += Number(cmp.provider_cost || 0);
      taxesAndFees += Number(cmp.tax_amount || 0) + Number(cmp.taai_service_fee || 0);
      total += Number(cmp.total_charged || 0);
    }

    const receiptNumber = `R-${new Date().getFullYear()}-${sessionId.slice(-8).toUpperCase()}`;
    const receiptJson = {
      receipt_number: receiptNumber,
      stripe_session_id: sessionId,
      created_at: new Date().toISOString(),
      currency,
      billed_to: {
        name: profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() : "Guest",
        email: profile?.email || "",
        phone: profile?.cell ? String(profile.cell) : "",
      },
      lines,
      totals: { subtotal, taxes_and_fees: taxesAndFees, total },
    };

    const pdfBytes = await buildPdf(receiptJson);
    const path = `${userId}/${receiptNumber}.pdf`;
    const { error: upErr } = await supabase.storage.from("receipts").upload(path, pdfBytes, {
      contentType: "application/pdf",
      upsert: true,
    });
    if (upErr) throw upErr;

    const { data: inserted, error: insErr } = await supabase
      .from("booking_receipts")
      .insert({
        user_id: userId,
        quote_id: quoteRow?.id ?? null,
        stripe_session_id: sessionId,
        receipt_number: receiptNumber,
        currency,
        total,
        receipt_json: receiptJson,
        pdf_path: path,
      })
      .select("id, pdf_path")
      .single();
    if (insErr) throw insErr;

    // Fire-and-forget email
    try {
      await supabase.functions.invoke("send-booking-receipt", {
        body: { receipt_id: inserted.id },
      });
    } catch (e) {
      console.error("send-booking-receipt failed", e);
    }

    // Fire-and-forget preference learning
    try {
      await supabase.functions.invoke("learn-booking-preferences", {
        body: { user_id: userId, stripe_session_id: sessionId },
      });
    } catch (e) {
      console.error("learn-booking-preferences failed", e);
    }

    return new Response(JSON.stringify({ ok: true, receipt_id: inserted.id, pdf_path: inserted.pdf_path }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-booking-receipt error:", e);
    return new Response(JSON.stringify({ error: "Failed to generate receipt" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
