## Wire up embedded Stripe Checkout

Now that `STRIPE_PUBLISHABLE_KEY` is stored as a secret, here's the plan to connect it to the UI.

### 1. New edge function: `get-stripe-config`
- Returns `{ publishable_key: Deno.env.get("STRIPE_PUBLISHABLE_KEY") }`
- `verify_jwt = false` (publishable key is safe to expose, but routing it through an edge fn keeps test/live switching server-side)
- Registered in `supabase/config.toml`

### 2. New hook: `useStripePublishableKey`
- Calls `get-stripe-config` once on mount, caches via React Query
- Used to lazy-init `loadStripe(...)` so the Stripe.js bundle only loads when needed

### 3. New checkout route: `/checkout`
- `CheckoutPage.tsx` with two stages:
  1. **Traveler details form** — renders one section per cart item based on `item_type` (flight: DOB + passport; hotel: name + email; activity/car/dining: name). On submit calls `save-traveler-details`.
  2. **Embedded Stripe Checkout** — once travelers are saved, calls `create-booking-checkout` with `ui_mode: "embedded"`, gets `client_secret`, and mounts `<EmbeddedCheckoutProvider>` + `<EmbeddedCheckout>`.
- On refresh, calls `get-checkout-quote` to hydrate state (handles expired quotes with a "Return to cart" CTA).

### 4. New route: `/checkout/return`
- `CheckoutReturnPage.tsx` reads `session_id` from query string, polls `create-booking-checkout` (or a small `get-checkout-status` fn) for `status`, and routes to a success or retry view.

### 5. Update `BookingCart.tsx`
- "Proceed to Checkout" button → creates quote via `pre-checkout-validate`, then navigates to `/checkout?quote_id=...` (instead of directly opening Stripe).

### 6. Router
- Add `/checkout` and `/checkout/return` to `App.tsx` (authenticated routes).

### Technical notes
- `@stripe/stripe-js` + `@stripe/react-stripe-js` are already installed.
- `return_url` passed to Stripe will be `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`.
- Traveler validation is enforced server-side in `create-booking-checkout` (409 if missing), so the UI just has to surface that error.
- No DB changes — `quote_travelers` table already exists.

### Out of scope
- Real Booking.com / Amadeus inventory confirmation
- Refund / cancellation UI
- 3DS edge cases beyond what embedded Checkout handles natively
