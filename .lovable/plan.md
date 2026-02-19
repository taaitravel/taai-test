

## Phase 1: Shared Itineraries, Simplified Roles, and Light Theme Fixes

This phase focuses on the three most impactful collaboration features: seeing shared trips, a clear 2-role permission model, and theme-compatible notifications.

---

### 1. "Shared With Me" Itineraries Section

**Problem**: The `useDashboardData` hook only queries `itinerary.userid = user.id`, so itineraries shared via the invitation system never appear for the invited user -- even though the RLS policy already allows it (`is_itinerary_attendee`).

**Solution**: Create a new hook `useSharedItineraries` that fetches itineraries where the user is an attendee but NOT the owner. Then surface these in a new "Shared With Me" tab/section on the `/itineraries` page.

**Files to create/modify:**
- **New: `src/hooks/useSharedItineraries.ts`** -- Queries `itinerary_attendees` for the current user (excluding `role = 'owner'`), then fetches the matching itineraries. The existing RLS on `itinerary` already permits SELECT for attendees.
- **Modify: `src/pages/MyItineraries.tsx`** -- Add a toggle or tab between "My Itineraries" and "Shared With Me". The shared view uses the new hook and displays cards with a "Shared" badge and the owner's name.
- **Modify: `src/components/my-itineraries/ItineraryCard.tsx`** -- Add optional `isShared` and `ownerName` props to show a "Shared by [Name]" label.

---

### 2. Simplified 2-Role Permission Model

**Current state**: The system has 3 roles (owner, editor, viewer). The user wants just 2 levels:
1. **Owner** -- Full control, only the creator. No one else can delete, rename, or manage attendees.
2. **Collaborator** -- Can edit itinerary content (add/remove hotels, flights, activities, etc.) but cannot delete the itinerary, rename it, or manage attendees.

**Changes:**
- **Modify: `src/components/itinerary/AttendeesSection.tsx`** -- Replace the "Make Editor" / "Make Viewer" dropdown with just "Collaborator" as the default and only non-owner role. Remove the role-switching UI for simplicity.
- **Modify: `src/components/itinerary/InviteAttendeesDialog.tsx`** -- Always invite as `collaborator` role (no role selector needed).
- **Modify: `src/hooks/useItineraryAttendees.ts`** -- Default role on invite = `'collaborator'` instead of `'viewer'`.
- **Modify: `supabase/functions/accept-invitation/index.ts`** -- Set accepted attendee role to `'collaborator'` instead of `'viewer'`.
- **Database migration** -- Update the RLS policy on the `itinerary` table so that `collaborator` role gets UPDATE access to content fields (flights, hotels, activities, reservations, budget fields) but NOT to `itin_name`, `itin_desc`, or `userid`. This is enforced at the RLS level:

```sql
-- Update the existing UPDATE policy to include collaborators
DROP POLICY IF EXISTS "Owners and editors can update itineraries" ON public.itinerary;
CREATE POLICY "Owners and collaborators can update itineraries"
ON public.itinerary FOR UPDATE
USING (
  auth.uid() = userid
  OR get_itinerary_role(id, auth.uid()) IN ('owner', 'editor', 'collaborator')
);
```

Note: "editor" is kept for backward compatibility with existing attendees. New invites will use "collaborator". The itinerary name/description fields are protected by the UI (only shown as editable to owners), and the DELETE policy already restricts deletion to `userid = auth.uid()`.

---

### 3. Light Theme for Notifications and Terms Page

**Problem**: The `NotificationCenter` sheet and `PendingInvitationsCard` use hardcoded dark colors. The `Terms` page is entirely dark-mode hardcoded.

**Files to modify:**

- **`src/components/shared/NotificationCenter.tsx`** -- Already uses semantic classes (`bg-primary/5`, `border-border`, `text-muted-foreground`). Only minor tweaks needed: ensure the Sheet background inherits from theme (`bg-background` on SheetContent).

- **`src/components/itinerary/PendingInvitationsCard.tsx`** -- Replace:
  - `from-[#1a1c2e] to-[#252744]` with `bg-card`
  - `border-white/10` with `border-border`
  - `text-white` with `text-foreground`
  - `text-white/60` with `text-muted-foreground`
  - `bg-white/5` with `bg-secondary`
  - `border-white/10` with `border-border`
  - `border-white/20` with `border-border`

- **`src/pages/Terms.tsx`** -- Replace all `bg-[#171821]` with `bg-background`, `text-white` with `text-foreground`, `text-white/80` with `text-foreground/80`, `border-white/30` with `border-border`, `bg-white/10` with `bg-secondary`, `text-[#171821]` with `text-primary-foreground`, and `shadow-white/20` with `shadow-primary/10`.

---

### Summary of All Files Changed

| File | Change |
|------|--------|
| **New:** `src/hooks/useSharedItineraries.ts` | Fetch itineraries where user is attendee but not owner |
| `src/pages/MyItineraries.tsx` | Add "Shared With Me" tab using new hook |
| `src/components/my-itineraries/ItineraryCard.tsx` | Add shared badge and owner name display |
| `src/components/itinerary/AttendeesSection.tsx` | Simplify to Owner + Collaborator roles |
| `src/components/itinerary/InviteAttendeesDialog.tsx` | Default to collaborator role |
| `src/hooks/useItineraryAttendees.ts` | Default invite role = collaborator |
| `supabase/functions/accept-invitation/index.ts` | Set accepted role to collaborator |
| `src/components/itinerary/PendingInvitationsCard.tsx` | Semantic theme tokens |
| `src/pages/Terms.tsx` | Semantic theme tokens |
| **Database migration** | Update itinerary UPDATE policy to include collaborator role |

### What Phase 2 Will Cover (later)

- End-to-end encrypted itinerary chat
- Public/social user profiles with countries visited, traveler level
- Follow system and public itinerary sharing
- Privacy settings (public vs. private profiles)
- Terms of Service update for social features
- Friends/followers infrastructure

