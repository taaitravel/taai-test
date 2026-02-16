

## Subscription Page Enhancements

This plan covers 4 areas: a larger billing toggle, pricing correction for taaiTraveler+ annual, and a completely revamped "Current Usage" section with real data comparisons.

---

### 1. Larger Monthly/Annual Toggle

**File: `src/pages/Subscription.tsx`**

Replace the small icon-based toggle (ToggleLeft/ToggleRight at h-8 w-8) with a large pill-style toggle similar to the tabs pattern:
- A rounded-full container (~280px wide, ~48px tall) with `bg-white/10` backdrop
- Two clickable halves: "Monthly" and "Annual"
- The active side gets a solid `bg-white/20` highlight with bold white text
- The inactive side stays `text-white/60`
- The "Save up to 19%" badge remains next to it when annual is selected
- Text size bumped to `text-base font-semibold`

---

### 2. taaiTraveler+ Annual Price Update

**File: `src/components/subscription/TierDefinitions.tsx`**

- Change `annualPrice` from `192.00` to `184.99`
- Change `priceText.annual` from `'$192.00/yr'` to `'$184.99/yr'`

**File: `src/lib/stripeConfig.ts`**

- Update the fallback annual price for `taai_traveler_plus` from `192.00` to `184.99`

The savings percentage will auto-calculate: ($19 x 12 = $228; savings = ($228 - $184.99) / $228 = ~19%).

---

### 3. Dynamic "Current Usage" Section

**File: `src/pages/Subscription.tsx`**

Replace the static 3-column usage card with a detailed usage dashboard containing:

**a) Member Since**
- Query the `users` table for the user's `created_at` field and display as "Member since Month Year"

**b) Itineraries: Used vs Allowed**
- Count the user's itineraries from the `itinerary` table
- Compare against `subscriptionData.max_itineraries`
- Display as "14 / 3" with the difference shown
- If over limit: show "-11" in red with a warning that excess itineraries will be deleted at end of month
- If under/at limit: show remaining in green

**c) Sharing (PDF Exports)**
- Count total rows in `usage_tracking` where `usage_type = 'pdf_export'` for the user
- Compare against `subscriptionData.max_shared_friends` (repurposed as sharing/export limit)
- Same red/green over/under display logic

**d) Credit Utilization**
- Count total searches from `search_history` for the user
- Each search = 0.25 credits
- Total credit cost = search_count x 0.25
- Compare against `subscriptionData.credits_remaining`
- Show usage vs allowed, with red if over

**e) Warning Banner**
- If any metric is over limit, show a warning card: "You have exceeded your plan limits. Itineraries over your limit will be removed at the end of each billing cycle."

**Layout**: A styled card with 4 rows, each showing: icon, metric name, usage bar or fraction, and delta (green/red).

---

### 4. Data Fetching

**File: `src/pages/Subscription.tsx`**

Add queries on mount (alongside subscription check):
- `supabase.from('itinerary').select('id', { count: 'exact' }).eq('user_id', user.id)` -- get itinerary count
- `supabase.from('usage_tracking').select('id', { count: 'exact' }).eq('user_id', user.id).eq('usage_type', 'pdf_export')` -- get PDF export count
- `supabase.from('search_history').select('id', { count: 'exact' }).eq('user_id', user.id)` -- get search count
- `supabase.from('users').select('created_at').eq('userid', user.id).single()` -- get member since date

No new tables or migrations needed -- all data sources already exist.

---

### Technical Summary

| File | Change |
|------|--------|
| `src/pages/Subscription.tsx` | Large toggle, revamped usage section with real queries |
| `src/components/subscription/TierDefinitions.tsx` | Annual price 192.00 -> 184.99 |
| `src/lib/stripeConfig.ts` | Fallback price 192.00 -> 184.99 |

