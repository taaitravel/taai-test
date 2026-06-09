## 1. Total — visual polish

In `src/pages/Checkout.tsx` (price-breakdown footer and the sticky mobile bar):
- Render the grand total in `font-bold`, ~`text-3xl` (currently base size), and use the brand pink (`text-primary` / the same rose-coral gradient color from the active search-tab token).
- Keep the "EUR" suffix in a smaller muted weight next to it so the number reads as the hero.
- No layout/business changes — pure presentation.

## 2. How the current "availability check" actually works (today's behavior)

This is the honest picture of what the engine does right now so we can design the fix:

- **On page load** → `get-checkout-quote` only **reads the booking_quotes row** that was created back on the Cart page. It does NOT re-contact Booking.com / Amadeus / Expedia. So the price you see is whatever was frozen when you clicked "Checkout" in the cart.
- **`pre-checkout-validate`** (the function that creates the quote) is also a **stub**: `repriceItem()` re-reads `cart_items.price` and flags "price_changed" only if the cart row's `price` differs from `last_price`. No live provider call.
- **Changing dates / guests / room** in the checkout form currently updates **local React state only**. The quote row, the cart_item, and the Stripe line items are NOT touched. Continue-to-payment still bills the original frozen price.
- The quote auto-expires after **10 minutes** (`expires_at` in `booking_quotes`). After that the page shows the "Quote expired" card.

So today: load = frozen snapshot, edits = cosmetic, payment = original price. That's the gap to close.

## 3. Make the checkout dynamic — live re-quote on every meaningful change

### New edge function: `reprice-quote`
Inputs: `quote_id`, and per-item overrides `{ cart_item_id, check_in, check_out, pax, room_code? }`.
Responsibilities:
1. Auth + ownership check on the quote.
2. For each item, dispatch to the right provider adapter based on `provider`:
   - `booking_com` / `expedia` / `vrbo` → call the existing `booking-com-api` / `expedia-rapid-api` edge function with the new dates+guests, pull the lowest matching rate for the requested `room_code` (or cheapest standard if none chosen).
   - `amadeus_flight` → call `amadeus-flights` with the new pax count (date changes for flights are out of scope for v1 — show a banner saying "flight dates can't be changed here").
   - `amadeus_activity` → call `amadeus-activities` with the new date/pax.
   - `manual` / `needs_review` → keep current price, return `status: 'manual'`.
3. Update the matching entry in `booking_quotes.items` (price, service_dates, room label, status), recompute `provider_total`/`taxes_and_fees`/`total`, write `last_repriced_at`, and **push `expires_at` forward by another 10 min** on every successful reprice so the user doesn't get kicked out while editing.
4. Return the refreshed quote breakdown.

### Frontend wiring (`src/pages/Checkout.tsx`)
- On mount, after `get-checkout-quote` resolves, fire one `reprice-quote` call to refresh against live providers (shows a small "Checking live availability…" pill on the price card).
- Wrap the date pickers, guest stepper, and room selector in a **debounced 600 ms** `useEffect` that calls `reprice-quote` whenever any of those values change for any item.
- During an in-flight reprice: dim the price breakdown, show a spinner next to the total, and disable "Continue to payment".
- On result:
  - If `status === 'sold_out'` for the requested combination → red banner under that item: "These dates/room are no longer available — pick different ones." Keep the user on the page.
  - If `status === 'price_changed'` → amber inline note with the old vs new nightly rate.
  - Update local `items` and `datesByItem` from the server response (server is now the source of truth).
- Persist edits: when a reprice succeeds, also update the underlying `cart_items.item_data.service_dates` and `price` so the cart and any downstream itinerary stay in sync.

### Database (single migration)
- `booking_quotes`: no schema change needed — `items` is already jsonb and we already store `provider_total / taxes_and_fees / total / expires_at`.
- `cart_items`: already has `last_repriced_at` and `last_price`.
- Add a small `quote_reprice_events` table for observability: `id, quote_id, cart_item_id, old_price, new_price, status, reason, created_at`. Grants for `authenticated` (select own) + `service_role` (all). RLS scoped via the parent quote's `user_id`.

## 4. Fix "Could not start payment — Edge Function returned a non-2xx status code"

Two likely culprits in `create-booking-checkout` for an embedded session:
- `customer_update: { address: "auto" }` requires `billing_address_collection`/customer-provided address; in `ui_mode: 'embedded'` without those it 400s.
- `automatic_tax: { enabled: true }` requires the customer to have an address; on a brand-new customer it also 400s.

Plan:
1. Add a `console.error` of the Stripe error message in the catch block and surface `err.message` (not a generic string) so the UI shows the real reason.
2. For embedded mode, drop `customer_update.address: "auto"` and set `billing_address_collection: 'auto'` instead; keep `automatic_tax` only when the customer already has an address, otherwise compute taxes ourselves (we already do) and skip `automatic_tax`.
3. Verify `STRIPE_SECRET_KEY` is configured (will check in the secrets panel before deploying).
4. Re-test the same quote — the toast will now show the precise Stripe error if anything is still off.

## 5. Technical summary (for the dev-savvy reader)

```
Files touched
  src/pages/Checkout.tsx                              # styling + reprice wiring + UX states
  supabase/functions/create-booking-checkout/index.ts # embedded-mode Stripe params + better error
  supabase/functions/reprice-quote/index.ts           # NEW — provider-aware reprice
  supabase/migrations/<ts>_quote_reprice_events.sql   # NEW — observability table + grants + RLS

Out of scope for v1 (call out to user)
  - Flight date/route changes mid-checkout (Amadeus reshop is its own flow)
  - Multi-room hotel reprice (we'll reprice the currently selected room only)
  - Yelp/Dining (still on hold per earlier decision)
```

## Question before I build

Confirm two things so I don't over-build:
1. **Room selector** — there's no room dropdown today (just "Standard (to be confirmed)"). Should I add a real room-type dropdown driven by Booking.com's room list, or keep "Standard" and only re-price on dates/guests for v1?
2. **Auto-reprice on load** — OK to do it silently (just refreshes numbers), or do you want a confirm step ("Prices updated, review before continuing")?
