## Gate 9A1-A — two final corrections

### 1. Restore the six-file commit boundary

`.lovable/plan.md` is platform-written, not part of the approved scope. I cannot run git commands (git state is managed by the platform), so the safe resolution is content-level:

- Rewrite `.lovable/plan.md` back to its baseline (`becb77e`) content so the path shows no net diff in the Gate 9A range. If baseline content cannot be recovered from the working tree, I will report that and leave the file untouched rather than guess.
- Make no other file changes outside the six approved paths.
- Then report `git diff --name-status becb77e..HEAD` and `git log --oneline --decorate becb77e..HEAD` as observed, and state plainly whether the range shows exactly six paths. If the platform re-writes `.lovable/plan.md` after my edits (it does so automatically), I will say so explicitly instead of claiming a clean six-path range — the honest outcome may be "six approved paths plus a platform-written plan file that must be excluded at merge time."

### 2. Deterministic valid-approval selection

In `src/lib/taai/commercial/permissions.ts`, inside `validateApprovedCommercialAction`:

- Keep every existing gate unchanged: server authority, agent/action match, always-prohibited, requestable, scope list validity, generic `modify_internal_record` rejection, action-class → taskId → target filtering, and all of `evaluateRecord` (revocation, expiry, consumption, timestamp, scope checks).
- Replace the current early `return` on the first passing record with: evaluate **all** target-matched records, collect every record whose evaluation is `allowed`, and collect failures.
- If no record is valid → existing `RECORD_FAILURE_PRECEDENCE` logic, unchanged.
- If one or more are valid → sort deterministically and return the first:
  1. `approvedAt` descending (parsed ms, both already validated ISO 8601 with offset)
  2. `approvalId` ascending, literal case-sensitive comparison, as tie-breaker
- Input array order is never used.

```text
valid[] -> sort by (-Date.parse(approvedAt), approvalId asc) -> valid[0]
```

Doc comments updated in `permissions.ts` (and matching prose in `governance/commercial-agent-approval-policy.md`) to state: authorization is allowed when at least one valid approval exists; the returned `approvalId` is the newest valid approval; equal `approvedAt` values resolve by literal `approvalId` ordering.

### Technical notes

- Files touched: `src/lib/taai/commercial/permissions.ts`, `governance/commercial-agent-approval-policy.md`, and `.lovable/plan.md` (baseline restore only). No changes to `types.ts` or `agent-registry.ts` unless a type is needed — none is expected.
- No runtime code, migrations, packages, routes, integrations, generated types, env files, Gate R1, Stripe, checkout, payment, refund, or provider-confirmation changes. No deploy, no publish.

### Verification to run and report

`npx eslint` on the three TS files, `npx tsc --noEmit`, `npm run build`, `git diff --check`, `git diff --name-status becb77e..HEAD`, `git log --oneline --decorate becb77e..HEAD`, and the permission-partition results for all eight registry entries via `validateAllAgentPermissionPartitions()`.
