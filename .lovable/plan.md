## Mobile Cart Row Redesign

### 1. Restructure each cart item row (vertical, mobile-friendly)
Replace the current horizontal flex row with a stacked vertical layout per item:

```
[type badge]
[Title — full width, can wrap]
Provider TBD
Saved Feb 16, 2026
Dates: Feb 20 – Feb 24, 2026   (only if service_dates exist)
                              [🗑]  [Book]   $1,219.52
```

Specifics:
- **Order**: type badge → title → provider → saved date → service dates (if present) → bottom action row
- **Title** gets its own line, full width, no truncation (`break-words` instead of `truncate`)
- **Saved date** formatted as `MMM dd, yyyy` (project standard)
- **Service dates** line: shown when `item.item_data?.service_dates?.checkIn/start` exists, formatted as `MMM dd – MMM dd, yyyy`
- **Bottom row**: right-aligned cluster with Trash icon, Book button, then **price** as the rightmost element
- **Price styling**: smaller (`text-sm` instead of bold/large), `text-rental`, formatted with thousands separator via `toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })` → `$1,219.52`
- More vertical breathing room: `p-4` and `space-y-1.5` inside each item card

### 2. Darker itinerary group background
- Change each itinerary group container from `bg-rental/10 border-rental/30` to a darker contrasting tone:
  - `bg-rental/25 border-rental/50` (light mode-friendly darker gold tint)
- Keep the inner item rows at `bg-background/80` so they pop against the darker group background.

### Scope
- Only `src/components/booking/BookingCart.tsx`.
- No changes to data, totals, or the bottom Grand total / "Checkout everything" section.