# Cart by Itinerary + Book button explanation

## What the "Book" button does today

The **Book** button on each cart row (and the big **Secure Checkout** button) does the same thing — it calls `useBookingCheckout.startCheckout(items)`, which:

1. Logs a `checkout_start` event into `booking_intents` for each item.
2. Invokes the `create-booking-checkout` edge function. That function builds a Stripe Checkout Session with:
   - one Stripe line item per cart item (provider price)
   - one extra line item for the **8% TAAI Management Fee**
3. Returns a Stripe-hosted checkout URL and redirects the browser to Stripe.
4. After the user pays, Stripe calls our `booking-webhook`, which inserts a row into `booking_completions`, writes double-entry rows into `financial_ledger`, and flips the `cart_items.booking_status` to `booked`.

So **Book = pay now via Stripe** for that single item; **Secure Checkout = pay now via Stripe** for everything in the cart in one session.

> Note: this charges the customer through Stripe, but it does **not** yet hit any provider booking API (Booking.com / Amadeus / Expedia). That part of the flow is scaffolded but unwired — confirmation today is "we received your money," not "the hotel has your reservation." Worth flagging before any real launch.

## Group cart by itinerary

### Goal
On `/cart` (and inside the embedded BookingCart), group items by the trip they were saved into, so the user can see and check out per trip.

### Data
`cart_items.itinerary_id` is the `itin_id` (uuid) of the trip the item was saved to. Some items have no `itinerary_id` (added without picking a trip) — those go in an **Unassigned** group.

### UI changes (single file: `src/components/booking/BookingCart.tsx`)

```text
┌─ Trip: Lisbon Getaway ─────── 4 items ─┐
│  • Hotel Bairro Alto      $420   [Book] [x] │
│  • Flight LIS              $310   [Book] [x] │
│  Subtotal $730 + Fee $58.40 = $788.40        │
│  [Checkout this trip — $788.40]              │
└──────────────────────────────────────────────┘

┌─ Trip: Tokyo 2026 ─────────── 2 items ─┐ ...

┌─ Unassigned ─────────────── 1 item ─┐ ...

──────────────────────────────────────────
Grand total across all trips: $1,942.10
[Checkout everything]
```

- Fetch trips referenced by the cart (one extra query: `itinerary` where `itin_id in (...)`) to display trip names.
- Each group is a collapsible card with: trip name, item count, the existing item rows, its own subtotal/fee/total, and its own **Checkout this trip** button (calls `handleCheckout(groupItems)`).
- The grand-total Secure Checkout button stays at the bottom for "pay for everything in one Stripe session."
- The per-row **Book** button stays (single-item checkout).
- Empty state and "Save quote" behavior unchanged.

### Cart icon badge
No change — still shows total unbooked items across all trips.

### Out of scope
- No DB changes.
- No changes to `create-booking-checkout` (it already accepts an arbitrary subset of items).
- No changes to the Add-to-Cart flows on search cards.
- Wiring real provider booking APIs (separate, larger workstream).

Approve and I'll implement the grouping in `BookingCart.tsx`.