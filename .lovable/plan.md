

# Comprehensive UI Review and Corrections

## Issues Identified from Screenshots

### 1. Edit Flight / Edit Hotel Dialogs (AddItemDialog.tsx)
- **Form not scrollable on mobile**: The dialog content overflows the screen, making bottom fields and buttons inaccessible. The dialog needs `max-h-[85vh] overflow-y-auto` on the content area.
- **Close (X) button overlaps content at top-right**: The dialog close button blends into the gradient background -- needs better contrast/positioning.
- **Save/Cancel/Delete buttons at bottom are cramped and partially hidden**: The footer area is cut off. Adding proper scroll ensures these are always reachable.
- **Map/image showing behind the dialog**: The dialog overlay doesn't fully cover the background content -- needs proper backdrop.

### 2. Add Destination Dialog (AddDestinationDialog.tsx)
- **Hardcoded dark colors instead of semantic theme variables**: Uses `bg-[#171821]/95`, `text-white`, `border-white/30` -- breaks in light mode, making the search input nearly invisible (gray on white).
- **Cancel button nearly invisible**: Uses `border-white/30 text-white` which doesn't work in light mode. Needs semantic classes.
- **Search input has poor contrast in light mode**: Gray placeholder on light background.

### 3. Daily Schedule Section (DailyScheduleSection.tsx)
- **Destination badges overflow and get cut off**: Long destination names like "BAJA CALIFORNIA SUR" or "SAN FRANCISC, CALIFORNIA" overflow their containers and get clipped.
- **Event titles truncate but container doesn't allow horizontal overflow**: Items like "Check-out: Riu Palace Cabo San Luca..." get cut off without any way to see the full text.
- **Scrollbar visible and ugly on mobile**: The `h-[1100px]` ScrollArea shows a visible scrollbar track.

### 4. Dashboard - Trip Card / Hero Section
- **"Upcoming" badge overlaps with "Edit Trip" button**: The badge and buttons are too close together on the trip card.
- **Invite button has a mystery orange square on the right edge**: Likely a clipped element or extra padding issue in the trip card.
- **Destination route text wraps poorly**: "LOS ANGELES -> BAJA CALIFORNIA SUR -> SAN FRANCISC, CALIFORNIA -> MALIBU CALIFORNIA -> SAN DIEGO" wraps awkwardly.

### 5. Dashboard - Travel Metrics (TravelMetrics.tsx)
- **Content cut off on left edge on mobile**: "Flight Progress", "Countries Visited", "Projected Spend" labels and values are clipped on the left side. The page container padding isn't sufficient, or cards have negative margins.
- **Projected Spend number cut off**: "$55,758.1" is clipped on the left edge.

### 6. Bottom Navigation (MobileBottomNav.tsx)
- **All 5 items are now flat/inline (correct per last fix)**: The Search button is now aligned with the others -- this is resolved.

---

## Technical Plan

### File 1: `src/components/itinerary/AddItemDialog.tsx`
- Wrap the form fields area in a scrollable container: add `max-h-[60vh] overflow-y-auto` to the fields section, or add `overflow-y-auto max-h-[85vh]` to the DialogContent.
- Ensure DialogFooter is always visible (sticky at bottom or outside scroll area).

### File 2: `src/components/itinerary/AddDestinationDialog.tsx`
- Replace hardcoded dark-mode classes with semantic theme variables:
  - `bg-[#171821]/95` -> `bg-card/95`
  - `text-white` -> `text-foreground`
  - `text-white/70` -> `text-muted-foreground`
  - `border-white/30` -> `border-border`
  - `bg-white/10` -> `bg-muted`
  - `border-white/20` -> `border-border`
  - Cancel button: `border-border text-foreground hover:bg-accent`

### File 3: `src/components/itinerary/DailyScheduleSection.tsx`
- Destination badges: add `max-w-[120px] truncate` to prevent overflow on long names.
- Event title text: already has `truncate`, but the parent container may need `overflow-hidden` and `min-w-0`.

### File 4: `src/components/dashboard/sections/TravelMetrics.tsx`
- The grid cards are being clipped because the parent card has `p-5` but inner cards extend to edges. Ensure proper padding so content isn't cut off on mobile. Add `overflow-hidden` to the outer card.

### File 5: `src/components/itinerary/ItineraryInfoHeader.tsx`
- The route text (destinations joined by arrows) wraps poorly. Add `text-center` and `leading-relaxed` for better multi-line readability. Truncate or use smaller text on mobile.

### File 6: Trip Card buttons
- Review the trip card component (likely in `src/components/dashboard/TripsSection.tsx` or similar) to fix the mystery orange square on the Invite button and ensure proper spacing between "Upcoming" badge and action buttons.

