
# Checkout v2 — OTA-style review, receipts, and per-person split

Turn the current bare traveler form into a proper booking-review checkout that shows everything a traveler expects (dates, room, guests, totals, policies), prefills what we know about them, and emits a real receipt (email + PDF) after payment. Also lay the foundation for per-person checkout and preference learning.

## 1. Item details surfaced on the checkout page

For each cart line render an OTA-style summary block with:
- Dates: check-in → check-out (hotels), depart/return (flights), date+time (activities). If no dates were captured, default to **today → today + relevant duration** (hotel = 2 nights, flight = +0, activity = today) and label it "Tentative — confirm before paying" with a date picker inline.
- Nights / duration auto-computed.
- Room/cabin/seat info from `item_data` (bed type, occupancy, board basis, fare class, etc.) when present; otherwise show "Room: standard (to be confirmed)".
- Guests/pax count, with +/- stepper that drives the traveler form rows below.
- Per-item price breakdown: nightly rate × nights, taxes/fees portion, total.
- Policy snippet: cancellation, payment timing, change fee — pulled from `item_data.policies` when present, else a sane default ("Free cancellation 48h before check-in. Non-refundable after.") flagged as "default policy — confirm with provider".
- Availability re-check status (already exists) shown inline next to the dates.

All numbers run through a shared `formatMoney(amount, currency)` helper using `Intl.NumberFormat(locale, {style:'currency', currency})` so `$1,435.21 USD` / `€10.116,25 EUR` / `¥10,000 JPY` render correctly. Currency comes from the user's profile preference (already stored, see `profile-preferences-currency` memory). Add `formatMoney` to `src/lib/utils.ts`.

## 2. Traveler prefill from profile

Before showing the form:
1. Fetch the current user's profile (name, email, phone, dob, nationality, passport number/expiry, frequent-flyer numbers) plus saved companions/travelers from a new `saved_travelers` table.
2. Prefill the **lead traveler** row with the profile data. User can edit, but no retyping required.
3. For additional pax, show a "Pick from saved travelers" combobox + an "Add new" inline form. New entries can be saved back to `saved_travelers` with a checkbox.
4. Only render fields actually required by the item type (already in `fieldsFor`); collapse advanced fields (passport, DOB) behind "Show travel docs" for hotels/activities that don't strictly need them.

New table `saved_travelers (id, user_id, label, first_name, last_name, email, phone, dob, nationality, passport_number, passport_expiry, is_self, created_at)` with RLS scoped to `auth.uid()`, plus standard GRANTs.

## 3. Cost & policy breakdown component

A `<BookingBreakdown items={...} currency={...}/>` panel that lives both:
- On the checkout review page (sticky on desktop, collapsible drawer on mobile), and
- Inside the post-payment receipt + PDF.

Shows: per-item subtotal lines (with nights × rate), provider taxes, platform service fee (8% per existing booking-engine memory), discount lines, grand total. Each line is itemised so two nights in the same hotel in different rooms render as two rows.

A `<PolicySummary items={...}/>` block lists cancellation/change/refund policy per item with iconography.

## 4. Receipts: email + downloadable PDF

After `booking-webhook` confirms a session:
- Generate a canonical `receipt` JSON: org logo, booking ref, traveler(s), itemised lines, totals, currency, policies, payer, per-person split (see §5).
- Render PDF via a new edge function `generate-booking-receipt` using `pdf-lib` (Deno-compatible). Store in a new `receipts` storage bucket (private) and return signed URL.
- Send email via Resend (already integrated for verification per `email-verification-resend-integration` memory) using a new `send-booking-receipt` function with an HTML template mirroring the PDF.
- Add a "Download receipt" button on `BookingSuccess.tsx` and persist `receipt_pdf_path` on the booking row so it's retrievable later from the trip page.

New table `booking_receipts (id, user_id, booking_id, receipt_json jsonb, pdf_path text, sent_to text[], created_at)` + RLS + GRANTs.

## 5. Per-person ("slice") checkout & payer-credit

Build on the existing `cart_item_splits` table (already in use via `SplitChip`):
- **Mode A — Single payer (default):** one user checks out, the full amount is added to the trip budget as a credit owed by other participants. After payment, write split-debt rows to a new `trip_balances_ledger` so the trip's budget view shows "X owes payer $Y".
- **Mode B — Slice checkout:** each participant pays their share via their own Stripe session. The Checkout page detects existing splits and offers "Pay full now" vs "Pay only my slice ($X.XX)". Slice sessions reference the same `quote_id` and only finalise the booking once all slices are paid (or the payer opts to advance with partial collection).

UI: toggle at the top of the review step. Splits already-defined in the cart carry through; if none defined the user can split inline before paying.

## 6. Preference learning groundwork

Start capturing signals so future checkouts can be even more automated:
- New table `user_booking_preferences (user_id pk, preferred_room_type, preferred_bed, preferred_seat, preferred_meal, preferred_cabin_class, last_traveler_doc_used uuid, default_payer_mode text, updated_at)`.
- After every successful booking, an edge function `learn-booking-preferences` updates the row with the values just used (last-write-wins for now; we can move to a frequency model later).
- On the checkout page, prefill room/seat/etc. selections from this table when the item supports it.

## 7. Mobile/visual polish

- Sticky bottom action bar on mobile with "Continue to payment — $1,550.02".
- Collapsible accordions per cart item so a 6-line booking stays scannable.
- Use semantic tokens only; no hardcoded colors. Honour the existing dark theme and `pb-24` mobile clearance rule.

---

## Technical notes

- Frontend: refactor `src/pages/Checkout.tsx` into `Checkout.tsx` + `components/checkout/{ItemReviewCard, BookingBreakdown, PolicySummary, TravelerForm, SavedTravelerPicker, SplitToggle, StickyCheckoutBar}.tsx`. Keep the existing `loading | travelers | payment | expired` stage state and add a `review` stage between `loading` and `travelers` (or fold travelers into the review step so it's one scroll).
- Backend changes:
  - Extend `get-checkout-quote` response with `profile`, `saved_travelers`, `preferences`, and ensure `service_dates`, `room`, `pax`, `policies` are projected per item.
  - `pre-checkout-validate` and `create-booking-checkout`: accept and persist edited `service_dates`, `pax`, `room_selection` from the review step into `booking_quotes.items` so the Stripe line items reflect what the user saw.
  - New functions: `generate-booking-receipt`, `send-booking-receipt`, `learn-booking-preferences`, `create-split-checkout-session` (slice mode).
  - `booking-webhook` triggers receipt generation + email + preference learning.
- Migrations (one file): create `saved_travelers`, `user_booking_preferences`, `booking_receipts`, `trip_balances_ledger`, plus `receipts` storage bucket. All with RLS scoped to `auth.uid()` and explicit `GRANT`s per project rules.
- Money formatting: single `formatMoney` util; remove ad-hoc `$${n.toFixed(2)}` everywhere it appears in checkout/cart/receipt code paths.
- PDF: `pdf-lib` from esm.sh in the receipt function; load logo from a public URL in `public/`.
- Secrets needed: `RESEND_API_KEY` (already present per memory). No new secrets.
- Empty-state default dates: hotel 2 nights starting today, flight today one-way, activity today — surfaced as editable, with a clear "tentative" badge so the user always confirms.

## Out of scope (call out, do later)

- True multi-party orchestration of slice payments (escrow until all collected) — v1 simply records who paid what and surfaces balances.
- Provider-authoritative cancellation policies — until each provider integration returns real policy text we show defaults with a clear disclaimer.
- Frequency-weighted preference model — v1 is last-write-wins.

---

## Question before I build

Two quick decisions that change scope materially:

1. **Default payer mode** — should single-payer (Mode A, payer fronts the cost and gets credited in the trip budget) be the default and slice checkout be opt-in, or the other way around?
2. **Receipt branding** — do you have a final logo + brand name to bake into the PDF/email templates now, or should I use the current TAAI/Lovable placeholder and you'll swap it later?

I'll proceed with Mode A default + current placeholder logo unless you say otherwise.
