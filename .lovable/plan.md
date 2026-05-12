## BookingCart Visual Updates

### 1. Split fee line into two rows
- Replace the single `TAAI_FEE_RATE = 0.08` constant with `ADMIN_FEE_RATE = 0.01` and `TAX_RATE = 0.07`.
- Update `computeTotals` to return `provider`, `adminFee`, `tax`, and `total`.
- In every itinerary group card, display:
  - "TAAI Travel Admin Fee (1%)" — `$adminFee`
  - "Taxes (7%)" — `$tax`
- In the grand total section at the bottom, display the same two-line breakdown.
- Totals remain mathematically identical (1% + 7% = 8%).

### 2. Gold/yellow accent on individual itinerary groups
- Use the existing `--rental` / `rental` theme token (the project's gold/yellow brand color) to visually distinguish each trip card.
- Each group container gets:
  - `border-rental/30`
  - `bg-rental/10`
- Inside each group:
  - `Briefcase` icon → `text-rental`
  - per-item price → `text-rental`
  - trip total amount → `text-rental`
  - "Checkout this trip" button → `bg-rental text-rental-foreground hover:bg-rental/90`
- The grand "Checkout everything" button and grand total section at the bottom keep the current primary/rose theme exactly as-is.

### Scope
Only `src/components/booking/BookingCart.tsx` is touched. No database or edge function changes.