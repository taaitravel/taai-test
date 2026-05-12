# Tiered TAAI Fee + End-to-End Booking Fulfillment (revised)

## Part 1 — Tiered admin fee, presented as a single "Taxes & Fees" line

User-facing display rule: never show the fee separately. Cart, search cards, checkout button, and trip totals show one combined line:

> **Taxes & Fees** — 8% / 7.7% / 7.35%

| Subscription tier | Combined rate shown | Composition (internal) |
|---|---|---|
| `traveler` (free) | **8.00%** | 7% sales tax + 1.00% TAAI fee |
| `taai_traveler` | **7.70%** | 7% sales tax + 0.70% TAAI fee |
| `taai_traveler_plus` / corporate / enterprise | **7.35%** | 7% sales tax + 0.35% TAAI fee |

The split (sales tax vs. TAAI fee) appears **only in the post-purchase invoice / receipt PDF / `booking_completions` record** for accounting and legal compliance. Search cards, cart line items, and checkout buttons show only the combined %.

### Files touched
- `src/lib/bookingFees.ts` (new) — single source: `SALES_TAX_RATE = 0.07`, `getTaaiFeeRate(tier)` → `0.01 | 0.007 | 0.0035`, `getCombinedRate(tier)`, `computeBookingTotals({ subtotal, tier })` returning `{ subtotal, taxesAndFees, total, _breakdown: { salesTax, taaiFee } }` (breakdown only consumed by receipt/ledger code).
- `src/hooks/useTaxesAndFeesRate.ts` (new) — reads tier from `useSubscription`, returns `{ combinedRate, label }`.
- `src/components/booking/BookingCart.tsx` — replace the two separate lines ("TAAI Travel Admin Fee", "Taxes (7%)") with one **"Taxes & Fees (X.XX%)"** line for both per-trip and grand totals.
- `supabase/functions/create-booking-checkout/index.ts` — recompute server-side from authoritative tier, push split (`sales_tax`, `taai_fee`, `combined_rate`) into Stripe metadata for the invoice.
- `supabase/functions/booking-webhook/index.ts` — persist split into `booking_completions.tax_amount` and `booking_completions.taai_service_fee`.
- `src/components/subscription/TierDefinitions.tsx` — add a feature line per tier ("Taxes & Fees: 8.00% / 7.70% / 7.35%") so users see the value when picking a tier. **No fee callouts on search cards.**

## Part 2 — Booking lifecycle integrated into the existing itinerary

No separate `/bookings/:id` page. Confirmed bookings update the **existing itinerary card in place** with full details and the `booking_status` flips from `pending` → `booked`.

### Card "Booked" state additions (per item type)
Rendered on `ItineraryCard` and the per-day event row:
- **Hotel** — Confirmation #, hotel name & address, check-in / check-out, # of rooms, # of adults / children, room type, cancellation deadline, hotel phone & email, "Manage / contact" button.
- **Flight** — Confirmation # (PNR), airline record locator, all passenger names, flight numbers, dep/arr times, seat #s if assigned, baggage, "Check in" deep-link.
- **Activity** — Confirmation #, time slot booked, # of guests, meeting point, operator phone, voucher PDF link.
- **Restaurant (where bookable)** — Confirmation #, party size, time, restaurant phone.

A green "Booked" badge replaces the "Pending"/"In cart" badge. The card pulls these fields from `booking_completions` (joined to the itinerary item) so the itinerary becomes the single source of truth for the trip.

### Lifecycle

```text
Search → Add to Cart (with rooms/pax/dates already captured)
   ↓
Cart: per-line / per-trip / all-trips checkout
   ↓
Missing-Details Modal — only collects fields the provider API requires
that we don't already have (lead guest legal name, email, phone, DOB,
passport for international flights, time-slot pick from provider options)
   ↓
[1] Stripe authorization (manual capture) → TAAI bank
   ↓
[2] Provider booking call (Amadeus / Booking via RapidAPI / activity API)
   ↓
[3a] Provider success → capture charge → write booking_completions
     → cart_item.booking_status = 'booked'
     → itinerary card flips to Booked with all fields above
[3b] Provider failure & no fallback → void Stripe auth, notify user
[3c] Provider has no programmatic booking → fall back to affiliate
     deep-link (no charge) and mark item as "external booking pending"
   ↓
[4] Receipt email + in-app notification (split shown here only)
   ↓
[5] Provider payout job pays the hotel / operator from TAAI bank
```

### Customer-first fallback rules
For any item the platform cannot book programmatically (e.g. small Yelp restaurants, niche tour operators):
1. Prefer **affiliate / referral link** if the provider has one (we earn commission, customer books on the provider's site).
2. Else **redirect** to the provider's own booking page with prefilled query params and mark the cart item as "Booked externally — confirmation pending."
3. Never block the customer in the cart waiting for a booking we can't actually make.

## Phasing (revised)

1. **Part 1 — tiered fee + single "Taxes & Fees" line + server enforcement.** This session.
2. **Phase A — Missing-Details Modal + manual-capture Stripe + `fulfill-booking` edge function** that calls the right provider, captures the charge on success, and updates the itinerary card. Includes affiliate/redirect fallback. ~2–3 sessions.
3. **Phase B — Provider payout pipeline + financial ledger correctness.** ~2 sessions, mostly backend.
4. **Phase C — Receipt PDF (with the legal split), email templates, change-request flow on the itinerary card.** ~1 session.

## Provider payout — what TAAI needs from you

You asked specifically about programming the payout to the hotel/API. The mechanics depend on each provider's commercial model. None of this can be wired up purely in code — it requires TAAI's real-world business credentials. Here's what's needed per channel:

### A. Booking.com via RapidAPI (current integration)
RapidAPI's Booking.com endpoints are **search/aggregator only**; they do not transact bookings. To actually book and remit funds you must move to one of:
- **Booking.com Affiliate Partner Program** — referral model, customer pays Booking.com directly, TAAI earns commission (no payout to hotel needed). Easiest path. Requires: TAAI legal entity, website URL approval, banking info for commission.
- **Booking.com Demand API (B2B / Connectivity Partner)** — TAAI is the merchant of record, charges customer, pays Booking.com (who remits to the hotel). Requires application, contract, IATA or similar travel agency accreditation, KYC, and a wholesale agreement. Months-long onboarding.

### B. Amadeus (flights + activities)
- Amadeus Self-Service APIs (current Amadeus key) are **test/staging only** — they cannot ticket real flights.
- Production requires the **Amadeus for Developers Production access** *plus* one of:
  - An **IATA / IATAN number** (TAAI is a recognized agency), or
  - A consolidator agreement (a host agency tickets on TAAI's behalf and shares revenue).
- Settlement to airlines happens via **BSP (Billing Settlement Plan)** weekly clearing — TAAI needs an active BSP account tied to the IATA number. This is a bank-to-bank ACH/wire process, not an API call.

### C. Activities (Viator / GetYourGuide / Klook)
All three offer affiliate APIs (referral revenue) and full booking APIs (merchant-of-record). Affiliate is fastest; merchant requires a contract, banking info, and tax forms (W-9 in US).

### D. Restaurants
No public reservation API exists for Yelp or OpenTable at small-business scale. Stay on **affiliate/redirect** indefinitely.

### What we need from your end to unblock real fulfillment
Please confirm which of these TAAI already has or wants to pursue:

1. **Legal/business** — TAAI's registered legal name, country of incorporation, business address, EIN/VAT, bank account for payouts in.
2. **Travel agency credentials** — IATA / IATAN / ARC accreditation number (yes/no, in progress, or not pursuing).
3. **Booking.com** — Affiliate ID *or* Demand API contract status. If neither, we ship Phase A as **affiliate-link redirects** for hotels.
4. **Amadeus** — Production access status. Without it + IATA, flights stay in **affiliate / "search-only" mode** and hand off to Skyscanner/Kiwi affiliate links at checkout.
5. **Activities provider choice** — Viator, GetYourGuide, or Klook? (Pick one to start.) Affiliate or merchant?
6. **Stripe Connect (optional)** — If TAAI uses Stripe Connect for payouts to hotels/operators, we'll need the Connect platform enabled in Stripe; otherwise payouts go via standard ACH/wire from TAAI's bank, scheduled by an internal cron.

Until items 2–4 are decided, the only legally-safe production path is **affiliate redirects** for everything we can't book ourselves. The code being built in Phase A handles both modes from day one — we flip a per-provider flag when each contract is in place.

## Out of scope (this plan)

- Multi-currency settlement (USD only at launch).
- Group/split payments across multiple cards.
- Real-time hotel inventory holds (we rely on provider's own hold semantics).

## Notes

- Receipt/invoice (Phase C) is the **only** surface that displays the breakdown (Sales tax 7.00% + TAAI fee 0.35% = 7.35%) — required for accounting and tax remittance.
- Tier is read server-side from `subscribers.subscription_tier`; client value is display-only and never trusted at checkout.
- Stripe Tax stays enabled (`automatic_tax: true`) for legally-correct collection per jurisdiction; the displayed combined % is informational.
