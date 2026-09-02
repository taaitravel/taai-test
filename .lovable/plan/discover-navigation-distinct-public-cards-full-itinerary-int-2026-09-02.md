# Discover: navigation, distinct public cards, full itinerary interiors

## 1. Getting to Discover

- Keep the existing menu entries (authenticated menu + mobile drawer already list Discover) and add Discover to the mobile overflow cluster on `/home` so it is reachable from the dashboard chrome.
- Add a dashboard "sublet" strip under the hero: a bright card row titled "Discover trips" with a short line, 2-3 preview thumbnails of public itineraries, and a "Browse Discover" button routing to `/discover`. It reads only the lightweight card projections (no extra queries).

## 2. Public itinerary cards — same shape, different skin

- New `PublicItineraryCard` component reusing the established search-card dimensions (270x385 responsive grid behaviour, same radius/shadow language as `HotelSearchCard`).
- Top 50% of the card is a cover panel (gradient/photo-style treatment) with the destination and day count overlaid; bottom 50% carries title, summary, author, clone count, and a single primary action.
- Visual distinction: public/not-yet-added itineraries use the warm gold accent family (like search results), while owned itineraries keep the coral/navy treatment of `ItineraryCard`. Same silhouette, clearly different colour identity, so users instantly read "inspiration, not mine yet".
- Discover rows and public profile pages both switch to this card. Nothing else in the app changes visually.

## 3. Trim fixtures to 6 real-feeling trips

- Keep only two rows: **Trips by taai** (3) and **Featured** (3). Remove Trending, Weekend Escapes, Complete Journeys and the remaining ~18 seeds to cut memory and payload.
- For each of the 6, author the content properly rather than generic filler: named real hotels/stays, named restaurants, named activities and neighbourhoods, sensible timings, per-day flow, and approximate prices with correct currency formatting. I will research current, existing properties and venues for each destination while building so the recommendations are real and plausible, and label them as reference-only (prices searched fresh on clone).

## 4. Interior detail page = looks like a real taai itinerary

`/t/:slug` gets the same field set as an account itinerary, read-only:

- Header: cover, title, dates window, destinations, day count, traveller-style tags, author attribution, Save / Make this trip mine.
- Day-by-day schedule rows matching the platform's daily-schedule standard (time, type badge, venue, note, expandable detail).
- Calendar view toggle so the trip can be seen laid out on a month calendar with event dots, matching the existing itinerary calendar pattern.
- Summary blocks: stays, dining, activities, transit counts and an indicative budget breakdown by type — presented as references, never bookings.

## Technical notes

- Fixtures stay synthetic and local (`src/lib/social/mock-discover.ts` reshaped into 6 richly authored trips with day/time-level items); no DB writes, no provider calls, no schema changes, and the unapplied social migration stays unapplied.
- New files: `src/components/social/PublicItineraryCard.tsx`, a Discover strip component for the dashboard, and a public calendar view component reusing existing itinerary calendar primitives.
- Edits: `DiscoverRow.tsx`, `Discover.tsx`, `PublicItinerary.tsx`, `PublicProfile.tsx`, dashboard content, `route-config.ts`.
- Detail projections extend `PublicItineraryDetail` with timed items and dates; card projections stay lightweight for row rendering.
