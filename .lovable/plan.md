
Goal: fix the full collaboration flow so invited users are actually added to trips, can see shared trip details in the right places, and get chat access reliably.

What I found
1. The accept flow is currently broken at the backend:
   - `accept-invitation` marks the invite as `accepted` first.
   - It then tries to insert an `itinerary_attendees` row as the invited user.
   - That insert is blocked by:
     - RLS (`itinerary_attendees` only allows owner inserts)
     - the DB role check (`owner/editor/viewer`) while the function inserts `collaborator`
   - the function does not check the insert error, so it returns success anyway.
   Result: invite disappears, attendee is not created, chat participant is not created, and the inviter may still get a false “accepted” notification.

2. The role model is inconsistent across the app:
   - DB constraint still allows `owner/editor/viewer`
   - app logic/UI/memory use `owner/collaborator`
   - invitation role is not persisted at all (`send-invitation` receives `role` but does not store it)

3. Several collaboration screens query `users` directly from the client for other people’s names/emails.
   - That conflicts with current RLS on `users`
   - likely causes missing inviter names, attendee names, owner names in shared trips, and weak chat participant rendering

4. Trip counts/visibility are inconsistent:
   - many cards/pages still use `itinerary.attendees` JSON
   - real collaboration membership lives in `itinerary_attendees`
   - so accepted collaborators would still not update counts consistently even after the insert bug is fixed

5. Chat depends on the broken attendee flow:
   - no attendee row means no chat participant row
   - chat sender/participant identity lookups also rely on direct `users` reads
   - 10-minute edit restriction is only enforced in the client, not securely in the database

6. Invitation matching is fragile:
   - email/username matching is raw/case-sensitive
   - invites like uppercase emails can become invisible to the recipient

Implementation plan

Phase 1 — Repair the collaboration data model
- Standardize itinerary roles to the approved two-role model:
  - `owner`
  - `collaborator`
- Add invitation fields needed for reliable processing:
  - persisted invited role
  - normalized invite target for matching
  - optional accepted/declined timestamps for traceability
- Add a safe server-side way to fetch participant public profile info for a trip:
  - only expose fields needed for UI (name, username, avatar, maybe email only where justified)
  - stop relying on direct client reads of other users from `users`

Phase 2 — Rebuild invite send/accept logic so it is authoritative
- Refactor `send-invitation` to:
  - allow only itinerary owners to invite/manage attendees
  - normalize invite values before saving
  - prevent duplicate pending invites / inviting existing members
  - store the intended role on the invitation
- Refactor `accept-invitation` to be server-authoritative and success-checked:
  - validate recipient really matches the invite
  - validate invite is pending and not expired
  - insert attendee with the correct role using privileged server logic
  - only mark invitation accepted after attendee creation succeeds
  - create chat participant / notification only after success
  - return the itinerary id + membership info so the UI can redirect cleanly
- Do the same cleanup for decline behavior.

Phase 3 — Backfill and repair already-broken records
- Add a one-time reconciliation step for existing accepted invitations that never created attendee rows.
- Rebuild missing `itinerary_attendees` and `itinerary_chat_participants` rows safely and idempotently.
- Normalize legacy invitation values where possible.
- Map any legacy attendee roles (`editor/viewer`) into the simplified collaboration model.

Phase 4 — Make shared trip visibility consistent everywhere
- Update data hooks so shared access is powered by `itinerary_attendees`, not the old `attendees` JSON.
- Keep “My Trips” vs “Shared With Me”, but ensure accepted trips immediately appear in Shared.
- Make upcoming/past grouping work for shared trips as well.
- After accepting an invite, refresh relevant data and route the user to the shared itinerary or give a clear CTA to open it.

Phase 5 — Fix UI ownership/permission behavior
- Attendees/invite controls:
  - only owners can invite, remove, or manage attendees
  - collaborators get clear read-only messaging
- Invitation UI:
  - show real inviter/trip info reliably
  - show acceptance success only when membership was actually created
- Notification center:
  - make invitation notifications open the invite experience
  - make accepted-invite notifications open the itinerary reliably

Phase 6 — Harden itinerary chat on top of the repaired membership flow
- Keep the current itinerary-tied chat modal approach.
- Drive chat eligibility from real accepted attendee count.
- Replace chat participant/sender profile lookups with the safe trip-profile source.
- Enforce the 10-minute edit rule in the database with validation logic, while allowing delete anytime.
- Confirm new members only see messages from their actual join time forward.
- Ensure reactions, reply, copy, attachments, and filters still work after the membership fixes.

Technical details
- Backend areas to update:
  - `itinerary_attendees` schema/policies
  - `itinerary_invitations` schema/policies
  - `accept-invitation`
  - `send-invitation`
  - chat RLS/validation
  - safe participant profile RPC/view
- Frontend areas to update:
  - `useInvitations`
  - `PendingInvitationsCard`
  - `useItineraryAttendees`
  - `AttendeesSection`
  - `useSharedItineraries`
  - `useDashboardData` / trip count surfaces
  - `NotificationCenter`
  - `useItineraryChat` and chat modal/message components

QA I would run after implementation
1. Owner creates itinerary.
2. Owner invites by email and username.
3. Recipient sees invite regardless of casing/format normalization.
4. Recipient accepts:
   - attendee row created
   - shared itinerary visible immediately
   - itinerary opens successfully
   - owner sees collaborator in attendee list
   - chat button appears once 2+ real attendees exist
5. Recipient declines:
   - no attendee row created
   - invite leaves pending state cleanly
6. Collaborator permissions:
   - can view shared trip
   - can edit allowed trip content
   - cannot manage attendees/trip metadata
7. Chat:
   - both members can message/react/reply/upload/share cards
   - edit allowed only within 10 minutes
   - delete allowed anytime
   - a newly added member cannot see earlier messages
8. Regression:
   - owner trips, shared trips, upcoming/past sections, notifications, and invitation cards all stay in sync.
