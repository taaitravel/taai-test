# Notifications system

Five preference groups in Profile, real triggers wiring into them, plus a new follow/friend system for the Travellers group.

## 1. Database

**`notification_preferences`** (one row per user, auto-created on signup)
- `chat_messages` bool default true — DMs / group chat from others
- `chat_mentions` bool default true — @mentions
- `trip_reminders` bool default true
- `trip_reminder_lead_hours` int default 4 (choices: 2, 4, 12, 24)
- `trip_updates` bool default true — collaborator added an item, changed dates, etc.
- `traveller_requests` bool default true — new follow request
- `traveller_accepts` bool default true — someone accepted you
- `newsletter` bool default true
- `deals` bool default true

**`chat_mutes`** — `(user_id, itinerary_id)` unique, mutes a single chat.

**`user_follows`** — real follow system
- `follower_id`, `following_id`, `status` (`pending` | `accepted`), unique pair
- RLS: see your own follows in either direction; insert as follower; recipient updates status; either party deletes.
- Trigger on insert/update → write a `notifications` row (gated by recipient's `traveller_requests` / `traveller_accepts` pref).

## 2. Notification gating

A SQL helper `notify_user(_user_id, _pref_key, _payload)` checks the preference (and `chat_mutes` for chat) before inserting into `notifications`. All call sites switch to it:
- `itinerary_chat_messages` insert trigger → `chat_messages` (skip own messages, skip muted chats)
- `generate-reminders` edge function → `trip_reminders`, uses `trip_reminder_lead_hours`
- `accept-invitation` / collaborator added → `trip_updates`
- `user_follows` triggers → `traveller_requests` / `traveller_accepts`
- Newsletter / Deals: no automation yet — flags are stored and respected when broadcast functions land later.

## 3. Copy (concise, polite, light sass + useful emojis)

- 💬 "{name} sent you a message" / "💬 {name} mentioned you in {trip}"
- ✈️ "Wheels up in {n}h — {origin} → {dest}. Travel light, fly easy."
- 🏨 "Check-in at {hotel} today. Your bed is waiting."
- 🍽️ "Time to head to {restaurant}! Table for {n} is a lot to keep up with — let's be on time."
- 🎯 "{activity} in {n}h. Don't keep the day waiting."
- 👋 "{name} wants to follow you"
- 🤝 "{name} accepted your follow"
- 🧳 "{name} added {item} to {trip}"
- 📰 / 🏷️ Newsletter & Deals reserved for future broadcasts.

## 4. UI — new Profile tab "Notifications"

`Profile.tsx` gains a 4th tab `Notifications` (Bell icon). Renders `NotificationPreferencesSection` with five collapsible group cards:

```text
🔔 Text & Chat
   • Messages from others        [toggle]
   • @mentions                    [toggle]
   • Muted chats: list with unmute button (sourced from chat_mutes)

✈️ Trips
   • Upcoming event reminders     [toggle]
   • Remind me [2h | 4h | 12h | 24h] before
   • Trip updates from collaborators [toggle]

🤝 Travellers
   • New follow requests          [toggle]
   • When someone accepts you     [toggle]
   • Manage followers / following / pending  → opens FollowsManagerDialog

📰 TAAI Travel Newsletter         [toggle]
🏷️ TAAI Deals                      [toggle]
```

A "Mute this chat" item also lives on each chat header (writes to `chat_mutes`) so users don't have to dig into Profile.

## 5. Follows surface

Minimal `FollowsManagerDialog` reachable from Travellers card with three tabs: Following, Followers, Pending. Actions: accept, reject, unfollow, cancel request. New entry point in TAAI Connect hub linking to the same dialog.

## Technical details

- Hook: `useNotificationPreferences()` — fetch + upsert single row, used in the new section and gating client-side fallbacks.
- Hook: `useFollows()` — list + mutate.
- Edge fn `generate-reminders` reads recipient's `notification_preferences` and uses `trip_reminder_lead_hours` to widen the upcoming window.
- All inserts into `public.notifications` move through `notify_user()` (SECURITY DEFINER) so RLS stays clean and gating is centralized.
- Realtime listener in `useNotifications` already handles INSERT — no change needed.

## Out of scope
- Email/push delivery (in-app only for now).
- Newsletter & Deals automation.
- Per-chat color theming (deferred per your call).
- Rich notification grouping/threading.
