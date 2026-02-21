

## Fix: Collaborator Access to Shared Itineraries

### Root Cause

The glitch happens because `useAuthenticatedItineraryData.ts` queries with `.eq('userid', user.id)` on line 36. This means only the **owner** can load an itinerary. When a collaborator navigates to the itinerary page, the query returns nothing, which triggers:
1. `itineraryData` = null
2. The page shows "No itinerary found..."
3. Or worse, redirects to `/home`

The RLS policy already allows collaborators to SELECT the itinerary -- the problem is the **application code** adding an unnecessary owner filter.

### Changes

#### 1. Fix the data fetching query (critical bug fix)

**File: `src/hooks/useAuthenticatedItineraryData.ts`**
- Remove `.eq('userid', user.id)` from the query -- RLS already enforces access control
- The query becomes: `supabase.from('itinerary').select('*').eq('id', parseInt(itineraryId)).single()`
- Add a `userRole` field to the return value: check if `data.userid === user.id` to determine "owner" vs query `itinerary_attendees` for the collaborator's role
- Cart items query should also work for collaborators (they see shared cart items or their own)

#### 2. Add role awareness to the Itinerary page

**File: `src/pages/Itinerary.tsx`**
- Receive `userRole` from the hook (`'owner' | 'collaborator'`)
- Pass `userRole` down to `ItineraryContent` and `ItineraryHeader`
- If collaborator:
  - Hide the "Edit" (pencil) button that navigates to `/edit-itinerary` (that page edits trip metadata like name/dates)
  - Allow add/edit/delete of items (hotels, flights, activities, reservations) -- collaborators can plan
  - Show a subtle banner: "You're a collaborator on this trip" so the user knows their role

#### 3. Protect owner-only actions in the UI

**File: `src/components/itinerary/ItineraryHeader.tsx`**
- Accept `userRole` prop
- Hide the Edit (pencil) button when `userRole !== 'owner'`
- Hide "Add to Collection" button for collaborators (collections are personal)

**File: `src/components/itinerary/ItineraryContent.tsx`**
- Accept `userRole` prop
- If `userRole === 'collaborator'`:
  - Disable destination add/remove (those modify `itin_locations` which is trip metadata)
  - Keep item add/edit/delete enabled (collaborators can add hotels, flights, etc.)
- Wrap all Supabase update calls in try/catch with user-friendly error toasts instead of silent failures

**File: `src/components/itinerary/ItineraryInfoHeader.tsx`**
- Accept `userRole` prop
- When `userRole === 'collaborator'`, show a small badge/chip: "Collaborator" next to the trip title so the user always knows their role

#### 4. Graceful error handling for failed updates

**File: `src/components/itinerary/ItineraryContent.tsx`**
- Wrap `handleAddSubmit`, `handleRemoveDestination`, `handleAddDestination` in try/catch
- On RLS violation or other error, show a toast: "You don't have permission to do this" instead of silently failing or crashing

**File: `src/pages/Itinerary.tsx`**
- Wrap `handleEditSubmit` and `handleDelete` in try/catch with toast error messages

#### 5. Update the hook return type

**File: `src/hooks/useAuthenticatedItineraryData.ts`**
- Add `userRole: 'owner' | 'collaborator' | null` to the return object
- Determine role by checking if `data.userid === user.id` (owner) or querying `itinerary_attendees` for the user's role
- This avoids an extra DB call in most cases (owner check is just a string comparison)

### Technical Details

```text
Before (broken for collaborators):
  useAuthenticatedItineraryData
    -> query: itinerary WHERE userid = user.id AND id = X
    -> collaborator: NO ROWS RETURNED -> "itin not found" -> redirect

After (works for all attendees):
  useAuthenticatedItineraryData
    -> query: itinerary WHERE id = X (RLS handles access control)
    -> determine role: data.userid === user.id ? 'owner' : lookup attendee role
    -> return { itineraryData, userRole }
    -> UI adapts based on userRole
```

### Summary of Files Changed

| File | Change |
|------|--------|
| `src/hooks/useAuthenticatedItineraryData.ts` | Remove userid filter, add userRole detection, wrap updates in try/catch |
| `src/pages/Itinerary.tsx` | Pass userRole to children, add try/catch to edit/delete handlers, show role banner |
| `src/components/itinerary/ItineraryHeader.tsx` | Accept userRole, hide Edit button for collaborators |
| `src/components/itinerary/ItineraryContent.tsx` | Accept userRole, disable destination changes for collaborators, add error handling |
| `src/components/itinerary/ItineraryInfoHeader.tsx` | Accept userRole, show "Collaborator" badge |
