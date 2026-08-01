## Status: blocked, holding

The accepted Gate 8 Slice 2F-B0/B1/B2 implementation is not present in this repository. Confirmed read-only, no changes made:

- Refs checked: `main`, `origin/main`, `origin/HEAD`, `edit/edt-e0243873…` (HEAD), `edit/edt-23d05ca8…`
- `git grep chatMode -- supabase/functions/chat-with-gpt/index.ts` on every ref → no match
- `git log --all -S"chatMode"` → zero commits
- HEAD `8dccfcd Swapped Bob for Miles branding`, working tree clean
- `supabase/functions/chat-with-gpt/index.ts`: 1624 lines, md5 `5ec21e63bb5fb8bb492b4956b8619a23`; `search_hotels` still exposes `max_price`/`min_rating`, `search_activities` still exposes `date`/`category`/`max_price`

Per your instruction, I will not re-implement B0/B1/B2 from this stale checkout, and I will not reset, force-pull, overwrite, or discard anything.

## What you need to do

Make the accepted state reachable from this project, by either:

1. Pushing the Hermes branch/commit to this project's GitHub remote (Git sync), so it appears under `origin/…` here; or
2. Pasting the full accepted diff (or the four accepted files) into chat.

Accepted file set to arrive:
- `src/components/chat/ChatInterface.tsx`
- `src/components/itinerary/PlanningDraftReview.tsx`
- `src/pages/CreateItinerary.tsx`
- `supabase/functions/chat-with-gpt/index.ts`

## Step 1 — Verify the accepted state (read-only, before any edit)

Once present, I re-read the working-tree files and report, with line references, that each locked guard exists:

B0
- `chatMode` parameter parsed
- missing/unknown mode fails closed to planning
- planning allowlist = `search_hotels`, `search_flights`, `search_activities`, `search_restaurants`
- `get_itinerary` and `list_itineraries` excluded in planning mode
- all conversational write tools globally blocked
- saved itinerary context excluded in planning mode

B1
- history limited to `user`/`assistant` roles
- max 10 messages, max 1,500 chars per message, max 10,000 total chars
- malformed history falls back to `[]`
- history used as context only, never as authorization

B2
- complete read-only searches execute immediately
- exactly one clarification when a required field is missing
- no gratuitous "Would you like me to proceed?"
- flight `passenger count` supported
- max-stops filtering not supported
- ignored hotel/activity params removed from the active model schema
- provider mappings unchanged

If any of these are absent, I stop again and report rather than patching around them.

## Step 2 — Implement B3 only

Scope: `supabase/functions/chat-with-gpt/index.ts` only. B0/B1/B2 behavior untouched.

B3 adds capability-grounding and persistence-claim guards to the planning-mode system contract so Miles' language matches what the tools actually did:

- Miles never states or implies that anything was created, saved, updated, added to an itinerary, booked, reserved, paid, cancelled, refunded, or confirmed. Planning chat has no write authority and must say so plainly when asked.
- Miles never claims a filter was applied that the active schema does not support: no max-stops claims for flights; no hotel maximum-price or minimum-rating claims; no activity date/category/max-price claims. If a traveler asks for one, Miles says the filter is not supported and returns unfiltered results the traveler can narrow manually.
- Miles describes restaurant results as Yelp business-search results, not reservation availability or bookable tables.
- Selections made from results are described as local planning-draft selections that the traveler must review and save themselves — never as persisted state.
- The guard lives in the planning-mode system instruction alongside the existing B0 fail-closed block, so unknown/missing `chatMode` inherits it.

No frontend file changes are expected. If a compile error forces one, I report the exact change before committing it.

## Constraints honored

- No deploy, no publish, no edge-function redeploy
- No database migrations
- No changes to checkout, Stripe, or booking code
- No git reset/force operations of any kind

## Verification

- `npx tsc --noEmit` clean
- `git status --short` and `git show --name-only HEAD` reported so you can confirm the B3 commit touches only the one edge-function file
