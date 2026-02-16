

## Apply Tab Styling Globally via Base Component

Rather than patching every individual tab usage, the fix goes into the base `src/components/ui/tabs.tsx` component so **all tabs across the app** automatically get the correct dark mode styling.

### What Changes

**File: `src/components/ui/tabs.tsx`**

1. **TabsList (line 15)**: Add `dark:bg-white` to ensure solid white background in dark mode (the current `bg-muted` resolves to white but some overrides use opacity variants).

2. **TabsTrigger (line 30)**: Add dark mode overrides:
   - `dark:text-[#171822]` -- inactive tab text is dark navy
   - `dark:data-[state=active]:text-white` -- active tab text is white
   - `dark:data-[state=active]:bg-primary` -- active tab gets a visible background in dark mode

This single change propagates to every tabs instance: Subscription page, My Itineraries view toggle, Booking API test, Expedia API test, and Adaptive Search Form. The Subscription page's existing per-component overrides will still layer on top (gold-gradient) without conflict.

### Files to Modify
- `src/components/ui/tabs.tsx` (TabsList + TabsTrigger default classes)

