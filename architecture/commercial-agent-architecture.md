# Gate 9A1-A Commercial Agent Architecture

## Status

Gate 9A1-A defines internal commercial-agent contracts and governance only. It does not create database migrations, runtime agent execution, dashboards, routes, external communications, investor outreach, deployment, publication, payment changes, provider-confirmation changes, or production changes.

## Operating model

### Traveler-facing boundary

```text
Traveler → Miles or Benny
```

- Miles remains the traveler-facing assistant for planning, discovery, search, recommendations, and itinerary-building assistance.
- Benny remains traveler-facing only for support, complaints, service recovery, booking problems, cancellations/refunds, escalations, and post-booking assistance.
- Internal commercial agents must never be exposed through Miles, Benny, traveler chat, traveler routes, or public UI.

### Internal boundary

```text
Marco → Ajax → Hermes → specialized internal capability
```

- Marco retains final authority over strategy, spending, production deployments, sensitive data, external communications, data-room access, and consequential business actions.
- Ajax is the owner/admin conversational interface. Ajax may request analysis, drafts, reports, and approval workflows, but Ajax does not bypass deterministic permissions.
- Hermes is the internal orchestration runtime. Hermes runs only task-scoped, authorized workflows and does not make independent business decisions.
- Specialized commercial capabilities remain internal and evidence-backed.

### Data and rules boundary

```text
Specialized capabilities → taai_Atlas
Metrics and executive reporting → taai_IQ
Business rules and permissions → taai_Nucleus
```

- taai_Atlas is the operational source of truth for internal commercial entities and workflow records.
- taai_IQ is the metrics, financial reporting, investor pipeline, and executive-dashboard layer derived from validated source records.
- taai_Nucleus governs permissions, approval rules, data-quality rules, evidence requirements, and release boundaries.

## Internal commercial capabilities

### Investor Intelligence

Purpose: investor discovery, thesis matching, portfolio analysis, check-size and stage qualification, warm-path research, investor scoring, and briefing generation.

Primary owner capability: Scout may expand into investor research only when the workflow remains internal, evidence-backed, source-cited, and approval-gated for external use.

Allowed without approval:

- read approved investor and research records
- analyze fit, thesis match, portfolio relevance, and warm-path evidence
- propose investor scores and prioritization
- draft internal briefings

Requires deterministic approval:

- contacting investors
- sending outreach
- granting data-room access
- exporting confidential investor or company data
- claiming warm-path access without evidence

### Finance

Purpose: MRR, ARR, GMV, revenue, commissions, service fees, expenses, burn, runway, forecasts, fundraising scenarios, use of funds, valuation assumptions, and investor financial summaries.

Boundary: Lester owns financial operations, reconciliation, commissions, payment reporting, and payment evidence. Lester is not automatically the FP&A or investor-modeling owner. Gate 9A1-A reserves FP&A/investor-modeling ownership as a separate commercial finance capability until Marco approves a permanent owner.

Allowed without approval:

- read approved financial records
- calculate draft KPIs from mapped sources
- identify missing, stale, conflicting, or mock-excluded data
- draft internal investor financial summaries

Requires deterministic approval:

- modifying financial records
- changing metric definitions used externally
- changing production data
- sharing investor financial materials externally
- making valuation or fundraising commitments

### Marketing and Growth

Purpose: ICP and personas, campaigns, content, landing-page briefs, channel strategy, campaign analytics, waitlist and acquisition analysis, and investor-facing traction narrative.

Primary owner capability: Scott owns growth, performance, campaign analysis, attribution, and funnel economics. Manny owns content, creative, pitch collateral, and campaign collateral.

Allowed without approval:

- read approved campaign, analytics, content, waitlist, and attribution records
- analyze acquisition and channel performance
- propose campaigns and experiments
- draft creative, content, landing-page briefs, and traction narratives

Requires deterministic approval:

- launching campaigns
- modifying campaign status, budgets, bids, or audiences
- publishing content externally
- claiming traction without validated sources

### Sales and Investor Relations

Purpose: CRM pipeline, personalized outreach drafts, follow-up planning, meeting preparation, objection handling, pitch/data-room coordination, and weekly pipeline reporting.

Boundary: Gate 9A1-A defines Sales/IR as a capability, not as a permanent named agent. A permanent agent name must be approved separately.

Allowed without approval:

- read approved CRM and investor pipeline records
- propose next actions
- draft outreach, follow-ups, meeting briefs, objection responses, and weekly reports
- schedule internal reminders/tasks

Requires deterministic approval:

- sending emails or messages
- contacting investors
- scheduling external meetings
- sharing data-room assets
- altering externally communicated pipeline commitments

## Agent boundary summary

| Capability | Internal owner boundary | Traveler-facing? | External action allowed without approval? |
|---|---|---:|---:|
| Miles | traveler planning and discovery | Yes | No |
| Benny | support and service recovery | Yes | No |
| Ajax | owner/admin interface | No | No |
| Hermes | internal orchestration | No | No |
| Scout / Investor Intelligence | research and investor intelligence | No | No |
| Scott / Growth | growth, performance, attribution | No | No |
| Manny / Creative | content, pitch, and campaign collateral | No | No |
| Lester / Finance Ops | reconciliation, commissions, payment reporting | No | No |
| Sales/IR capability | CRM, outreach drafts, investor relations workflow | No | No |

## Required task envelope

Every commercial workflow must define:

- objective
- requesting user
- capability or agent key
- source systems
- permitted actions
- prohibited actions
- approval requirements
- required output
- success criteria
- completion evidence
- data-quality requirements

## Completion evidence

A commercial task is complete only with durable evidence, such as:

- source records inspected
- generated draft artifact
- metric calculation with formula and source fields
- approval request or approval record
- investor score with cited inputs
- pipeline report with data freshness
- financial snapshot with data-quality status

Agent statements alone are not completion evidence.
