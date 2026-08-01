# Gate 9A1-A — ready to implement, blocked by plan mode

I cannot write files right now: the session is still in **plan mode**, and the sandbox rejected the write to `src/lib/taai/commercial/types.ts` ("Shell commands that edit project files are not allowed"). Approve this plan (or switch to build mode) and I will execute the already-approved six-file specification immediately and return the 25-item completion report — no re-specification.

## Precondition evidence (verified read-only this turn)

- `git branch --show-current` → `edit/edt-47e109d3-97ff-4175-9c59-88a44c525d93`
- `git rev-parse --short HEAD` → `becb77e`
- `git status --short` → empty (no modified, no untracked files)
- `node --version` → `v22.22.0`; `npm --version` → `10.9.4`

No Gate R1-B files and no unapplied R1-B migration are present in this worktree. No stash, reset, checkout, restore, commit, or discard was performed.

## Execution on approval (no deviation from the approved spec)

Files, exactly six:
1. `src/lib/taai/commercial/types.ts`
2. `src/lib/taai/commercial/permissions.ts`
3. `src/lib/taai/commercial/agent-registry.ts`
4. `architecture/commercial-agent-architecture.md`
5. `architecture/commercial-data-model.md`
6. `governance/commercial-agent-approval-policy.md`

Binding additions already incorporated into the prepared code:
- `validateApprovedCommercialAction` rejects the generic literal scope `modify_internal_record` when `actionClass === 'modify_internal_record'`, in both `context.requestedScope` and `record.approvedScope` → `scope_mismatch`. Only complete domain-scoped values (`finance_operations:reconciliation_record:update`, `crm:fundraising_opportunity:update`, `campaign:status:update`) authorize. No prefix, substring, fuzzy, semantic, normalized, wildcard, or model-based matching; literal case-sensitive equality only, no trimming.
- Import direction: `types.ts` imports nothing; `agent-registry.ts` imports only types; `permissions.ts` may import `COMMERCIAL_AGENT_REGISTRY`. No cycle, no runtime imports added anywhere else.
- Three-list partition (`allowedWithoutApproval` / `requestableWithApproval` / `alwaysProhibited`) covering all 12 action classes exactly once for all eight registry keys.
- ISO 8601 validation requiring explicit `Z` or numeric offset **and** a finite parsed value.
- `CONSEQUENTIAL_ACTION_MAP` as classification only; `MODIFY_INTERNAL_RECORD_DOMAIN_SCOPES` as documented domain scopes.
- Deferred-status block added to all three Markdown files.

Verification to run and report: `node --version`, `npm --version`, targeted `npx eslint` on the three TS files, `npx tsc --noEmit`, `npm run build`, `git diff --check`, `git status --short`, `git diff --name-only`, the eight-key permission-partition results, and the static checks (no new explicit `any`, no out-of-scope files, no runtime imports, no migrations/packages/env/generated types, no Gate 7/8/R1-A/R1-B, Stripe, checkout, payment, refund, or provider-confirmation changes, no deploy or publish).
