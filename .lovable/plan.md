# Unified Trip Attendees & Balances Panel

Combine the two separate cards (`AttendeesSection` + `TripBalancesPanel`) on `/itinerary?id=...` into a single card where **each attendee is one full-width row** showing identity, role, spending, % of total, balance status, and the kebab menu.

## New component

Create `src/components/itinerary/TripPeopleAndBalances.tsx` that replaces both panels.

### Row layout (per attendee, full width)

```text
[avatar] Name @username       [Owner|Collaborator badge]   $1,240  •  31% of trip   |   You owe $120  [Mark settled]   [•••]
```

Columns left → right:
1. Avatar + name + @username (stacked)
2. Role badge (Owner / Collaborator)
3. Spending: their share-to-date (sum of `cart_item_splits.computed_amount + computed_taxes_and_fees` where `paid_by_user_id = them` OR they're a participant — see below) and `% of trip total`
4. Net balance vs. current viewer (e.g. "You owe $X" / "Owes you $X" / "Settled") + Mark settled button when applicable
5. Kebab `•••` (owner-only): Remove attendee

Mobile (<768px): stack into 2 lines — row 1 = avatar/name/role, row 2 = spending + balance + actions.

### Card header

`Trip people & balances (N)` with `Invite` button (owner only) on the right.

## Data sources

Reuse existing hooks — no new tables or backend logic:
- `useItineraryAttendees(itineraryId)` — list, isOwner, removeAttendee
- `useTripBalances(itineraryId)` — open balances + markSettledOffPlatform
- `useCartItemSplits` is per-item; instead query `cart_item_splits` once for the trip to compute per-user spending totals.

### Per-user spending calculation (client side)

Add a small hook `useTripSpending(itineraryId)`:
- Select `cart_item_splits` joined with `cart_items` filtered by `itinerary_id`.
- For each row, attribute `computed_amount + computed_taxes_and_fees` to that split's user (the attendee whose share it is, not `paid_by_user_id`).
- Aggregate per `user_id` → `{ amount, pct }` where `pct = amount / sum(all)`.
- Returns `{ totals: Map<userId, {amount, pct}>, tripTotal }`.

Rows for attendees with no splits yet show `$0 · 0%`.

### Net balance per row

From `useTripBalances`, compute net open amount between current `user.id` and the row's user (reuse the netting logic already in `TripBalancesPanel`). Show:
- creditor=me → "Owes you $X" + Mark settled
- debtor=me → "You owe $X" + Mark settled
- otherwise show pair text "A owes B $X" only if neither is me but both are in row context (skip for own row)
- 0 → "Settled"

## Wiring

In `src/pages/Itinerary.tsx`:
- Remove `<AttendeesSection />` and `<TripBalancesPanel />` blocks.
- Render `<TripPeopleAndBalances itineraryId={...} />` in their place inside one container.

Keep `AttendeesSection.tsx` and `TripBalancesPanel.tsx` files for now (unused) — easy to revert. Delete in a follow-up if approved.

## History section

Move the small "History" list (settled balances) from `TripBalancesPanel` into a collapsible `<details>` at the bottom of the new card, labeled "Settlement history".

## Out of scope

- No schema changes
- No edits to splits creation flow / `SplitCostDialog`
- No mobile bottom-nav changes
- No FX / multi-currency
