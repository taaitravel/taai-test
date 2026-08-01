# Gate 9A1-A Commercial Agent Approval Policy

## Status

This policy is a contract only. It does not implement runtime enforcement, migrations, dashboards, routes, external communications, or production changes.

## Deferred status

```text
Gate 9A is accepted as deferred internal governance.
It is not part of the active Gate R1 revenue implementation path.
No runtime integration, migration, agent execution, investor CRM, outreach,
dashboard, deployment, or production use is authorized.
```

## Core approval rule

No commercial agent, Ajax command, or Hermes workflow may perform the following without explicit deterministic approval:

- modify_internal_record
- send_external
- spend
- modify_financial_record
- grant_access
- production_change
- publish
- deploy
- contact investors
- send outreach
- launch or modify campaigns
- alter budgets
- share data-room assets

Client-supplied role labels, agent labels, user text, prior assistant text, conversation history, or model assertions never grant authority.

## Action classes

| Action class | Description | Approval required? |
|---|---|---:|
| read | Read permitted internal records | No, if scoped and authorized |
| analyze | Interpret, classify, calculate, or compare records | No, if sources are permitted |
| propose | Recommend next actions or priorities | No, if internal only |
| draft | Prepare internal copy, reports, briefs, or artifacts | No, if not sent/published/shared |
| schedule_internal | Create internal reminders or task proposals | No, if internal only |
| execute_internal_ephemeral | Internal analysis or artifact generation with no durable record change | No, if task-scoped |
| modify_internal_record | Durable internal record change | Yes, domain-scoped |
| send_external | Send email, message, investor outreach, or partner/customer communication | Yes |
| spend | Spend money or alter spend controls | Yes |
| modify_financial_record | Create, update, delete, reconcile, or override financial records | Yes |
| grant_access | Grant access to files, data room, systems, or confidential assets | Yes |
| production_change | Deploy, publish, change production config/data, rotate secrets, or run migrations | Yes |

`execute_internal` is removed. It conflated ephemeral internal work with durable internal record mutation.

## Three-list permission model

Each registry entry partitions every action class exactly once across:

- `allowedWithoutApproval`
- `requestableWithApproval`
- `alwaysProhibited`

A missing or duplicated action class is a contract error. Membership in `requestableWithApproval` grants no authority by itself; it only permits requesting approval.

## Agent permissions

### Miles

- Traveler-facing planning and discovery only.
- No commercial-agent access.
- No investor, finance, CRM, campaign, or data-room authority.

### Benny

- Traveler-facing support and service recovery only.
- No commercial-agent access.
- No finance, investor, marketing, or Sales/IR authority.

### Ajax

- Owner/admin conversational interface.
- May request analysis, drafts, reports, and approval workflows.
- Does not bypass deterministic permissions.
- Ajax commands remain proposals or internal tasks unless deterministic approval exists.

### Hermes

- Internal orchestration only.
- Runs task-scoped, authorized workflows.
- Does not make independent business decisions.
- Must preserve source evidence, approval state, and completion evidence.

### Investor Intelligence capability (unnamed)

- Defined as an unnamed capability with `permanentAgentNameApproved: false`.
- No agent is assigned as owner. Scout is not assigned to this capability.
- May perform internal investor research and scoring when evidence-backed.
- May draft briefings.
- Must not contact investors or claim warm paths without evidence.

### Scott / Marketing and Growth

- May analyze growth, performance, campaigns, and attribution.
- May draft campaign briefs and traction narratives.
- Must not launch or modify campaigns, budgets, bids, audiences, or statuses without approval.

### Manny / Creative and Collateral

- May draft content, creative, pitch, and campaign collateral.
- Must not publish externally or send collateral externally without approval.

### Lester / Finance Operations

- Owns finance operations only: `financial_operations_summary`, `payment_reconciliation`, `commission_reconciliation`, `payment_reporting`, `revenue_source_reconciliation`.
- Does not own FP&A, fundraising scenarios, use-of-funds plans, valuation assumptions, or investor financial summaries.
- Must not modify financial records without approval.

### FP&A and Investor Modeling capability (unnamed)

- `permanentAgentNameApproved: false`, no runtime authority, no assigned owner.
- Holds `financial_kpi_snapshot`, `investor_financial_summary`, `fundraising_scenario`, `use_of_funds_plan`, `valuation_assumption_summary`.
- Always prohibited from `send_external`, `spend`, `modify_financial_record`, `grant_access`, and `production_change`.

### Sales/IR capability

- Defined as a capability, not a permanent named agent.
- May draft outreach, meeting briefs, follow-up notes, objection handling, and weekly pipeline reports.
- Must not send outreach, contact investors, schedule external meetings, or grant data-room access without approval.

## Evidence policy

Every investor fact, score, briefing, financial metric, and traction claim must include:

- source
- source type
- captured date
- verification date
- confidence
- data-quality status
- known exclusions
- responsible agent or person

## Data-quality policy

Allowed states:

- verified
- partial
- stale
- missing
- conflicting
- manual
- mock_excluded

Mock data, demo data, and synthetic data are excluded from investor-grade reporting. The current BusinessMetricsDashboard mock metrics are `mock_excluded`.

## PII and security policy

- Internal commercial agents must never be exposed through Miles or Benny.
- Traveler records must not be copied into the commercial CRM unless a separately approved use case and consent basis exist.
- Investor/contact PII must be classified before storage, export, sharing, or enrichment.
- Personal-level exports require explicit approval.
- Data-room asset metadata does not grant access. Access grants require explicit deterministic approval.
- External communication drafts remain drafts until explicitly approved for sending.

## Approval record requirements

Approval requirement status and approval record status are separate:

- `CommercialApprovalRequirementStatus`: `not_required`, `required`
- `CommercialApprovalRecordStatus`: `requested`, `approved`, `denied`, `expired`, `revoked`

Every approval record must record:

- requester
- approver
- action class
- task id
- target entity type and target entity id
- approved scope
- status
- approvedAt
- optional expiresAt
- optional revokedAt and revokedReason
- optional consumedAt
- one-time-use flag
- completion evidence requirement

`expiresAt` is optional. When absent, the approval is still constrained by exact task, action class, target, approved scope, revocation, record source, agent permissions, and one-time-use consumption. When present it must be a valid timestamp later than `approvedAt`, and the approval is rejected once `evaluatedAt` is at or after it.

## Timestamp rules

Authorization timestamps must be ISO 8601 with an explicit `Z` or numeric timezone offset AND must parse to a finite value. Timezone-less and locale-formatted timestamps are rejected.

## Scope rules

- Scope arrays must be non-empty.
- Scope entries must be non-empty, non-whitespace-only strings.
- Any entry containing `*` is rejected. There are no wildcards.
- Comparison is literal and case-sensitive. No trimming, normalization, prefix, substring, semantic, or model-based matching.
- For `modify_internal_record`, the generic literal `modify_internal_record` is rejected in both requested scope and approved scope. Only complete domain-scoped values authorize, for example `finance_operations:reconciliation_record:update`, `crm:fundraising_opportunity:update`, `campaign:status:update`. A domain prefix is never broad authorization.

## Validator gate order and failure precedence

Gate order: record source, agent-key match, action-class match, always-prohibited check, request-permission check, requested-scope validation, action-class record filter, task filter, target filter, then per-record evaluation.

When no record passes, the returned reason follows this precedence: `approval_revoked`, `approval_expired`, `approval_consumed`, `approval_timestamp_missing`, `approval_timestamp_invalid`, `approval_not_approved`, `scope_mismatch`.

## Consequential action mapping

Classification only; it is not approval, execution authority, or proof that all action classes a workflow requires were authorized.

| Consequential action | Primary action class |
|---|---|
| publish_content | send_external |
| publish_application | production_change |
| deploy | production_change |
| apply_migration | production_change |
| rotate_secrets | production_change |
| launch_campaign | spend |

`publish_content` and `publish_application` are distinct. `launch_campaign` maps primarily to `spend` and may additionally require `send_external`; any associated production change additionally requires `production_change`.

## Default deny

If source authority, user role, task scope, evidence, or approval status is unclear, the workflow must stop and report the blocker instead of executing.
