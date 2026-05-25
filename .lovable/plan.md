## Goal

On mobile, the My Itineraries grid view becomes a vertical list of **stack sections**, one per collection (All, TEST!!!, …, plus a "New Stack" action). Each section shows its itineraries as a deck the user can swipe horizontally through, with looping, and swipe up on the top card to open that itinerary.

## Changes

All changes are mobile-only (`useIsMobile()`), grid view, "My Trips" tab. Desktop, map, list, and shared views are untouched.

### 1. New layout: `MobileStacksView`
`src/components/my-itineraries/MobileStacksView.tsx` (new). Renders, in order:
- One section per "stack": **All Itineraries** first, then each user collection in the order returned by `useItineraryCollections`.
- Section header row: stack name (left) + count (right) + small "Open" chevron link that sets `selectedCollectionId` so the existing collection-name header at top reflects the choice (keeps in-page navigation to a stack).
- Body: `<MobileItineraryStack itineraries={…}/>` rendering that stack's filtered itineraries.
- A trailing "New Stack" card (dashed border, plus icon) that calls `handleCreateCollection`.

Empty stacks render a small "No itineraries yet" placeholder instead of the deck.

`MyItineraries.tsx` mobile grid branch: replace the single `<MobileItineraryStack itineraries={filteredItineraries}/>` with `<MobileStacksView />`. The existing top **Stacks** bubble row stays — tapping a bubble still filters to a single stack (and in that filtered state we show only that one section, not all of them). Tapping the **All** bubble shows every section.

### 2. `MobileItineraryStack` updates
- **Bidirectional looping**: arrow buttons and swipes wrap around (5 → 1, 1 → 5). Remove the disabled/edge-resistance behavior; edges no longer exist.
- **Swipe directions**:
  - Horizontal drag (left/right) → cycle through items in the stack, with the current snap + spring-back animation. Left = next, right = previous.
  - Vertical drag **up** past threshold → navigate to `/itinerary?id=<top card id>` (this becomes the open gesture; the card's tap also still opens it).
  - Vertical drag **down** → ignored (snap back). Lets the page still scroll normally when the touch begins outside the card.
- Lock axis at the start of a drag: once horizontal vs vertical intent is detected (whichever exceeds ~8px first), only that axis is tracked for the rest of the gesture. Prevents accidental opens while swiping sideways.
- Position indicator stays (`3 / 12`). Arrow buttons remain for accessibility.

### 3. Section ordering & data
- Pull all collections from `useItineraryCollections`.
- For each collection, derive its itineraries via the existing `getCollectionItineraries(collectionId)` (already called for the currently-selected one); extend `MyItineraries.tsx` to fetch and cache a `{collectionId: number[]}` map on mount so each section can resolve its own list. Reuse `activeItineraries` as the source of truth and filter by those IDs.
- "All" section uses the full sorted `filteredItineraries` (respects existing grid sort settings, even though `GridFilters` UI is desktop-only).

### 4. Out of scope
- AI categorization (explicitly excluded by user).
- Desktop layout, map view, list view, shared tab.
- Backend / schema changes.

## Technical notes
- Looping math: `(index + n) % length` for next, `(index - 1 + length) % length` for prev.
- Swipe thresholds: horizontal 60px, vertical-up 80px, axis-lock 8px.
- For the per-collection ID map, add one `useEffect` in `MyItineraries.tsx` that, when `collections` changes, fires `getCollectionItineraries` for each in parallel and stores `Record<string, number[]>` in local state.