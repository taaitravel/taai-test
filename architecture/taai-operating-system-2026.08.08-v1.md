# TAAI Operating System — Directional Source of Truth

- Version: `2026.08.08-v1`
- Effective date: 2026-08-08
- Authority: Directional architecture approved by TAAI leadership
- Status: Active

This document is the versioned directional source of truth for TAAI. Product details may mature, but system ownership and direction must remain aligned with this model unless a later reviewed version replaces it.

## Core direction

`Traveler → Experience → AI → Orchestration → Business Logic → Data → Intelligence → Executive Command`

The traveler creates the workflow. Miles and Bob assist the traveler. Hermes routes the work. Ajax and specialist agents execute internal operations. taai_Nucleus decides business rules. taai.ID protects identity. taai_Atlas remembers relationships. taai.Minerva records events. taai.Athena explains performance. taai_IQ turns that information into company strategy.

## Status legend

- `current`: implemented and actively used.
- `partial`: meaningful implementation exists, but the named boundary is incomplete or distributed.
- `planned`: approved target with contracts or implementation work still required.
- `conceptual`: directional boundary retained for future design; no dependable product implementation yet.

## Layer and component status

| Direction | Layer | Component | Status | Ownership |
|---:|---|---|---|---|
| 1 | Traveler Identity | Supabase Auth | current | Sessions, roles, protected routes, admin permissions |
| 1 | Traveler Identity | taai.ID | partial | Accounts, profiles, preferences, consent, documents, future Travel DNA |
| 2 | Traveler Experience | Web / mobile web app | current | Traveler product surfaces |
| 2 | Traveler Experience | Global app chrome | current | Navigation and context surfaces |
| 2 | Traveler Experience | Miles | partial | General traveler companion and concierge |
| 2 | Traveler Experience | Bob | partial | Create Itinerary planning only |
| 3 | Booking & Commerce | taai_Nucleus | partial | Booking, pricing, fee, commission, provider, cancellation, checkout, and payment rules |
| 3 | Booking & Commerce | Cart / Checkout | current | Quote and traveler checkout workflow |
| 3 | Booking & Commerce | External providers | partial | Inventory, quotes, genuine confirmation evidence |
| 4 | AI Orchestration | Hermes | partial | Task routing, workflow state, evidence, approvals; autonomous runtime still planned |
| 4 | AI Orchestration | Ajax | planned | Internal commercial and operational workflows |
| 4 | AI Orchestration | Tom | partial | First internal specialist lane: engineering and technical QA |
| 4 | AI Orchestration | Scott, Manny, Benny, Piper, Lester, Scout | planned | Approved specialist responsibilities; execution lanes not yet active |
| 5 | Knowledge & Data | Supabase Database | current | Operational application data and RLS |
| 5 | Knowledge & Data | Document knowledge | partial | Manuals, specs, legal, brand, SOPs, and instructions |
| 5 | Knowledge & Data | taai_Atlas | planned | Relationship and knowledge graph |
| 6 | Events & Observability | Existing analytics events | partial | Fragmented product and commerce telemetry |
| 6 | Events & Observability | taai.Minerva | planned | Canonical event and observability backbone |
| 7 | Intelligence & Reporting | Existing dashboards | partial | Business reporting surfaces |
| 7 | Intelligence & Reporting | taai.Athena | planned | BI, forecasting, cohorts, performance, and strategic insights |
| 8 | Executive Operating | Internal TOS | current | Responsibility, approval, event, risk, and architecture rules |
| 8 | Executive Operating | taai_IQ | partial | Command surface and layered navigation; full executive console planned |
| 9 | Finance | Stripe | current | Payment and subscription platform |
| 9 | Finance | taai_Ledger | partial | Financial records exist; unified financial-truth boundary remains incomplete |
| 9 | Finance | Accounting operations | planned | Reconciliation, tax, CPA exports, and recognition |
| 10 | Security & Control | Supabase RLS | current | Database access and traveler isolation |
| 10 | Security & Control | Approval gates | partial | Policy current; durable task-level records introduced in this foundation |
| 10 | Security & Control | taai_Vault | conceptual | Unified secrets, credentials, policies, and rotation evidence |
| 11 | Platform & Tooling | Lovable, GitHub, local runtime, Supabase, Stripe | current | Product delivery stack |
| 11 | Platform & Tooling | Workspace, CRM, automation, design tools | partial | Integration coverage varies |
| 11 | Platform & Tooling | Native mobile | planned | Capacitor, app stores, native permissions, push |
| 12 | Growth & Commercial | Marketing, partnerships, investor/company operations | partial | Commercial and company growth workflows |

## Agent ownership and visibility

| Agent | Visibility | Approved role |
|---|---|---|
| Miles | Traveler-facing | General companion, concierge, trip context, and support guidance |
| Bob | Traveler-facing only in Create Itinerary | Destination/date/budget interpretation and itinerary-building conversation |
| Hermes | Internal-only | Workflow routing, task state, evidence, retries, and approval requests |
| Ajax | Internal-only | Commercial operations, sales/planning automation, revenue opportunities, and follow-up |
| Tom | Internal-only | Engineering triage, bug review, product fixes, code planning, and technical QA |
| Scott | Internal-only | Growth, performance, funnels, campaigns, and acquisition experiments |
| Manny | Internal-only | Content, creative, brand assets, social, and editorial consistency |
| Benny | Internal-only | Traveler care, escalation, recovery, resolution, and satisfaction |
| Piper | Internal-only | Booking operations, provider coordination, confirmations, and booking quality |
| Lester | Internal-only | Payments, refunds, reconciliation, ledger checks, commissions, and margin |
| Scout | Internal-only | Destination, supplier, market, competitor, and opportunity research |

## System ownership

- Miles owns general traveler concierge interaction.
- Bob owns the Create Itinerary planning conversation.
- The UI displays state but does not decide business truth.
- Hermes routes work and preserves the task/evidence chain.
- Ajax and specialists perform only scoped internal work.
- taai_Nucleus owns booking, payment, pricing, provider, and cancellation rules.
- taai_Ledger owns financial truth.
- taai.ID owns traveler identity.
- taai_Vault owns secrets and security controls.
- taai_Atlas owns relationships and durable knowledge.
- taai.Minerva owns events and telemetry.
- taai.Athena owns BI, reporting, and forecasting.
- taai_IQ owns executive command and strategic decisions.

## Non-negotiable control rule

Every state-changing action must pass through the Security / Control approval layer. Conversation text, model output, client flags, agent identity, or task status do not constitute approval. Approval must be durable, actor-attributed, scoped to the requested action, and recorded before execution.

This includes code changes, database mutations, migrations, deployments, external messages, payments, refunds, provider actions, booking changes, production configuration, credential changes, and destructive operations.

## Change process

1. Propose a new version with an explicit architectural diff.
2. Review ownership, visibility, data, security, and migration impacts.
3. Obtain human approval.
4. Update this document and `src/lib/taai/operating-system.ts` in the same change.
5. Record implementation evidence and regressions in the Hermes task record.
