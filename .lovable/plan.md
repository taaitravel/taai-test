# Embedded Checkout with Traveler Details

Today `/cart` redirects to Stripe's hosted page. We'll keep the cart as the basket, add a new `/checkout` page that collects traveler info, then mounts **Stripe Embedded Checkout** inline so the user never leaves our domain.

## Flow

```text
/cart  ──[ "Checkout this trip" ]──►  /checkout?quote_id=…
                                          │
                                          ├─ 1. Review summary
                                          ├─ 2. Traveler details forms
                                          └─ 3. Embedded Stripe Checkout (inline)
                                                       │
                                                       └─ on success → /booking-success
```

## 1. Cart page (`/cart`)
- Keep current `BookingCart`. Change `handleCheckout` so that after `pre-checkout-validate` succeeds, it **navigates to `/checkout?quote_id=<id>&itin=<itinNum>`** instead of calling `startCheckout` → Stripe redirect.
- Block navigation if any item is `expired_date | sold_out | needs_review` (already in place).

## 2. New `/checkout` route + page
`src/pages/Checkout.tsx` with three sections:

**a. Order Summary (sticky right, full-width on mobile)**
- Trip name, per-item rows (icon, name, dates, price), subtotal, taxes/fees, total, quote-expiry countdown.
- Hydrates from `booking_quotes` row via new `get-checkout-quote` edge function (or reuse `pre-checkout-validate` result passed via state).

**b. Traveler details (left)**
- Form fields rendered per item type, validated with Zod:
  - **Flight**: Lead traveler full legal name, DOB, gender, nationality, passport #, passport expiry, contact email + phone. Additional travelers if `pax > 1`.
  - **Hotel**: Lead guest full name, email, phone, special requests (optional), guest count.
  - **Activity / Car / Dining**: Lead name, email, phone, pax count, pickup/dropoff (cars).
- Save partial state to `localStorage` keyed on `quote_id` for refresh resilience.
- "Use my profile" autofill button (pulls from `profiles` table).
- On submit → POST to new edge function `save-traveler-details` which stores per-item JSON into a new `quote_travelers` table and returns `ready: true`.

**c. Embedded Stripe Checkout**
- Only mounts after traveler details are valid + saved.
- Calls updated `create-booking-checkout` with `{ quote_id, ui_mode: 'embedded' }`.
- Edge function returns `client_secret` (Stripe `ui_mode: 'embedded'`).
- Frontend uses `@stripe/react-stripe-js` `<EmbeddedCheckoutProvider>` + `<EmbeddedCheckout />` to mount inline.
- On `onComplete` → router push to `/booking-success?session_id=…`.

## 3. Backend changes

**Migration**
- New `quote_travelers` table:
  ```text
  id uuid pk
  quote_id uuid fk → booking_quotes
  cart_item_id uuid
  item_type text
  traveler_data jsonb   -- validated payload
  created_at, updated_at
  ```
  RLS: user owns the parent quote. Grants: `authenticated` select/insert/update, `service_role` all.

**Edge functions**
- `create-booking-checkout` (update): accept `ui_mode: 'embedded' | 'hosted'`. When embedded, create Stripe session with `ui_mode: 'embedded'` + `return_url`, return `{ client_secret, session_id }` instead of `url`. Require `quote_travelers` rows to exist for every cart item before creating the session — else return 409 with missing-item ids.
- `save-traveler-details` (new): validates + upserts `quote_travelers` rows for a `quote_id`. Server-side Zod by item type.
- `get-checkout-quote` (new, optional): returns the quote + cart items + saved traveler data so refresh works.

## 4. Frontend additions
- Add `@stripe/stripe-js` + `@stripe/react-stripe-js` (publishable key already injected by Lovable payments).
- New components under `src/components/checkout/`:
  - `OrderSummary.tsx`
  - `TravelerDetailsForm.tsx` (switches by item type)
  - `EmbeddedStripeCheckout.tsx`
- New hook `useCheckoutQuote(quoteId)`.
- Route added in `App.tsx`: `/checkout` (protected).

## Validation rules
- Reject submission if any service date is in the past (quote re-validated server-side).
- Names must match passport (flights).
- Email regex + E.164 phone format.
- Block "Pay" button until all required traveler fields per item are filled.

## Out of scope (for this pass)
- Real provider booking (Amadeus/Expedia/Booking) — still queued for the orchestrator. Embedded checkout will still trigger the existing `booking-webhook` on `checkout.session.completed`, which will read `quote_travelers` when it's ready to call providers.
- Saved travelers library / per-trip traveler reuse.
- Apple Pay / Google Pay button outside Stripe Element (Stripe handles inside).

## Deliverable order
1. Migration: `quote_travelers` table.
2. Edge fn: `save-traveler-details`, update `create-booking-checkout` for embedded mode.
3. Install Stripe React SDK.
4. `Checkout.tsx` page + components + route.
5. Cart navigation switch from Stripe redirect → `/checkout`.
6. Smoke test in test mode end-to-end.
