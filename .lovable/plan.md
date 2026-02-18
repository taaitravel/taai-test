

# Restructure Stats Row -- Consistent Layout, Remove Icons

## Changes in `src/components/dashboard/HeroSection.tsx`

### Next Travel (left) -- Remove Calendar icon
- Delete the `Calendar` icon
- Keep the same content and left-aligned layout: date, trip name, "X days away" badge
- Remove the `Award` and `Calendar` imports entirely

### Lifetime Total Spent (center) -- Reorder to Amount / Label / Trips
Current order: Amount, then "Lifetime Total Spent (X trips)"

New order:
```
$69,591.74
Lifetime Total Spent
(14 trips completed)
```
- Amount stays as the headline
- "Lifetime Total Spent" on its own line
- "(X trips completed)" on a separate line below

### Traveler Level (right) -- Reorder to Level / Label / Stats, remove icon
Current order: Award icon, "Traveler Level" label, level name, stats

New order:
```
Explorer
Traveler Level
17 countries · 24 flights
```
- Delete the `Award` icon
- Level name as the headline (large, bold)
- "Traveler Level" label below
- Stats line stays at the bottom

### Cleanup
- Remove `Award, Calendar` from lucide-react imports (no icons left)

