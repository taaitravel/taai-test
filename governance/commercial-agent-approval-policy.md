# Gate 9A1-A Commercial Agent Approval Policy

## Status

This policy is a contract only. It does not implement runtime enforcement, migrations, dashboards, routes, external communications, or production changes.

## Core approval rule

No commercial agent, Ajax command, or Hermes workflow may perform the following without explicit deterministic approval:

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
| execute_internal | Perform approved internal non-external workflow steps | Yes when consequential |
| send_external | Send email, message, investor outreach, or partner/customer communication | Yes |
| spend | Spend money or alter spend controls | Yes |
| modify_financial_record | Create, update, delete, reconcile, or override financial records | Yes |
| grant_access | Grant access to files, data room, systems, or confidential assets | Yes |
| production_change | Deploy, publish, change production config/data, rotate secrets, or run migrations | Yes |

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

### Scout / Investor Intelligence

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

- Owns financial operations, reconciliation, commissions, and payment reporting boundaries.
- May produce payment/reporting summaries from approved records.
- Must not be treated automatically as FP&A/investor-modeling owner without a separately approved boundary.
- Must not modify financial records without approval.

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

Every approval should record:

- requester
- approver
- action class
- artifact or task id
- source evidence
- approved scope
- expiration or one-time-use boundary
- timestamp
- completion evidence requirement

## Default deny

If source authority, user role, task scope, evidence, or approval status is unclear, the workflow must stop and report the blocker instead of executing.
