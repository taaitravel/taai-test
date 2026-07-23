## Gate 8 Slice 2F-A — Visible Miles Identity

Frontend-only rename of the traveler-facing planning identity from Bob to Miles on `/new-itinerary`, plus brand-identity corrections. No behavior, backend, or Slice 2E logic changes.

### Files to modify (3)

**1. `src/pages/CreateItinerary.tsx`**

Mobile block:
- `<h1>` "Plan with Bob" → "Plan with Miles"
- `<p>` "Your taai planning specialist" → "Your taai travel companion"
- Mobile `<ChatInterface>` props:
  - `placeholder="Ask Miles about planning your perfect trip..."`
  - `assistantName="Miles"`
  - `assistantSubtitle="Travel companion"`
  - `greeting="Hi, I'm Miles — your taai travel companion. Where should we begin?"`
- Preserve `interaction={bobInteraction}`, `mobileComposerAssist`, `embedded`, `itineraryId`, `context`. `PlanningDraftReview` remains.

Desktop block:
- Right-column header "Bob · Planning specialist" → "Miles · Travel companion"
- Right-column `<ChatInterface>` props updated to Miles (same four strings as mobile).
- Preserve Classic assistant (left column), Save button flow, and `savedItineraryId`-gated BookingCart/QuickAddToCart.
- Do not add `interaction` prop to desktop instance (preserves current behavior).

**2. `src/lib/taai/brand-identity.ts`**

- Extend `AgentKey` union to include `benny`.
- Update JSDoc: Miles is the primary traveler-facing agent; Benny is traveler-facing for support only; Bob/Ajax/Hermes are internal.
- `AGENT_ROLES`:
  - `miles`: `travelerFacing: true`, role "Travel companion", summary updated.
  - `benny` (new): `travelerFacing: true`, role "Support specialist", summary describes complaints/refunds/service recovery.
  - `bob`: `travelerFacing: false`, summary "Internal planning specialist that may support Miles behind the scenes."
  - `ajax`, `hermes`: unchanged (`travelerFacing: false`).

**3. `src/components/agents/AgentChip.tsx`**

- Header comment "Traveler-visible identity chip for Miles / Bob." → "Traveler-visible identity chip for approved traveler-facing agents."
- Preserve `travelerFacing` render guard and all rendering logic.

### Non-goals

- No changes to `ChatInterface.tsx`, `ChatResultsCarousel.tsx`, `planning-draft.ts`, `PlanningDraftReview.tsx`, edge functions, migrations, Supabase client/types, checkout, Stripe, `.env`, `package.json`.
- No Benny routing/UI. No global Miles orb.
- Slice 2F-B and Slice 2G not begun.

### Validation

- `npx tsc --noEmit`
- `grep -RniE "Plan with Bob|Ask Bob|I'm Bob|Bob · Planning specialist" src` → no matches.
- `git status --short`, `git diff --stat`, `git diff --name-only`.
