# Gate 8 — Slice 1: Ready to Build (10 files)

Approval received in chat, but I'm still in plan mode — the edit tools are gated until you tap **Implement plan** below. Re-issuing the approved manifest unchanged so the switch to build mode can happen.

## Change set (exactly 10 files)

Edits:
1. `src/components/shared/MobileNavigation.tsx` — grid header (`[menu][logo][actions]`), `h-14` mobile top bar, in-flow logo `h-9`, show `CartIcon` + `NotificationCenter` on mobile, drawer typography softened (`text-xl font-medium`, tighter spacing, safe-area footer).
2. `src/components/navigation/MobileBottomNav.tsx` — expanded `HIDDEN_ROUTES` to include `/checkout`, `/cart`, `/booking-success`, `/subscription-success`; collapsed orb 56→48px; safe-area preserved.
3. `src/components/shared/CartIcon.tsx` — 40×40 tap target, consistent radius.
4. `src/components/shared/NotificationCenter.tsx` — matching 40×40 trigger, visible on mobile.
5. `src/components/ui/sonner.tsx` — mobile `max-w-[92vw]`, smaller padding, offset above bottom orb via safe-area.
6. `src/components/dashboard/sections/HeroWelcome.tsx` — insert `AgentChip` for **Miles · Travel concierge** (no Sparkles-as-identity).
7. `src/pages/Itinerary.tsx` — add `AgentChip` for **Miles** below the header container; no logic change. `ItineraryHeader` itself is not opened.
8. `src/pages/CreateItinerary.tsx` — rename right panel banner to **Bob · Planning specialist**, left panel to neutral "Classic booking assistant". No logic change to chat components.
9. `src/lib/taai/brand-identity.ts` — export `AGENT_ROLES` constant + `AgentKey`/`AgentRole` types. Miles/Bob `travelerFacing: true`; Ajax/Hermes `travelerFacing: false`.
10. `src/components/agents/AgentChip.tsx` *(new)* — avatar dot + name + role pill; refuses to render when `travelerFacing: false`. Consumed by files 6 and 7.

## Untouched (protected)
- `src/integrations/supabase/client.ts` (holds `sb_publishable_`, stays exactly as-is)
- `supabase/functions/**`, `supabase/migrations/**`, `supabase/config.toml`
- Checkout / Stripe / Gate 7 files, `AuthContext.tsx`, RLS, `.env`, secrets
- `package.json`, `package-lock.json`
- No deploy, no publish

## Post-build verification I will run and report
- Supabase key booleans: `uses_sb_publishable`, `uses_legacy_jwt_like`, `uses_sb_secret`, `mentions_service_role`
- `git diff --name-only` proving `src/integrations/supabase/client.ts` unchanged and only the 10 files touched
- Reserved-name grep on `src/pages` + `src/components/dashboard` + `src/components/itinerary` + `src/components/agents` for `Ajax|Hermes|Tom|Scott|Manny|Benny|Piper|Lester|Scout`
- Typecheck output

Tap **Implement plan** to switch to build mode and I'll execute the 10 edits immediately.
