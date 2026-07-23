# Gate 8 Slice 2E — Bob Local Planning Draft (v2, approved)

Safety corrections baked in:
1. In planning-draft mode, `ChatResultsCarousel` **always** passes a discriminated `PlanningDraftCardAction` (`enabled` for valid normalized results, `disabled` for invalid). Failed normalization can never fall through to the default persistence path.
2. Carousel categories stay plural (`flights` / `hotels` / `activities` / `restaurants`) end-to-end. The adapter is the sole layer that maps them to singular kinds.

## Files to create

### 1. `src/types/planning-draft.ts`
```ts
export type PlanningDraftItemKind =
  | 'flight' | 'hotel' | 'activity' | 'restaurant' | 'note';

export type PlanningDraftResultType =
  | 'flights' | 'hotels' | 'activities' | 'restaurants';

export interface PlanningDraftItem {
  draftId: string;
  kind: PlanningDraftItemKind;
  title: string;
  provider: string | null;
  sourceResultId: string | null;
  providerRef: string | null;
  serviceDateStart: string | null;
  serviceDateEnd: string | null;
  locationLabel: string | null;
  price: number | null;
  currency: string | null;
  availabilityStatus:
    | 'provider_search_result'
    | 'planning_only'
    | 'needs_review';
  checkoutReadiness: 'not_checkout_ready';
  validationIssues: string[];
  rawSource: unknown;
}

export type ResultInteraction =
  | { mode: 'default' }
  | {
      mode: 'planning-draft';
      selectedDraftIds: ReadonlySet<string>;
      onAddToDraft: (resultType: PlanningDraftResultType, rawResult: unknown) => void;
      onRemoveFromDraft: (draftId: string) => void;
    };

export type PlanningDraftCardAction =
  | { mode: 'enabled'; draftId: string; selected: boolean; onToggle: () => void }
  | { mode: 'disabled'; reason: string };
```

### 2. `src/lib/itinerary/planning-draft.ts`
Pure module — no React, no Supabase, no network. Sole authority for kind, provider, source-id, fingerprint inputs, and `draftId`.

- `normalizeResult(resultType: string, rawResult: unknown): PlanningDraftItem | null`
- Internal `djb2(seed: string): string` for deterministic fallback fingerprints.

Rules:
- Non-object input or unknown `resultType` → `null`.
- Category mapping: `flights→flight`, `hotels→hotel`, `activities→activity`, `restaurants→restaurant`.
- Never invent dates, currency, availability, provider refs. Missing values → `null` + a `validationIssues` entry.
- Every returned item: `checkoutReadiness: 'not_checkout_ready'`.
- **flight**: title from airline + flightNumber; `serviceDateStart` from departure timestamp; `locationLabel = "${origin} → ${destination}"`; `availabilityStatus: 'provider_search_result'`; if price present without currency, keep price, null currency, add validation issue.
- **hotel**: title from `name`; `providerRef` preserves booking URL/id when present; dates only when supplied; `locationLabel` from city/address.
- **activity**: title from `name`; `serviceDateStart` only when supplied else validation issue; `locationLabel` from location/address.
- **restaurant**: always `availabilityStatus: 'planning_only'`; numeric `price === 0` treated as unknown (`price: null` + validation issue); `priceRange` retained only inside `rawSource`.
- `rawSource` always preserves untouched input.

`draftId` (sole authority — cards must never re-compute):
- Base: `${kind}:${provider ?? 'unknown'}:${sourceResultId ?? djb2(seed)}`.
- Fingerprint seed: `title|serviceDateStart|locationLabel|price|currency`.
- No `Math.random`, no `Date.now`; stable across renders for identical input.

### 3. `src/components/itinerary/PlanningDraftReview.tsx`
Presentational only. Props: `items: PlanningDraftItem[]`, `onRemove(draftId: string): void`. Shows count, kind + title + provider, price via `formatMoney` **only when price + currency both present** (else "Price not confirmed"), dates/location when known, validation issues, and disclaimers: "Provider availability not confirmed" and "Trip details are required before this draft can be saved." No Save button, no persistence.

## Files to modify

### 4. `src/components/chat/ChatResultsCarousel.tsx`
- Tighten `resultType` prop to `PlanningDraftResultType`.
- Add optional `interaction?: ResultInteraction` (default `{ mode: 'default' }`).
- In planning-draft mode, for the currently rendered result:
  ```ts
  const normalized = normalizeResult(resultType, currentResult);
  const planningAction: PlanningDraftCardAction = normalized
    ? {
        mode: 'enabled',
        draftId: normalized.draftId,
        selected: interaction.selectedDraftIds.has(normalized.draftId),
        onToggle: () =>
          interaction.selectedDraftIds.has(normalized.draftId)
            ? interaction.onRemoveFromDraft(normalized.draftId)
            : interaction.onAddToDraft(resultType, currentResult),
      }
    : { mode: 'disabled', reason: 'This result cannot be added to your draft.' };
  ```
  `planningAction` is passed to the child card in **both** branches — never `undefined` in planning-draft mode.
- Restaurants: pass `resultType='restaurants'` (plural) into both `normalizeResult` and `onAddToDraft`. `ActivityResultCard` continues to render restaurant visuals; only the callback pipeline matters for category.
- Default mode: `planningAction` is not passed; existing card behavior is preserved bit-for-bit.

### 5. `src/components/search/cards/FlightResultCard.tsx`, `HotelResultCard.tsx`, `ActivityResultCard.tsx`
- Add optional `planningAction?: PlanningDraftCardAction`.
- Contract:
  - `planningAction === undefined` → existing persistence path used exactly as today.
  - `planningAction.mode === 'enabled'` → button label toggles `"Add to draft" ↔ "Added to draft"`; click invokes `planningAction.onToggle()`; do **not** call the existing persistence handler, do **not** open `ItineraryMatcherModal`, do **not** touch Supabase, do **not** mutate `itin_map_locations`.
  - `planningAction.mode === 'disabled'` → render the Add control disabled (optionally surface `reason` as tooltip/subtext); the persistence handler remains unreachable in this branch too.
- Cards must **not** import `normalizeResult`, the djb2 helper, or perform any category/type conversion. They receive category-agnostic action objects only.

### 6. `src/components/chat/ChatInterface.tsx`
- Add optional `interaction?: ResultInteraction` prop; forward to `ChatResultsCarousel`. Defaults preserve current behavior for every existing caller.

### 7. `src/pages/CreateItinerary.tsx`
- `const [draft, setDraft] = useState<PlanningDraftItem[]>([])` — in-memory only.
- `addToDraft(resultType, raw)`: call `normalizeResult`; if `null`, no-op; else dedupe by `draftId` (idempotent) and append preserving insertion order.
- `removeFromDraft(draftId)`: filter.
- Build `interaction = { mode: 'planning-draft', selectedDraftIds: new Set(draft.map(d => d.draftId)), onAddToDraft, onRemoveFromDraft }` and pass **only** to the mobile Bob `ChatInterface`.
- Below the mobile Bob shell, mount `<PlanningDraftReview items={draft} onRemove={removeFromDraft} />`.
- Comment: state is in-memory; refresh/navigation clears the draft (by design in this slice).
- Desktop layout, Classic panel, Save button, `QuickAddToCart`, `BookingCart` — all unchanged.

## Non-goals / prohibited
No writes to `itinerary`, `cart_items`, `itin_map_locations`. No modal opening in planning-draft mode. No localStorage/sessionStorage. No checkout, Stripe, edge-function, migration, `.env`, `package.json`, AI-prompt, or Gate 7 changes. `src/integrations/supabase/client.ts` untouched. No deploy/publish. Slice 2F not begun.

## Validation
- `bunx tsgo --noEmit` clean.
- Mobile `/new-itinerary`: flights/hotels/activities/restaurants add locally via Bob results; duplicate Add is idempotent; Remove works; restaurants render "Price not confirmed" when price/currency unknown; no modal, no network write, no map mutation.
- Malformed result (adapter returns `null`) surfaces as `disabled` — Add is not clickable and persistence path is unreachable.
- Desktop `/new-itinerary` unchanged; Classic panel, Save, cart widgets behave exactly as before.
- All other `ChatInterface` and card call-sites unchanged (default `planningAction === undefined`).
- Slice 2A/2B/2C/2D regression check.

## Completion report will explicitly confirm
- Files changed + `bunx tsgo --noEmit` result.
- `normalizeResult` is the sole authority for `draftId`; cards contain no normalization, fingerprinting, or category conversion.
- Planning-draft mode always supplies an `enabled` or `disabled` `planningAction` (never `undefined`).
- Failed normalization cannot expose the default persistence path.
- `planningAction === undefined` occurs only outside planning-draft mode.
- Restaurants reach `normalizeResult` and `onAddToDraft` as `'restaurants'` (plural).
- Default behavior outside planning-draft mode remains unchanged.
- No itinerary, cart, map-location, checkout, or provider-confirmation write occurred.
- Mobile DOM inventory (Classic assistant, Save/View CTA, `QuickAddToCart`, `BookingCart` absent).
- Desktop DOM inventory (both panels + Save + cart widgets present).
- Dedupe/idempotency behavior verified.
- Refresh/navigation clears local draft (documented).
- Slice 2A/2B/2C/2D regression check.
- Protected files untouched; no deploy; Slice 2F not begun.
