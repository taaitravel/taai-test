
## Goal

Turn the current Stripe-only "charge a price snapshot" checkout into a real OTA booking flow that:

1. Knows exactly which provider/inventory each cart item came from.
2. Re-checks live availability & price the moment the user hits Book.
3. Charges via Stripe, then sequentially books each item with the right OTA, rolling back / refunding gracefully if something fails.
4. Hides provider plumbing from the UI but records everything for analytics + support.

## What we need per provider (the "params" question)

Each cart item must carry a normalized `provider_ref` blob so we can re-search and book without re-asking the user.

### Hotels
| Provider | Required identifiers | Booking call needs |
|---|---|---|
| Booking.com (RapidAPI) | `hotel_id`, `dest_id`, `search_type` | arrival_date, departure_date, adults, children ages, room_qty, currency, **guest name + email + phone**, **payment token / card** (RapidAPI booking endpoint is read-only today — for real booking we must use Booking.com Demand API or affiliate deep-link + commission) |
| Expedia Rapid (expedia13) | `property_id`, `room_id`, `rate_id` (token returned by price-check) | checkin, checkout, occupancy, lead guest (first/last/email/phone), payment (Expedia Rapid PCI proxy or our merchant of record), affiliate reference id |
| Amadeus Hotels | `hotelId`, `offerId` (must be re-priced — offers expire ~10 min) | guests[], payment.method = `creditCard` w/ card token, holderName, vendor, number, expiry, cvv |
| Direct / Airbnb | not bookable via API → store deep-link + mark `bookable: false` |

### Flights
| Amadeus Flight Offers | `offerId` (re-price via Flight Offers Price), travelers[] with **full legal name, DOB, gender, passport (intl)**, contact email/phone, payment | one-shot Flight Create Orders |
| Expedia Rapid Flight | early-access, not yet GA — keep behind a feature flag |

### Activities / Tours
| Amadeus Activities / Viator / GetYourGuide | `productId` / `optionId`, date, pax mix, language, pickup if needed |

### Restaurants
| Yelp / OpenTable / Resy | reservation API requires partner agreement; for now store deep-link + `confirmation_required_externally: true` |

### Cars
| Booking.com cars | search_key + vehicle_id, driver age, pickup/dropoff datetime+location, driver name, license, payment |

### What we (TAAI) need on file
- Stripe Connect / merchant account (already have STRIPE_SECRET_KEY) → charges the user.
- Per-OTA partner credentials in Supabase secrets:
  - `BOOKING_AFFILIATE_ID`, `BOOKING_API_KEY`
  - `EXPEDIA_RAPID_API_KEY`, `EXPEDIA_RAPID_SHARED_SECRET`, `EXPEDIA_AFFILIATE_ID`
  - `AMADEUS_CLIENT_ID`, `AMADEUS_CLIENT_SECRET`, `AMADEUS_BOOKING_ENABLED` (prod requires self-service production approval + IATA/ARC accreditation OR Amadeus virtual card)
  - `VIATOR_API_KEY` (if/when added)
- Per-user travel profile (already partially in `profiles`): legal first/last, DOB, gender, nationality, passport, frequent flyer, phone, billing address — surfaced at checkout instead of asked every time.
- A virtual card / corporate card to pay suppliers when we are merchant of record (Amadeus, Booking Demand). Stripe Issuing or Amadeus B2B Wallet.

## Data model changes

### `cart_items.item_data` — standardize a `provider_ref` block
Every search result writer (hooks: `useBookingAPI`, `useExpediaAPI`, `useAmadeusFlights`, `useAmadeusActivities`, Yelp) must persist:

```json
"provider_ref": {
  "provider": "expedia | booking | amadeus | yelp | viator | manual",
  "external_id": "string",          // hotel_id / offerId / propertyId
  "rate_token": "string|null",      // expires; needs re-price
  "search_params": { ... },         // exact params used so we can re-query
  "deep_link": "https://...",       // fallback if not bookable
  "bookable": true|false,
  "captured_at": "ISO"
}
```

Add columns (migration):
- `cart_items.provider` text NOT NULL DEFAULT 'manual'
- `cart_items.external_id` text
- `cart_items.rate_expires_at` timestamptz
- `cart_items.last_repriced_at` timestamptz
- `cart_items.last_price` numeric

### New table `booking_attempts` (per item, per provider call)
Tracks each live re-check / book / cancel for audit & support.

```
id uuid, user_id uuid, cart_item_id uuid, provider text,
phase text ('reprice'|'hold'|'book'|'cancel'),
request jsonb, response jsonb, success bool,
external_booking_ref text, error_code text, created_at timestamptz
```

### `bookings` (already exists) — extend
- add `provider text`, `provider_booking_ref text`, `supplier_charge numeric`, `commission numeric`, `cancellation_policy jsonb`, `voucher_url text`.

## Checkout flow (post-redesign)

```text
Cart page  ──►  POST /pre-checkout-validate
                  ├── for each item: call provider re-price/availability
                  ├── if price changed >2% or sold out → return diff to UI
                  └── return validated_items + signed quote_id (server stored)
            ──►  POST /create-booking-checkout (passes quote_id, NOT prices)
                  └── Stripe session with validated totals + metadata.quote_id
Stripe webhook  ──►  /booking-webhook
                       └── enqueue /booking-orchestrator (background)
Booking orchestrator (edge fn, runs sequentially):
   order = ['flight','hotel','activity','dining']
   for each item in order:
       call provider book API
       on success → bookings row + voucher
       on hard failure for flight/hotel → STOP, refund remaining items, notify user
       on activity/dining failure → continue, refund just that item
```

Why sequential & ordered: flights/hotels are the trip backbone; cancelling them later is expensive, so book them first. Activities/dining are low-stakes and refundable, so try them last.

## Edge functions to add / change

1. **`pre-checkout-validate`** (new) — fans out to provider-specific re-price helpers; persists `quote_id` (signed, 10-min TTL) in `booking_quotes` table; returns `{items, total, expires_at, diffs[]}`.
2. **`booking-orchestrator`** (new) — invoked by `booking-webhook` after `payment_intent.succeeded`. Reads `quote_id` from session metadata, executes provider books in the order above, writes `bookings` + `booking_attempts`, calls `stripe.refunds.create` for the failed slice.
3. Provider adapters (new internal modules under `supabase/functions/_shared/providers/`): `booking.ts`, `expedia.ts`, `amadeus.ts`, `viator.ts`, each exposing `reprice()`, `book()`, `cancel()`.
4. `create-booking-checkout` — switch to quote-based: accept `{quote_id}`, look up server-side validated items, do not trust client prices.
5. `track-booking-event` — already in place; orchestrator writes here too.

## Validation rules

- Reject any cart item whose `service_dates.start < today` (server-side, in `pre-checkout-validate`).
- Reject if `rate_expires_at < now` and re-price returns no inventory.
- If any required guest field missing (DOB/passport for intl flights), block checkout and surface a "Complete traveler profile" modal — but do NOT show provider names.

## UI changes (Cart / `/cart`)

- Replace static price list with a "Verifying availability…" step that calls `pre-checkout-validate` on mount.
- Show per-item state: ✅ Available · ⚠ Price changed $X → $Y (Accept/Remove) · ❌ Sold out (Remove).
- Reservation details inline per row: dates, guests, room/cabin — editable in a small drawer (writes back to `cart_items` and re-validates).
- Hide provider names entirely; show only "Confirmed via TAAI".
- "Book entire trip" CTA enabled only when all items are ✅; partial-book toggle for advanced users.

## Out of scope for this plan (flagged for follow-up)
- Becoming an IATA/ARC-accredited agent for direct Amadeus flight ticketing.
- Stripe Issuing virtual cards to pay suppliers when MoR.
- Real Booking.com Demand API onboarding (requires affiliate contract).
- Cancellation / modification UI for already-booked items.

## Deliverable order
1. Migration: `cart_items` columns + `booking_quotes` + `booking_attempts` + `bookings` extensions.
2. Standardize `provider_ref` write path in all search hooks.
3. `pre-checkout-validate` edge fn + provider reprice adapters (start with Expedia + Amadeus; Booking via deep-link until contract).
4. New Cart UI with live validation.
5. Switch `create-booking-checkout` to quote-based.
6. `booking-orchestrator` + extend webhook.
7. Refund + partial-failure path + email receipt with vouchers.
