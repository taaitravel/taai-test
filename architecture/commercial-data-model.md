# Gate 9A1-A Commercial Data Model

## Status

This document defines contracts only. It does not create or apply Supabase migrations.

## Deferred status

```text
Gate 9A is accepted as deferred internal governance.
It is not part of the active Gate R1 revenue implementation path.
No runtime integration, migration, agent execution, investor CRM, outreach,
dashboard, deployment, or production use is authorized.
```

## Data system responsibilities

- taai_Atlas: source-of-truth operational records for investors, CRM, commercial agent tasks, approvals, evidence, artifacts, and commercial planning entities.
- taai_IQ: derived metrics, executive dashboards, investor summaries, data-quality rollups, and weekly reports.
- taai_Nucleus: permissions, approval policy, metric definitions, evidence rules, data-quality standards, and release restrictions.

## Evidence source contract

Every investor fact, investor score, briefing, financial metric, and traction claim must include:

- source
- source type
- captured date
- verification date (optional; unverified evidence must not be presented as verified)
- confidence
- data-quality status
- known exclusions
- responsible agent or person

Confidence is a finite value between 0 and 1 inclusive.

## Money contract

Monetary contract fields use `MoneyAmount { amount, currency }` with an ISO 4217 currency code. Fund check-size minimum, check-size maximum, and fund size are currency-aware and optional. No implicit FX conversion is performed anywhere in these contracts.

## Data-quality states

- verified: source is current, mapped, and checked against the required definition.
- partial: source exists but lacks one or more required fields or validations.
- stale: source exists but is outside the accepted freshness window.
- missing: required source data is unavailable.
- conflicting: two or more sources disagree and reconciliation is unresolved.
- manual: source is manually supplied and not independently reconciled.
- mock_excluded: mock, demo, seed, or synthetic data excluded from investor-grade reporting.

The current `BusinessMetricsDashboard` mock metrics are explicitly classified as `mock_excluded` and must not be used as investor-grade metrics.

## Investor entity contracts

### investor_orgs

Represents an investor organization, fund manager, angel group, family office, strategic investor, accelerator, or similar entity.

Core fields:

- id
- name
- organization type
- website
- headquarters/location
- geography focus
- sector focus
- source coverage status
- PII classification notes
- created/updated timestamps

### investor_contacts

Represents a person associated with an investor organization.

Core fields:

- id
- investor organization id
- name
- title
- email or redacted email reference
- LinkedIn or public profile reference
- contact source
- PII classification
- consent/contact basis, if applicable
- relationship status
- created/updated timestamps

### funds

Represents a fund or check-writing vehicle.

Core fields:

- id
- investor organization id
- fund name
- fund stage focus
- check-size minimum and maximum, each as a currency-aware MoneyAmount
- lead/follow preference
- geography focus
- sector focus
- fund size, if verified, as a currency-aware MoneyAmount
- source and verification metadata

## Approval record contract

| Field | Required | Notes |
|---|---|---|
| approvalId | Yes | Returned on a successful authorization |
| taskId | Yes | Must match the evaluated task exactly |
| requester | Yes | Recorded for audit |
| approver | Yes | marco or authorized_delegate |
| actionClass | Yes | Must match the evaluated action class exactly |
| targetEntityType | Yes | Must match the evaluated target type exactly |
| targetEntityId | Yes | Must match the evaluated target id exactly |
| approvedScope | Yes | Non-empty literal domain-scoped values, no wildcards |
| status | Yes | requested, approved, denied, expired, revoked |
| approvedAt | Yes when approved | ISO 8601 with Z or numeric offset |
| expiresAt | No | When present, valid and later than approvedAt |
| revokedAt / revokedReason | No | When revokedAt is present the record is revoked |
| consumedAt | No | Invalidates only one-time-use approvals |
| oneTimeUse | Yes | One-time approvals cannot be reused |
| requiredCompletionEvidence | Yes | Durable evidence required at completion |

Requirement status (`not_required`, `required`) is separate from record status. An absent `expiresAt` grants no broader authority.

### Domain scope format for modify_internal_record

`domain:entity:operation`, for example:

- `finance_operations:reconciliation_record:update`
- `crm:fundraising_opportunity:update`
- `campaign:status:update`

The generic literal `modify_internal_record` is rejected in both requested and approved scope. A domain prefix is never broad authorization. Comparison is literal and case-sensitive with no trimming, normalization, prefix, substring, semantic, wildcard, or model-based matching.

### Authorization outcome reasons

Machine-readable reasons: `allowed`, `unverified_approval_source`, `agent_action_prohibited`, `agent_cannot_request_action`, `no_matching_approval`, `task_mismatch`, `target_mismatch`, `approval_revoked`, `approval_expired`, `approval_consumed`, `approval_timestamp_missing`, `approval_timestamp_invalid`, `approval_not_approved`, `scope_mismatch`.

Failure precedence when no record passes: `approval_revoked`, `approval_expired`, `approval_consumed`, `approval_timestamp_missing`, `approval_timestamp_invalid`, `approval_not_approved`, `scope_mismatch`.

### fund_portfolio_companies

Represents portfolio companies used for thesis and relevance analysis.

Core fields:

- id
- fund id or investor organization id
- company name
- sector
- stage at investment
- investment date, if known
- relevance to taai
- source and verification metadata

### investor_theses

Represents stated or inferred investment thesis records.

Core fields:

- id
- investor organization id or fund id
- thesis text
- sector tags
- stage tags
- geography tags
- evidence source
- confidence
- data-quality status

### relationship_paths

Represents possible warm paths or relationship context.

Core fields:

- id
- investor contact id or investor organization id
- relationship path type
- path description
- intermediary, if approved to store
- evidence source
- confidence
- owner
- approval requirements

### investor_scores

Represents explainable investor scoring output.

Core fields:

- id
- investor organization id
- fund id, optional
- score total
- thesis score
- stage score
- check-size score
- portfolio fit score
- warm-path score
- strategic value score
- risk score
- explanation
- source coverage
- scorer/responsible agent
- data-quality status
- scored timestamp

### fundraising_rounds

Represents an internal fundraising round or scenario.

Core fields:

- id
- round name
- target amount
- instrument type, if approved
- target close window
- status
- owner
- approval status

### fundraising_opportunities

Represents a pipeline opportunity with an investor.

Core fields:

- id
- round id
- investor organization id
- primary contact id, optional
- pipeline stage
- priority
- owner
- next action
- next action due date
- approval status
- source and evidence metadata

### fundraising_interactions

Represents notes, meeting records, calls, drafts, or touchpoints.

Core fields:

- id
- fundraising opportunity id
- interaction type
- occurred or drafted timestamp
- summary
- responsible person or agent
- external communication flag
- approval id, if external
- evidence source

### fundraising_tasks

Represents internal follow-ups and workflow tasks.

Core fields:

- id
- fundraising opportunity id
- task type
- owner
- due date
- status
- approval requirement
- completion evidence

### outreach_drafts

Represents non-sent outbound copy.

Core fields:

- id
- fundraising opportunity id
- artifact type
- subject/title
- draft body
- personalization inputs
- approval status
- created by
- created timestamp

### data_room_assets

Represents internal data-room asset metadata. It does not grant access by itself.

Core fields:

- id
- asset name
- asset type
- storage reference
- sensitivity classification
- approval required for sharing
- last verified timestamp
- owner

## Financial KPI contract

Every KPI must define:

- name
- formula
- source tables
- source fields
- period
- refresh cadence
- owner
- data-quality state
- known exclusions
- last verified timestamp

Required KPI categories:

- MRR
- ARR
- GMV
- gross revenue
- net taai revenue
- service fees
- affiliate commissions
- Stripe/payment processing fees
- expenses
- burn
- runway
- forecasts
- fundraising scenarios
- use of funds
- valuation assumptions

GMV and taai revenue must remain separate. Payment evidence alone is not provider confirmation, and provider confirmation is not inferred from checkout or payment state.

## Campaign and lead model

Core entities:

- icp_segments
- personas
- campaigns
- campaign_experiments
- content_assets
- landing_page_briefs
- channel_plans
- acquisition_sources
- waitlist_entries
- leads
- lead_scores
- campaign_metrics
- traction_narratives

No campaign may be launched or modified without deterministic approval.

## Atlas relationship summary

```text
investor_orgs → investor_contacts
investor_orgs → funds
funds → fund_portfolio_companies
investor_orgs/funds → investor_theses
investor_contacts/investor_orgs → relationship_paths
investor_orgs/funds → investor_scores
fundraising_rounds → fundraising_opportunities
fundraising_opportunities → fundraising_interactions
fundraising_opportunities → fundraising_tasks
fundraising_opportunities → outreach_drafts
data_room_assets → approval requests before external access
commercial_agent_tasks → commercial_agent_runs → commercial_agent_artifacts
commercial_agent_tasks → commercial_evidence_sources
commercial_agent_tasks → commercial_approval_requests
```
