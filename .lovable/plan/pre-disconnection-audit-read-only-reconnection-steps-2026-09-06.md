# Pre-Disconnection Audit (read-only) + Reconnection Steps

Nothing was disconnected, deleted, exported, deployed or changed. All findings below come from read-only queries.

## 1. Deletion candidate

- Project reference: `lmfipcgkqclvejmcknvm`
- URL: `https://lmfipcgkqclvejmcknvm.supabase.co`
- Managed by Lovable Cloud: yes. Paused: no. Size: Tiny.
- This is the backend the running Preview uses today (the app's generated environment file points here), while `supabase/config.toml` in the code points to the original project `dhbvweazpqnviqwgpurv`.

## 2. Auth users

- 1 auth user, 1 linked identity. No emails or personal data read or shown.
- That account was created 2026-09-06 21:51 UTC and has signed in — the fresh signup made after the accidental connection, not restored history.

## 3. Public tables and row counts

- Zero tables in the `public` schema. Zero database functions in `public`.
- There are no rows of application data of any kind in this backend. (This is also why the code currently shows type errors against the auto-generated database types: the generator produced an empty schema.)

## 4. Storage

| Bucket | Public | Objects |
| --- | --- | --- |
| avatars | yes | 0 |
| chat-attachments | yes | 0 |
| receipts | no | 0 |

Total stored objects: 0.

## 5. Edge Functions

No functions were deployed to this backend by this session. The 38 function folders in the code are source-only and undeployed here, which matches the missing-function and Mapbox 500 errors seen in Preview.

## 6. Secret / environment variable names (names only, no values)

`LOVABLE_API_KEY`, `RAPID_API_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `SUPABASE_ANON_KEY`, `SUPABASE_DB_URL`, `SUPABASE_JWKS`, `SUPABASE_PUBLISHABLE_KEYS`, `SUPABASE_SECRET_KEYS`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`.

All except `RAPID_API_KEY` and the two Stripe entries are auto-provisioned platform values. No values were read or displayed.

## 7. Anything created after the accidental connection

- 1 auth user (today, 21:51 UTC).
- 3 empty storage buckets.
- No tables, rows, files, or deployed functions. Nothing of business value.

## 8. Git status

- Branch: `main`, in sync with `origin/main`, working tree clean.
- Commit: `6a803591aefad87a6599cf82aeb777f13ae054e3` (2026-09-06 22:12:54 UTC) — the code-side rollback point.

## 9. Isolation guarantee

`dhbvweazpqnviqwgpurv` is a separate Supabase project outside this Lovable Cloud attachment. Disconnecting the Cloud backend acts only on `lmfipcgkqclvejmcknvm` and has no delete, write, or configuration path into `dhbvweazpqnviqwgpurv`. The only risk it carries is irreversibility for the empty project itself.

## 10. Export list before disconnection

Nothing needs exporting:

- Database: nothing to export (no tables/rows).
- Storage: nothing to export (0 objects).
- Auth: 1 throwaway account created today.
- Secrets: keep your own copies of `RAPID_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` — values cannot be read back out and will need re-entering after reconnecting.
- Function code and SQL already live in the repository at commit `6a803591`.

## 11. Approved disconnect + reconnect sequence

The disconnect and the connect are platform actions taken in the Lovable UI — they cannot be performed from code, so these steps are yours to click through:

1. Open the Cloud/backend tab → Advanced → Disconnect. Confirm. This permanently removes only `lmfipcgkqclvejmcknvm`.
2. Go to Connectors → Supabase and connect the existing original project `dhbvweazpqnviqwgpurv`. Choose "use existing project" — do not let any flow create a new one.
3. Tell me when it is connected. I will then re-run a read-only verification only: confirm Preview requests target `dhbvweazpqnviqwgpurv`, confirm the real tables and the two retained identities are visible, and regenerate nothing.

Stop points respected after reconnection: no migration, no Edge Function deployment, no secret creation or rotation, no publication, no data writes. I will pause for your approval before any of those.

## 12. Expected state between disconnect and reconnect

While no backend is attached, Preview will show login and data errors and the generated database types will stay empty. That is expected and resolves once `dhbvweazpqnviqwgpurv` is connected; no code changes should be made to compensate.
