# Public trips, sharing, Miles, flights and a new Browse page

Nine items, grouped into five slices so each one can be checked before the next.

## Slice 1 — Publish, share and cover photo

**Make a trip public (item 2)**
- New "Visibility" control on the trip page (Overview tab and the trip menu): Private / Public, with a plain-language note that public trips appear on Browse and can be opened by anyone with the link.
- Only the trip owner sees or can change it.
- Publishing asks for a short blurb (used as the card summary) and confirms the destination list shown publicly.

**Share button (item 1)**
- The share icon opens a small menu: Copy link, Share (native share sheet on phones), Download PDF, Email link.
- Private trip: the link only works for people already on the trip, and the menu says so.
- Public trip: the link is the public trip page (`/t/<slug>`), safe to send to anyone.

**Cover photo (item 6)**
- "Add cover photo" on the trip header, replacing the current gradient.
- Uploads are resized in the browser before saving: max 1600px wide, JPEG, aimed at roughly 300KB, hard cap 2MB. Keeps storage cheap.
- Owner can replace or remove it. No photo means the current gradient stays.

## Slice 2 — Public trips on Browse, and the cards (items 5, 7, 8)

- A trip set to public shows up on Browse under **taai Creators** (community) or **Trips by taai** (our own account), and its card switches to the public/inspiration format.
- Card top-right label becomes **taai** or **User** — "Featured" stops being a label and becomes a section on Browse instead.
- Card top-left shows the creator's **@username**, linking to their public profile; the public trip page also shows the creator with a profile link.
- Public pages only ever expose: title, blurb, destinations, day count, cover photo, day-by-day plan, rough cost band, creator name/@username. Never travellers, chats, bookings, receipts, invitations, or real prices paid.

## Slice 3 — Browse page rebuilt like Search (item 9)

Replaces the Netflix-style side-scrolling rows.
- Default **AI-organised view**: trips grouped into themed lists (e.g. by region, trip length, pace) as swipeable stacks, matching the Search results behaviour.
- **Grid view** toggle with filters: location(s), created by (taai / user), created date (newest / oldest), cost (low → high / high → low).
- Sections: Trips by taai, taai Creators, Trending.
- Mobile: same stack swipe (side to browse, up to open) already used on the dashboard.

## Slice 4 — Ask Miles, working (item 3)

- "Ask Miles" opens a chat panel that actually answers, using the built-in Lovable AI (Gemini Flash), streamed responses, markdown rendered.
- Miles is given the current trip's context (dates, destinations, planned items, budget) so answers are specific.
- Miles can suggest and hand off to search ("find hotels in Lisbon for these nights") but does not book, pay, or change the trip without you confirming.
- Errors (out of credits, rate limited) show a clear message rather than a fake reply.

## Slice 5 — Flights and the admin account (items 4, 7)

**Flights (item 4)**
- The airport codes we send are already in Duffel's format (3-letter IATA, uppercased), so the codes are not the cause. The likely cause is the Duffel key not being available to this project's backend and/or the flight search function not being deployed — this project's secret list currently shows only Stripe and RapidAPI keys.
- Steps: confirm/attach the Duffel test key, deploy the flight search function, run a real JFK→MIA test search, and fix whatever the live response shows (airport-vs-city code handling, cabin naming, date format) with the actual error in hand.
- Results stay reference-only test mode — no booking or payment.

**Admin page (item 7/8)**
- Admin-only page for the `info@taai.travel` account: list all taai-authored trips, create/edit them, set cover photo, publish/unpublish, and see which are live on Browse.
- Trips owned by that account are labelled **taai** everywhere.

## Technical notes

- Backend changes on the `itinerary` table (currently has no visibility, slug, cover or blurb columns): add `visibility`, `public_slug`, `public_summary`, `cover_image_path`, `published_at`, plus indexes. RLS: owner full access; anonymous/authenticated read limited to a sanitised public view (`security_invoker`) exposing only the allow-listed fields; base-table public SELECT stays denied.
- Public reads go through the sanitised view only; `src/lib/social/projections.ts` allow-lists remain the single source of truth for public fields.
- New private storage bucket `trip-covers` with owner-write policies and public read for published trips; client-side resize before upload.
- Discover switches from `DISCOVER_ROWS` fixtures to real published rows, keeping the six synthetic trips as seeded taai trips so the page is never empty.
- Miles runs in a `miles-chat` Edge Function using the AI SDK + Lovable AI Gateway; no keys client-side.
- Flight work stays inside `supabase/functions/flight-search/*` and `useFlightSearch.ts`; test-mode/reference-only guards unchanged.

Order of work: Slice 1 → 2 → 3 → 4 → 5. Each slice ends with typecheck, tests, build and desktop/mobile visual checks.
