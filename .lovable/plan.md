

# Itinerary Collaborator Chat -- Full-Slide Modal

## Approach

A full-screen modal (Sheet/Dialog) triggered from a **MessageCircle** button in the `ItineraryHeader` action row. The button only appears when the itinerary has 2+ attendees. This avoids new routes and keeps chat contextually tied to the itinerary.

All chat data lives in Supabase with RLS. No end-to-end encryption in this phase (that's the Phase 2 social plan); this is a functional group chat scoped to each itinerary.

---

## Database (2 new tables, 1 migration)

### `itinerary_chat_messages`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| itinerary_id | bigint | NOT NULL |
| sender_id | uuid | NOT NULL, refs auth.users |
| content | text | message body |
| attachment_type | text | null, 'image', 'calendar_event', 'itinerary_card' |
| attachment_data | jsonb | url/card payload |
| reply_to_id | uuid | nullable, self-ref for replies |
| edited_at | timestamptz | null until edited |
| deleted | boolean | default false (soft delete) |
| created_at | timestamptz | default now() |

### `itinerary_chat_reactions`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| message_id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| reaction | text | default 'like' |
| created_at | timestamptz | |
| UNIQUE(message_id, user_id, reaction) | | |

### `itinerary_chat_participants`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| itinerary_id | bigint | NOT NULL |
| user_id | uuid | NOT NULL |
| joined_at | timestamptz | default now() |
| UNIQUE(itinerary_id, user_id) | | |

**RLS rules:**
- Messages SELECT: user must be a chat participant AND `message.created_at >= participant.joined_at` (new users can't see old messages)
- Messages INSERT: user must be a chat participant
- Messages UPDATE: only sender, only within 10 min of created_at for content edits
- Messages DELETE: soft-delete only, sender only
- Reactions: participants can insert/delete their own
- Participants: auto-populated via a trigger on `itinerary_attendees` insert (status='accepted')

A trigger on `itinerary_attendees` INSERT will auto-insert into `itinerary_chat_participants`.

---

## Frontend Components

### 1. Chat Button in `ItineraryHeader.tsx`
- Add `MessageCircle` icon button in the `customActions` div
- Only render when `attendees.length >= 2` (fetch attendee count via existing `useItineraryAttendees`)
- Opens the chat modal

### 2. `ItineraryChatModal.tsx` (new, main component)
Full-screen Sheet from the right side. Contains:
- **Header**: Trip name, participant avatars, close button
- **Filter bar**: Tabs for "All", "Media", "Docs", plus a participant filter dropdown
- **Message list**: Scrollable area with Supabase Realtime subscription
- **Input bar**: Text input + attachment button (image upload, share itinerary card) + send

### 3. `ChatMessage.tsx` (new)
Single message bubble:
- Sender avatar + name + timestamp
- Reply-to preview (if replying)
- Content text with attachment rendering
- Long-press/right-click context menu: Reply, Copy, Edit (if sender + within 10 min), Delete (if sender)
- Like reaction button (heart icon, shows count)
- "Edited" label if `edited_at` is set
- "This message was deleted" placeholder if soft-deleted

### 4. `ChatAttachmentPicker.tsx` (new)
Popover with options:
- Upload photo (to Supabase storage bucket `chat-attachments`)
- Share itinerary card (select from flights/hotels/activities/reservations)
- Share calendar event (select a date from the trip)

### 5. `useItineraryChat.ts` (new hook)
- Fetches messages with sender info joined from `users` table
- Supabase Realtime channel for new messages, edits, deletes, reactions
- `sendMessage(content, attachmentType?, attachmentData?, replyToId?)`
- `editMessage(id, newContent)` -- checks 10-min window client-side, enforced by RLS
- `deleteMessage(id)` -- soft delete
- `toggleReaction(messageId)`
- Filter state: media/docs/participant

---

## Storage

Create a new public bucket `chat-attachments` for image uploads with RLS allowing authenticated users to upload and all participants to read.

---

## Key UX Details

- **Copy message**: Long-press (mobile) or right-click (desktop) opens context menu with "Copy" option using `navigator.clipboard.writeText()`
- **Reply**: Tapping "Reply" shows a reply preview bar above the input, referencing the original message
- **10-min edit window**: Edit option grayed out / hidden after 10 minutes from send time
- **New participant visibility**: RLS `WHERE message.created_at >= participant.joined_at` ensures new members only see messages from their join time forward
- **Filters**: "Media" tab filters `attachment_type = 'image'`; "Docs" filters calendar/card attachments; participant dropdown filters by `sender_id`
- **Reactions**: Single "like" heart on each message, toggleable, shows count
- **Styling**: Uses existing semantic tokens (`bg-card`, `border-border`, `text-foreground`), gold gradient for send button, matches itinerary page theme

---

## Files to Create/Edit

| Action | File |
|--------|------|
| Migration | `supabase/migrations/` -- 3 tables, RLS, trigger |
| New bucket | `chat-attachments` storage bucket |
| New | `src/hooks/useItineraryChat.ts` |
| New | `src/components/itinerary/chat/ItineraryChatModal.tsx` |
| New | `src/components/itinerary/chat/ChatMessage.tsx` |
| New | `src/components/itinerary/chat/ChatAttachmentPicker.tsx` |
| Edit | `src/components/itinerary/ItineraryHeader.tsx` -- add chat button |
| Edit | `src/pages/Itinerary.tsx` -- pass attendee count, manage chat modal state |

---

## Implementation Order

1. Database migration (tables + RLS + trigger + storage bucket)
2. `useItineraryChat` hook with Realtime
3. `ChatMessage` component
4. `ChatAttachmentPicker` component
5. `ItineraryChatModal` assembly
6. Wire into `ItineraryHeader` + `Itinerary.tsx`

