## Goal

Simplify the My Itineraries page: drop the drag-and-drop interaction entirely (Add to Collection stays in the card's three-dot menu) and replace the mobile 2-column grid with a swipeable stack browser, similar to the home page trip browser, with a top "Stacks" selector (All, Collection A, Collection B, …).

## Changes

### 1. Remove drag-and-drop (desktop + mobile)
- `src/pages/MyItineraries.tsx`: remove `DndContext`, `DragOverlay`, `pointerWithin`, `handleDragStart`, `handleDragEnd`, `draggingItinerary`, and the `<FloatingCollectionDropZone />` usage. Keep the page wrapper as a plain `<div>`.
- `src/components/my-itineraries/ItineraryGrid.tsx`: render plain `ItineraryCard` instead of `DraggableItineraryCard`. Keep the same props (`onAddToCollection`, `onRemoveFromCollection`, `showCollectionActions`, `collectionId`) so the three-dot menu continues to expose "Add to Collection" and "Remove from Collection".
- `src/components/my-itineraries/CollectionsSidebar.tsx`: replace `DroppableCollection` with a normal button row (same look, click → select collection, edit pencil → edit dialog). No drop targets.
- Delete unused files: `DraggableItineraryCard.tsx`, `DroppableCollection.tsx`, `FloatingCollectionDropZone.tsx` (and any imports referencing them).

### 2. Card click goes straight to the itinerary
- `ItineraryCard` already navigates to `/itinerary?id=…` on click. Confirm the three-dot menu uses `e.stopPropagation()` (it does on lines 89 & 94) so menu interactions don't trigger navigation. No further change needed.

### 3. Mobile: replace 2-column grid with a swipeable stack
Only applies to the mobile breakpoint (`useIsMobile()`), grid view, "My Trips" tab. Map and list views remain unchanged. Desktop grid unchanged.

- New component `src/components/my-itineraries/MobileItineraryStack.tsx`:
  - Receives the already-filtered `itineraries` for the currently selected stack.
  - Shows one full-width `ItineraryCard` at a time, centered, with a deck-of-cards visual (the next 1–2 cards peeking behind, matching the dashboard "deck" aesthetic referenced in the trip-card pattern).
  - Horizontal swipe (touch) + left/right arrow buttons to navigate. Position indicator (e.g. `3 / 12`) underneath.
  - Tapping the top card navigates to `/itinerary?id=…` (reuses `ItineraryCard`'s own click handler).
  - Empty state: same copy as `ItineraryGrid`'s empty state.

- Stacks selector on mobile: reuse the existing `MobileCollections` horizontal bubble row already in `MyItineraries.tsx`. Rename the section heading shown above it to **"Stacks"** and keep order: All → user collections → New. Selecting a bubble switches which stack is rendered in `MobileItineraryStack`.

- `MyItineraries.tsx` rendering logic for the grid view:
  - If `isMobile` → render `<MobileCollections />` (labeled "Stacks") + `<MobileItineraryStack itineraries={filteredItineraries} />`.
  - Else → existing `GridFilters` + `ItineraryGrid` (desktop unchanged).

### 4. Cleanup
- Remove `@dnd-kit/core` and `@dnd-kit/utilities` imports from the touched files. Package itself can stay installed (still referenced elsewhere if any); no package.json change required.
- No backend, schema, or business-logic changes.

## Out of scope
- Desktop grid layout
- Map view, list view, shared tab behavior
- Collection CRUD dialogs (unchanged)
- Animations beyond a simple swipe transition