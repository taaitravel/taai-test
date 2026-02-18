

## Light Theme Map Style Implementation

### Overview
Add a light-themed Mapbox style to all 5 map components that automatically switches based on the user's dark/light theme preference. The dark maps stay exactly as they are -- we only add a new light style that activates when the user is in light mode.

### Light Map Style
We'll use `mapbox://styles/mapbox/light-v11` as the base, which provides:
- Warm off-white land masses (matching the app's #f8f7f5 aesthetic)
- Soft, pastel-toned roads and labels
- Low contrast, daytime feel
- Clean and minimal -- lets your rose/coral/gold brand markers pop

### Map Components to Update (5 total)

| Component | Current Style | File |
|-----------|--------------|------|
| Map (itinerary) | `taai/cme4vu58w01r701s29jan9lw9` | `src/components/Map.tsx` |
| SearchResultsMap | `mapbox/dark-v11` | `src/components/search/SearchResultsMap.tsx` |
| CountriesMap | `taai/cme4vu58w01r701s29jan9lw9` | `src/components/CountriesMap.tsx` |
| WorldMap | `mapbox/dark-v11` | `src/components/WorldMap.tsx` |
| ItineraryMapView | `mapbox/dark-v11` | `src/components/my-itineraries/ItineraryMapView.tsx` |

### Implementation Details

#### 1. Create a shared map style utility
**New file: `src/lib/mapStyles.ts`**
- Export a function `getMapStyle(theme: string)` that returns the correct Mapbox style URL
- Dark: keeps current styles (`taai/cme4vu58w01r701s29jan9lw9` for itinerary/countries maps, `dark-v11` for others)
- Light: `mapbox://styles/mapbox/light-v11` for all maps
- Export fog/atmosphere configs per theme

#### 2. Add theme awareness to each map component
Each of the 5 map components will:
- Import `useThemeContext` from `ThemeContext`
- Use the theme value to pick the correct Mapbox style
- Re-initialize the map when theme changes (destroy old map, create new one with new style)

#### 3. Update popup and overlay colors for light mode
- Map popups already have light/dark CSS overrides in `index.css` (lines 415-461) -- these will work automatically
- Update hardcoded dark overlay colors in each map component (e.g., `bg-[#1a1c2e]`, `bg-[#12131a]`) to use semantic classes or theme-conditional values
- Legend panels and control overlays will use semantic `bg-card/80` instead of hardcoded dark backgrounds

#### 4. ItineraryMapView light-mode popup adjustments
The popup HTML in ItineraryMapView uses inline styles with dark colors (`#1a1c2e`). These will be updated to use theme-appropriate colors passed from the component.

#### 5. SearchResultsMap marker adjustments for light mode
The gold markers (#ffce87) with dark text (#1a1c2e) remain the same -- they provide excellent contrast on both light and dark map backgrounds. The border color on markers will switch from white (dark mode) to a subtle gray on light mode for better visibility.

### Technical Notes
- The map must be fully destroyed and re-created when the theme changes, since Mapbox GL doesn't support hot-swapping styles cleanly with custom layers/sources
- Each component will watch `theme` from the context and trigger a re-init via a `useEffect` dependency
- The `WorldMap` and `ItineraryMapView` globe fog settings will also adapt (light fog for light theme)
