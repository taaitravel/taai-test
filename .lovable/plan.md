# Pre-Disconnection Audit (read-only)

Nothing was disconnected, deleted, exported, deployed or changed. All findings below come from read-only queries.

## 1. Deletion candidate

- Project reference: `lmfipcgkqclvejmcknvm`
- URL: `https://lmfipcgkqclvejmcknvm.supabase.co`
- Managed by Lovable Cloud: yes. Paused: no. Size: Tiny.
- This is the backend the running Preview uses today (the app's generated environment file points here), while `supabase/config.toml` in the code points to the original project `dhbvweazpqnviqwgpurv`.

## 2. Auth users

- 1 auth user, 1 linked identity. No emails or personal data read or shown.
- That account was created 2026-09-06 21:51 UTC and has signed in — i.e. it is the fresh signup made after the accidental connection, not restored history.

## 3. Public tables and row counts

- Zero tables in the `public` schema. Zero database functions in `public`.
- Therefore there are no rows of application data of any kind in this backend.

## 4. Storage

Buckets exist (created by the scaffold) but are empty:

| Bucket | Public | Objects |
| --- | --- | --- |
| avatars | yes | 0 |
| chat-attachments | yes | 0 |
| receipts | no | 0 |

Total stored objects: 0.

## 5. Edge Functions

No functions have been deployed to this backend by this session (no deployment was ever run against it). The 38 function folders in the code are source-only and undeployed here; the missing-function and Mapbox 500 errors seen in Preview are consistent with that.

## 6. Secret / environment variable names (names only, no values)

`LOVABLE_API_KEY`, `RAPID_API_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `SUPABASE_ANON_KEY`, `SUPABASE_DB_URL`, `SUPABASE_JWKS`, `SUPABASE_PUBLISHABLE_KEYS`, `SUPABASE_SECRET_KEYS`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`.

All except `RAPID_API_KEY` and the two Stripe entries are auto-provisioned platform values that are recreated with any backend. No values were read or displayed.

## 7. Anything created after the accidental connection

- 1 auth user (the fresh signup at 21:51 UTC today).
- 3 empty storage buckets.
- No tables, no rows, no files, no deployed functions.

Nothing of business value was created here.

## 8. Git status

- Branch: `main` (in sync with `origin/main`).
- Commit: `6a803591aefad87a6599cf82aeb777f13ae054e3` (2026-09-06 22:12:54 UTC), working tree clean.
- Rollback point for the code side is this commit.

## 9. Isolation guarantee

`dhbvweazpqnviqwgpurv` is a separate Supabase project in a separate project namespace and is not managed by this Lovable Cloud attachment. Disconnecting the Cloud backend acts only on `lmfipcgkqclvejmcknvm`; it has no delete, write, or configuration path into `dhbvweazpqnviqwgpurv`. The only risk it carries is irreversibility for the empty project itself.

## 10. Export list before disconnection

Nothing needs exporting:

- Database: nothing to export (no tables/rows).
- Storage: nothing to export (0 objects).
- Auth: 1 throwaway account created today; the real identities live in `dhbvweazpqnviqwgpurv`.
- Secrets: only `RAPID_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` are yours to re-supply after reconnecting; make sure you still hold those values on your side, since values cannot be read back out.
- Edge Function code and SQL already live in the repository at commit `6a803591`.

## Conclusion

The deletion candidate holds no application data, no files, no deployed functions and one same-day test account. Audit only — no further action taken.
