

# TAAI Booking Commerce Engine -- Infrastructure Plan

## Current State

You have:
- **Search APIs**: Booking.com, Amadeus (flights/activities), Yelp, Expedia -- all returning real data
- **Cart system**: `cart_items` table storing search snapshots with prices
- **Bookings table**: `bookings` table that currently just records a local booking reference (no real reservation)
- **Stripe**: Already integrated for subscriptions (not for booking payments)
- **No actual reservation execution**: The "Book" button today creates a local record but contacts zero providers

## The Hard Truth About Real Reservations

Before building anything, you need to understand the provider landscape:

| Provider | Can You Book Programmatically? | Requirements |
|----------|-------------------------------|-------------|
| **Booking.com** | Yes, via Affiliate Partner Program | Must apply as an affiliate partner; get commission 25-40% of Booking.com's commission (not the room rate). Requires IATA or business registration. |
| **Amadeus** | Flights: Yes (with NDC/GDS access). Activities: No (Amadeus POI is discovery only, not bookable). | IATA accreditation for flights. Enterprise agreement for booking APIs. |
| **GetYourGuide** | Yes, via Partner API | Must apply as a partner/affiliate. Commission ~8% of activity price. |
| **Viator (TripAdvisor)** | Yes, via Viator Partner API | Affiliate program. Commission ~8%. |
| **Yelp** | No -- Yelp is discovery only | Cannot book restaurants via Yelp API. For restaurant reservations: OpenTable or Resy APIs. |
| **Expedia** | Yes, via Rapid API or EPS (Expedia Partner Solutions) | Affiliate or merchant model. IATA helps but not always required for hotels. |

**Key takeaway**: You need affiliate/partner agreements with each provider before you can execute real bookings. Some of these take weeks to set up.

## Recommended Architecture

Since you cannot immediately book on every platform, the architecture should support two modes:

1. **Affiliate link mode** (launch fast): Redirect users to the provider's checkout with your affiliate tracking. You earn commission on completed bookings. No PCI burden. No need to collect credit cards.

2. **Merchant mode** (future, requires IATA/partner agreements): TAAI collects payment via Stripe, then books on behalf of the user using provider APIs. This is where you'd charge your service fee + pass through the booking cost.

I recommend starting with **affiliate link mode** for hotels/activities and building toward merchant mode as you secure partnerships.

## Implementation Plan

### Phase 1 -- Booking Intent Capture (what you can build now)

**Goal**: Track every user interaction from discovery to purchase intent.

Database changes:
- New `booking_intents` table: captures when a user clicks "Book" or "Add to Itinerary" with full item metadata (provider, dates, guest count, price snapshot, etc.)
- New `booking_completions` table: records confirmed bookings with provider confirmation codes, receipt data, financial breakdown
- Add `booking_status` enum column to `cart_items`: `browsing` → `interested` → `checkout_started` → `booked` → `cancelled`

Edge function:
- `track-booking-event`: logs intent events (view, add-to-cart, checkout-start, booking-complete) with timestamps and item data

### Phase 2 -- Checkout Flow via Stripe

**Goal**: Use Stripe as the payment processor for booking transactions (separate from subscriptions).

How it works:
- User selects items to book → enters guest details (names, dates, room preferences)
- TAAI creates a Stripe PaymentIntent for the total amount (item cost + TAAI service fee)
- User pays via Stripe Checkout (PCI-compliant, handles card storage, CVV never touches your server)
- On successful payment → TAAI records the charge and initiates the provider booking

New edge functions:
- `create-booking-checkout`: Creates a Stripe Checkout session for booking items (not subscriptions). Calculates total = provider cost + TAAI service fee (e.g., 5-10% or flat fee). Stores itemized breakdown.
- `booking-webhook`: Stripe webhook that fires on `payment_intent.succeeded` → triggers provider booking execution
- `process-booking`: After payment confirmed, calls provider APIs to create the actual reservation

Stripe handles:
- Card collection and storage (no CVV ever stored on your side)
- Saved payment methods via Stripe Customer objects (already created for subscription users)
- Receipts with tax breakdowns (Stripe Tax)
- Refunds if booking fails

### Phase 3 -- Provider Booking Execution

**Goal**: Actually make reservations on partner platforms after payment is confirmed.

For each provider, a dedicated edge function:
- `book-hotel`: Calls Booking.com/Expedia partner API with guest details, dates, room type, payment confirmation
- `book-activity`: Calls GetYourGuide/Viator API with participant details, date, activity ID
- `book-flight`: Calls Amadeus booking API with passenger details, flight offer ID (requires IATA)
- `book-restaurant`: Calls OpenTable/Resy API with party size, date, time

Each function:
1. Validates payment was received
2. Sends booking request to provider with all required fields
3. Receives confirmation code / booking reference
4. Stores confirmation in `booking_completions`
5. Sends receipt notification to user
6. If booking fails → initiates automatic refund via Stripe

### Phase 4 -- Financial Infrastructure

**Goal**: Track commissions, fees, and reconcile payments.

Database:
- Enhance `booking_completions` with: `provider_cost`, `taai_service_fee`, `taai_commission` (from affiliate), `stripe_fee`, `tax_amount`, `net_revenue`
- New `financial_ledger` table for double-entry tracking of all money movement

Commission model:
- **TAAI service fee**: Fixed percentage (e.g., 8%) added on top of provider price, clearly shown to user at checkout
- **Affiliate commission**: Earned from providers (varies by partner). Tracked separately, reconciled monthly.
- **IATA considerations**: For flight bookings, IATA accreditation (or working with a host agency) is required. Until then, flights use affiliate links only.

### Phase 5 -- Post-Booking Management

**Goal**: Let users view, contact providers about, and request changes to bookings.

UI:
- Booking confirmation card on itinerary page showing: confirmation code, provider contact info, dates, guest details
- "Contact Provider" button (opens email/phone to hotel/airline)
- "Request Change" button → creates a change request record (TAAI can relay to provider or user contacts directly)
- Dates and core details are **read-only** after booking (user must contact provider to change)
- Editable fields: special requests, notes, internal labels

### Phase 6 -- Security and Compliance

- **PCI compliance**: Stripe handles all card data. TAAI never sees or stores raw card numbers or CVV. Stripe Elements or Checkout is the only payment UI.
- **Saved payment methods**: Managed entirely through Stripe Customer portal (already built for subscriptions)
- **Data encryption**: Booking PII (guest names, passport numbers if needed for flights) stored encrypted in Supabase using `pgcrypto` or handled only in transit
- **Audit trail**: All booking state changes logged in `booking_audit_log` (already exists)

## What You Need Before I Can Build Each Phase

| Phase | Can Build Now? | Blockers |
|-------|---------------|----------|
| Phase 1 (Intent Tracking) | Yes | None |
| Phase 2 (Stripe Checkout for Bookings) | Yes | None -- Stripe key already configured |
| Phase 3 (Provider Booking) | Partially | Need affiliate/partner API keys for each provider. Booking.com affiliate ID, GetYourGuide partner key, etc. |
| Phase 4 (Financials) | Yes (structure) | Commission rates depend on partner agreements |
| Phase 5 (Post-Booking) | Yes | None |
| Phase 6 (Security) | Yes | None |

## Immediate Next Steps

I can start building **Phases 1 and 2** right now -- the intent tracking database, the Stripe booking checkout flow, and the booking management UI. Phase 3 (actual provider API calls) requires you to have partner/affiliate agreements in place, but I can scaffold the functions with the expected API contracts so they're ready to plug in.

Tell me when you're ready and I'll start with the database migration and Stripe booking checkout.

