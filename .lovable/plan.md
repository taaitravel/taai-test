

# Theme-Aware Text Colors & Styling - Complete Refactor Plan

## Problem Summary

The screenshots clearly show the issue: when switching to light mode, text remains white (`text-white`) on light backgrounds, making it completely invisible. This affects:

- **104 files** using hardcoded `text-white` classes
- **51 files** using hardcoded `bg-[#171821]` or similar colors
- Multiple component patterns: cards, headers, sidebars, modals, badges, and more

## Solution Overview

Convert all hardcoded color classes to theme-aware CSS variable classes:

| Hardcoded Class | Theme-Aware Replacement |
|----------------|------------------------|
| `text-white` | `text-foreground` |
| `text-white/70` | `text-muted-foreground` or `text-foreground/70` |
| `text-white/50` | `text-muted-foreground` |
| `text-white/60` | `text-muted-foreground` |
| `bg-[#171821]` | `bg-background` |
| `bg-[#12131a]` | `bg-card` or `bg-secondary` |
| `bg-[#1f1f27]` | `bg-secondary` |
| `bg-[#1a1c2e]` | `bg-card` |
| `bg-white/10` | `bg-accent` or `bg-muted` |
| `border-white/20` | `border-border` |
| `text-[#171821]` | `text-background` (for contrast on gold buttons) |
| `text-black` | `text-foreground` |

---

## Files to Update - Grouped by Priority

### Priority 1: Current Page Components (My Itineraries)

These are causing the issues shown in the screenshots:

1. **`src/pages/MyItineraries.tsx`** - Main page background and text
2. **`src/components/my-itineraries/CollectionsSidebar.tsx`** - Sidebar colors
3. **`src/components/my-itineraries/ItineraryCard.tsx`** - Card text colors
4. **`src/components/my-itineraries/ItineraryGrid.tsx`** - Empty state text
5. **`src/components/my-itineraries/GridFilters.tsx`** - Filter controls
6. **`src/components/my-itineraries/ItineraryList.tsx`** - List view
7. **`src/components/my-itineraries/FloatingCollectionDropZone.tsx`** - Drop zone styling
8. **`src/components/my-itineraries/DroppableCollection.tsx`** - Collection items
9. **`src/components/my-itineraries/DraggableItineraryCard.tsx`** - Draggable card wrapper

### Priority 2: Dashboard Components

10. **`src/components/dashboard/sections/TravelMetrics.tsx`** - Metrics cards
11. **`src/components/dashboard/sections/UpcomingTravel.tsx`** - Hero section text
12. **`src/components/dashboard/sections/HeroWelcome.tsx`** - Welcome text
13. **`src/components/dashboard/TripsSection.tsx`** - Trip cards
14. **`src/components/dashboard/TripBrowser.tsx`** - Trip browser modal
15. **`src/components/dashboard/TripsFilter.tsx`** - Filter controls
16. **`src/components/dashboard/DashboardContent.tsx`** - Main content area
17. **`src/components/dashboard/HeroSection.tsx`** - Hero background
18. **`src/components/dashboard/FlightProgressIndicator.tsx`** - Progress visualization
19. **`src/components/dashboard/StatsSection.tsx`** - Stats display
20. **`src/components/dashboard/sections/TravelHub.tsx`** - Hub section

### Priority 3: Itinerary Detail Components

21. **`src/components/itinerary/ItineraryContent.tsx`** - Main itinerary view
22. **`src/components/itinerary/ItineraryHeader.tsx`** - Header section
23. **`src/components/itinerary/ItinerarySidebar.tsx`** - Sidebar
24. **`src/components/itinerary/TripOverviewSection.tsx`** - Overview cards
25. **`src/components/itinerary/BudgetPieChart.tsx`** - Budget visualization
26. **`src/components/itinerary/AttendeesSection.tsx`** - Attendees list
27. **`src/components/itinerary/DailyScheduleSection.tsx`** - Schedule view
28. **`src/components/itinerary/ItineraryBrowser.tsx`** - Browser component
29. **`src/components/itinerary/AddItemDialog.tsx`** - Add item modal
30. **`src/components/itinerary/InviteAttendeesDialog.tsx`** - Invite modal

### Priority 4: Search Components

31. **`src/components/search/SearchResults.tsx`** - Results container
32. **`src/components/search/SearchResultsGrid.tsx`** - Grid view
33. **`src/components/search/SearchResultsMap.tsx`** - Map view
34. **`src/components/search/MapPopupCard.tsx`** - Map popup styling
35. **`src/components/search/cards/HotelResultCard.tsx`** - Hotel cards
36. **`src/components/search/cards/FlightResultCard.tsx`** - Flight cards
37. **`src/components/search/cards/ActivityResultCard.tsx`** - Activity cards
38. **`src/components/search/fields/HotelSearchFields.tsx`** - Search form fields
39. **`src/components/search/fields/FlightSearchFields.tsx`** - Flight search fields
40. **`src/components/search/fields/PackageSearchFields.tsx`** - Package fields

### Priority 5: Additional Pages

41. **`src/pages/Subscription.tsx`** - Subscription page
42. **`src/pages/ProfileSetup.tsx`** - Profile setup
43. **`src/pages/CreateItinerary.tsx`** - Create itinerary page
44. **`src/pages/CreateManualItinerary.tsx`** - Manual creation
45. **`src/pages/EditItinerary.tsx`** - Edit page
46. **`src/pages/Search.tsx`** - Search page
47. **`src/pages/Contact.tsx`** - Contact page
48. **`src/pages/WhatWeDo.tsx`** - About page
49. **`src/pages/Terms.tsx`** - Terms page

### Priority 6: Shared UI Components

50. **`src/components/ui/calendar.tsx`** - Calendar styling
51. **`src/components/ui/select.tsx`** - Select dropdowns
52. **`src/components/chat/ChatInterface.tsx`** - Chat UI
53. **`src/components/cards/EnhancedCardRenderer.tsx`** - Card rendering
54. **`src/components/booking/BookingCart.tsx`** - Booking cart

---

## Example Transformations

### Before (MyItineraries.tsx):
```tsx
<div className="min-h-screen bg-[#171821] flex flex-col">
  <h1 className="text-lg md:text-xl font-bold text-white">
  <p className="text-sm text-white/60">
```

### After:
```tsx
<div className="min-h-screen bg-background flex flex-col">
  <h1 className="text-lg md:text-xl font-bold text-foreground">
  <p className="text-sm text-muted-foreground">
```

### Before (ItineraryCard.tsx):
```tsx
<h4 className="font-bold text-black text-sm">
<p className="text-white/50 text-xs">
<Badge className="bg-white/10 text-white/60 border-white/20">
```

### After:
```tsx
<h4 className="font-bold text-foreground text-sm">
<p className="text-muted-foreground text-xs">
<Badge className="bg-muted text-muted-foreground border-border">
```

---

## Additional CSS Updates (src/index.css)

Add helper classes for consistent contrast:

```css
/* Contrast text - for use on gradient/primary backgrounds */
.text-contrast {
  @apply text-contrast-foreground;
}

/* Dark mode keeps current gold-on-dark styling */
.dark .text-contrast {
  color: hsl(var(--background));
}
```

---

## Implementation Order

1. **Phase 1**: Update My Itineraries page and components (fixes current screenshots)
2. **Phase 2**: Update Dashboard components 
3. **Phase 3**: Update Itinerary detail components
4. **Phase 4**: Update Search components
5. **Phase 5**: Update remaining pages
6. **Phase 6**: Update shared UI components
7. **Phase 7**: Final testing across all pages in both modes

---

## Technical Notes

- All `text-white` on dark backgrounds becomes `text-foreground`
- All `text-white/XX` opacity variants become `text-muted-foreground` or `text-foreground/XX`
- Background colors like `bg-[#171821]` become `bg-background`
- Secondary backgrounds like `bg-[#12131a]` become `bg-card` or `bg-secondary`
- The gold gradient buttons keep `text-[#171821]` or use a new `text-contrast` class for visibility on gradients
- Border colors like `border-white/20` become `border-border`

This comprehensive update will ensure the entire application responds correctly to theme changes, providing a polished light mode experience that matches the dark mode aesthetic.

