# Edge Function predeployment security audit

Scope: `chat-with-gpt`, `expedia-rapid-api`, `booking-com-api`.
Status: local code audit only. Nothing was deployed, migrated, published, or called upstream.

## 1. Deployment units

| Unit | Contents | Depends on |
| --- | --- | --- |
| **A. Frontend containment** | `src/lib/data/projections.ts`, `src/lib/data/cart-loading.ts`, `src/hooks/useAgentOperations.ts`, `src/components/booking/BookingCart.tsx`, tests | none |
| **B. chat-with-gpt** | `supabase/functions/chat-with-gpt/index.ts`, `supabase/functions/_shared/itinerary-context.ts` | none |
| **C. Hotel provider proxies** | `supabase/functions/expedia-rapid-api/index.ts`, `supabase/functions/booking-com-api/index.ts`, `supabase/functions/_shared/hotel-contract.ts`, `supabase/functions/_shared/edge-guard.ts` | Unit A for the new UI-contract fields (backward compatible: old field names retained) |

Units are independently deployable. C adds fields, never removes them, so an old frontend keeps working.

## 2. Per-function controls

| Control | chat-with-gpt | expedia-rapid-api | booking-com-api |
| --- | --- | --- | --- |
| Authentication | Bearer JWT via `auth.getUser`; 401 without header or on invalid token | same | same |
| Authorization boundary | itinerary reads scoped `.eq('userid', userId)`; write path narrows through `asAiItineraryRow` | provider proxy only, no DB reads/writes | provider proxy only, no DB reads/writes |
| Allowed methods | `POST`, `OPTIONS` (other verbs fail input validation) | `POST`, `OPTIONS`; else 405 | `POST`, `OPTIONS`; else 405 |
| CORS | `*` with fixed header allow-list (unchanged this pass) | origin allow-list via `buildCorsHeaders` (`*.lovable.app`, `*.lovableproject.com`, localhost dev) | same |
| Rate limiting | upstream AI gateway 429/402 surfaced to caller | 30 requests / 60 s per user id (`allowRequest`) | 30 requests / 60 s per user id |
| Upstream timeout | AI gateway default | 15 s `AbortController` | 15 s `AbortController` |
| Max request size | zod-validated bounded schema + trimmed history | 16 KB (`readBoundedJson`) | 16 KB (`readBoundedJson`) |
| Max response size | bounded context caps (14 days, 20 items/section, 10 history messages) | 4 MB read cap, then normalized to ≤20 results | 4 MB read cap, then normalized to ≤20 results |
| Raw provider-body logging | context snapshot never logged, only counts | upstream status only, never the body | upstream status only, never the body |
| Secret exposure | keys read from env, never echoed or returned | same | same |
| Safe errors | generic messages, no stack, no upstream text | generic `Upstream request failed/timed out` | generic message + preserved `QUOTA_EXCEEDED` signal |
| SSRF | n/a (fixed gateway URL) | host allow-list `expedia13.p.rapidapi.com`, https only | host allow-list `booking-com15.p.rapidapi.com`, https only |
| Rollback | `supabase/functions/chat-with-gpt/index.ts` at the pre-pass commit | `supabase/functions/expedia-rapid-api/index.ts` at the pre-pass commit | `supabase/functions/booking-com-api/index.ts` at the pre-pass commit |

Rollback for every unit is a checkout of the listed files at the commit preceding this pass; no database or provider state changes, so rollback is code-only.

## 3. Type-safety audit

- The seven `Record<string, any>` casts in `chat-with-gpt` are replaced with `asAiItineraryRow`, which validates identity fields and coerces the four section arrays at runtime.
- `projectedRow` / `projectedRows` in `src/lib/data/projections.ts` are the only sanctioned projection boundary casts. They exist because PostgREST cannot infer a row type from a runtime column list; each projection they serve is covered by a regression test.
- `type Row = Record<string, any>` remains in `hotel-contract.ts` by design: it describes *untrusted provider input*, every field is read through `str`/`numOrNull`/`clip` narrowing helpers, and no value reaches the response un-normalized.

## 4. Unapplied proposal

`supabase/schema-proposals/chat-reactions-itinerary-scope.sql` — reaction trip scoping (FK, deterministic backfill, trigger, index, grants, owner/member RLS, trip-filtered realtime). Not applied; requires explicit approval.

## 5. Remaining risks

- Reaction realtime remains unfiltered until the proposal above is approved; the client already ignores events outside the loaded page.
- `useAuthenticatedItineraryData` still reads cart `item_data`, because the itinerary workspace renders the saved flight/hotel/activity snapshots. Narrowing it needs a separate section-level contract.
- `chat-with-gpt` CORS is still `*`; tightening it is deliberately out of scope for this pass to avoid breaking existing callers.

## 6. Final hardening pass (local-only)

**Allowed origins** — production: `https://taai-test.lovable.app`; preview:
`https://id-preview--f8b1d397-680f-4f30-95f9-82a6b0a9eafd.lovable.app`;
`http://localhost:8080` and `http://localhost:5173` only when `TAAI_ENV` is not
`production`. No wildcard anywhere; unapproved browser origins get 403 and no
`Access-Control-Allow-Origin` header. `OPTIONS` is handled in all three
functions.

**Authentication** — all three functions verify the bearer JWT server-side with
an anon-key client (`authenticate` + `supabase.auth.getUser`), take the user id
only from the verified token, strip `user_id`/`userId`/`userid`/`sub`/`owner_id`
from the body (`stripCallerIdentity`), and return 401 when the header is absent
or the token invalid. Itinerary/cart access stays scoped by `userid`/`user_id`
(and RLS).

**Rate limiter** — process-local, per-isolate, best-effort only. It does NOT
guarantee 30 requests/minute per user globally; a cold start resets a window.
Authoritative replacement prepared, unapplied, in
`supabase/schema-proposals/edge-rate-limit-authoritative.sql`.

**Provider egress** — `resolveProviderUrl` rebuilds every request from a fixed
https host plus an allow-listed path, so caller absolute URLs, ports,
credentials, localhost, private ranges and `169.254.169.254` are unreachable.
Redirects are never followed (`redirect: 'manual'`, 3xx → safe 502).

**Outbound ceiling** — normalized responses are capped at 256 KB
(`MAX_NORMALIZED_BYTES`, 1/16 of the 4 MB upstream cap); exceeding it returns
`Normalized response exceeded size ceiling`.

**Reaction backfill** — only reactions resolving to exactly one itinerary are
backfilled; everything else is quarantined verbatim and the migration aborts if
any unresolvable row remains. Still unapplied.
