# Issue #5 — Deployment Env Gate: Verification Plan

You will handle the reconnect in the Lovable UI. My job in build mode is verification only — no code edits, no deploy, no publish, no touch to checkout / Stripe / Gate 7 / edge functions / migrations / env secrets / unrelated files.

## Your side (Lovable UI, before I run verification)

1. **Supabase Dashboard** → project `dhbvweazpqnviqwgpurv` → Project Settings → API Keys → confirm the new default **publishable key** (`sb_publishable_...`) is enabled. Do not touch the secret / service_role key.
2. **Lovable** → project name (top-left) → **Settings → Cloud** → **Disconnect** the Supabase integration, then **Reconnect** to the same project.
3. Ping me in chat that reconnect is done.

## My side (build mode, verification only)

Read-only checks — no file writes:

1. Read `src/integrations/supabase/client.ts`. Confirm:
   - `SUPABASE_URL` still equals `https://dhbvweazpqnviqwgpurv.supabase.co` (project unchanged).
   - `SUPABASE_PUBLISHABLE_KEY` now starts with `sb_publishable_`.
   - No `eyJ...` JWT anywhere in the file.
2. Read `.env`. Confirm:
   - `VITE_SUPABASE_PUBLISHABLE_KEY` mirrors the same `sb_publishable_...` value.
   - `VITE_SUPABASE_URL` and `VITE_SUPABASE_PROJECT_ID` unchanged.
   - No `SUPABASE_SERVICE_ROLE_KEY` / `sb_secret_` present in this file.
3. Grep the whole `src/` tree for:
   - `eyJhbGciOiJIUzI1NiIs` — must return zero hits in frontend code.
   - `sb_secret_` — must return zero hits anywhere in frontend / `.env` / `VITE_` scope.
   - `SERVICE_ROLE` — allowed only inside `supabase/functions/**` (server-side), never in `src/**`.
4. Confirm no other files changed vs. the pre-reconnect state — the only diffs should be `src/integrations/supabase/client.ts` and `.env`.

## Runtime smoke check (optional, drive Playwright)

Only if you want a live confirmation the new key is accepted by the API:

1. Launch Chromium against `http://localhost:8080` with the injected managed session.
2. Navigate to an authenticated route (e.g. `/dashboard`).
3. Confirm no `401` / `Invalid API key` errors in the console or on any `dhbvweazpqnviqwgpurv.supabase.co/rest/v1/` request.
4. Confirm `supabase.auth.getSession()` returns the existing session (no forced re-login).

## Report I'll return

1. Changed files (expected: `src/integrations/supabase/client.ts`, `.env`; nothing else).
2. Whether `client.ts` now uses `sb_publishable_...` — yes/no.
3. Whether the legacy `eyJ...` anon JWT is fully removed from frontend config — yes/no.
4. Confirmation no `sb_secret_` / service_role key is exposed in frontend or `VITE_` scope.
5. Confirmation no deploy / publish was performed; whether a preview hard-refresh is needed (Vite HMR should suffice since `client.ts` is a module constant).
6. If the reconnect did **not** flip the prefix (i.e. `eyJ...` still present), I'll stop and report — the fallback is the "paste the `sb_publishable_` value" path, which requires your explicit go-ahead in a new turn.

## Out of scope (will not touch)

- `supabase/functions/**`, `supabase/migrations/**`, `supabase/config.toml`
- Any Stripe / checkout / payment / Gate 7 code
- `AuthContext.tsx` and other auth flow code
- Any RLS policies or SQL
- Any secret storage (`add_secret` / `update_secret` / service role)
