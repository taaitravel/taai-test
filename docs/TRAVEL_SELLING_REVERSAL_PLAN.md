# Travel selling reversal plan

taai is not a registered Florida Seller of Travel. Travel checkout stays off until that registration is active and counsel says the product may sell or collect payment for travel.

This file lists every switch to flip, in order. Do not flip them as part of a normal release.

## 1. Flags

Set both of these to the exact string `true` in the same release. Either one alone is not enough.

| Name | Where | What it unlocks |
|---|---|---|
| `VITE_TRAVEL_BOOKING_CHECKOUT` | Lovable / Vite env, then a new frontend publish | Shows `/cart`, `/checkout`, and `/booking-success`. Shows the cart icon and "Continue to cart". Restores "Add to Cart" on the price-snapshot form. |
| `TRAVEL_BOOKING_CHECKOUT_ENABLED` | Supabase Edge Function secret | Lets `create-booking-checkout` run. The function returns 403 while this is anything other than `true`. |

Files that read the frontend flag:

- `src/lib/features.ts`
- `src/App.tsx` (`/cart`, `/checkout`, `/booking-success`)
- `src/components/shared/CartIcon.tsx`
- `src/components/shared/MobileNavigation.tsx` (renders `CartIcon`)
- `src/components/itinerary/workspace/TripWorkspaceOverview.tsx`
- `src/components/itinerary/workspace/TripWorkspaceBookings.tsx`
- `src/components/booking/QuickAddToCart.tsx`
- `src/components/booking/BookingCart.tsx`
- `src/pages/Checkout.tsx`
- `src/hooks/useBookingCheckout.ts`

Edge functions that must stay refused until the secret is set:

- `supabase/functions/create-booking-checkout`
- `supabase/functions/get-checkout-quote`
- `supabase/functions/pre-checkout-validate`
- `supabase/functions/reprice-quote`

Quote and reprice functions are still deployed. They do not charge a card by themselves. Do not point the UI at them until the flag is on and the seller registration is active.

## 2. Copy to review before the flag goes on

These strings were changed so the live app talks about planning, not selling travel. Put the selling wording back only if counsel approves it.

| File | Current planning language |
|---|---|
| `index.html` | "plan, organize, split and remember" |
| `src/components/landing/BrightSections.tsx` | "Search, plan, and split costs" |
| `src/components/subscription/TierDefinitions.tsx` | Booking tax and fee lines removed. Unbuilt perks say "Coming soon". |
| `src/pages/CreateItinerary.tsx` | Miles and Bob plan. They do not book. |
| `src/components/booking/QuickAddToCart.tsx` | "Save to trip" while the flag is off |
| `src/lib/mcp/tools/about-taai.ts` and `supabase/functions/mcp/index.ts` | Site is `https://taai-travel.lovable.app`. About copy already says taai does not sell travel. |

Leave these as they are. They already say taai does not sell travel:

- `src/pages/Terms.tsx`
- `src/pages/PrivacyPolicy.tsx`
- `src/pages/Checkout.tsx` unavailable state

Subscription checkout (`create-checkout`, `customer-portal`, Profile → Billing) is a software subscription. It is not part of this flag.

## 3. Provider behavior that must stay reference-only until registration

- Duffel search (`flight-search` and Miles) requests offers only. It does not create orders or payments.
- Viator and Booking.com results open on the provider site.
- Miles flight cards set `bookable: false` and `commerceCapability: 'reference_only'`.

## 4. Deploy order when registration is active

1. Counsel confirms the registration and the words the product may use.
2. Set `TRAVEL_BOOKING_CHECKOUT_ENABLED=true` on the Supabase project.
3. Set `VITE_TRAVEL_BOOKING_CHECKOUT=true` and publish the frontend.
4. Re-read Cart and Checkout on `https://taai-travel.lovable.app` before telling anyone they can pay taai for travel.
