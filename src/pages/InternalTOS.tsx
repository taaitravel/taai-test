import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type Agent = {
  name: string;
  role: string;
  owns: string;
  can: string[];
  cannot: string[];
  approval: string[];
  tone?: "core" | "orchestration" | "memory" | "insight" | "specialist";
};

const AGENTS: Agent[] = [
  {
    name: "taai_IQ",
    role: "Executive intelligence layer",
    owns: "Executive visibility, north-star KPIs, roadmap gating",
    can: ["Read every downstream signal", "Publish executive briefings", "Set operating priorities"],
    cannot: ["Touch traveler data directly", "Execute provider or payment actions", "Bypass gate approvals"],
    approval: ["Roadmap changes with commercial impact", "Cross-agent priority reshuffles"],
    tone: "core",
  },
  {
    name: "Hermes",
    role: "Orchestration & routing",
    owns: "Agent-to-agent routing, task queues, capability discovery",
    can: ["Propose actions", "Dispatch tasks to specialists", "Assemble multi-agent workflows"],
    cannot: ["Confirm payments", "Confirm provider reservations", "Trigger refunds", "Edit confirmed bookings"],
    approval: ["Any state-changing action → system/admin gate before execution"],
    tone: "orchestration",
  },
  {
    name: "taai_Nucleus",
    role: "Decision & policy core",
    owns: "Policy evaluation, rule engine, decision logs",
    can: ["Approve/deny proposed actions", "Emit decision records", "Enforce gate policies"],
    cannot: ["Author new policies without human sign-off", "Silently override gates"],
    approval: ["Policy diffs", "New gate definitions"],
    tone: "core",
  },
  {
    name: "taai_Atlas",
    role: "Long-term memory & knowledge graph",
    owns: "Entities, embeddings, relationships, retention",
    can: ["Persist facts", "Retrieve context for agents", "Version snapshots"],
    cannot: ["Delete audit-scoped records", "Expose PII outside policy scope"],
    approval: ["Retention changes", "Schema evolution"],
    tone: "memory",
  },
  {
    name: "taai.ID",
    role: "Identity & access",
    owns: "Actor identity, roles, session provenance",
    can: ["Resolve who is acting", "Attach identity claims to events"],
    cannot: ["Rotate credentials autonomously", "Grant elevated roles"],
    approval: ["Role changes", "Credential rotation", "Admin elevation"],
    tone: "core",
  },
  {
    name: "taai.Minerva",
    role: "Event bus & signal fabric",
    owns: "Event schemas, topic routing, replay",
    can: ["Publish/subscribe events", "Guarantee ordering per topic", "Replay for recovery"],
    cannot: ["Mutate business state", "Drop audit events"],
    approval: ["New event schemas", "Topic ACL changes"],
    tone: "orchestration",
  },
  {
    name: "taai.Athena",
    role: "Analytics & reporting",
    owns: "Metrics, cohorts, dashboards, exports",
    can: ["Aggregate events", "Publish reports", "Alert on thresholds"],
    cannot: ["Take operational action", "Expose row-level PII in shared reports"],
    approval: ["New external-facing reports"],
    tone: "insight",
  },
  {
    name: "Miles",
    role: "Traveler-facing copilot",
    owns: "Discovery guidance, itinerary drafting, in-app help",
    can: ["Suggest destinations, items, edits", "Draft cart contents", "Explain choices"],
    cannot: ["Confirm payments", "Confirm provider reservations", "Send external notifications", "Edit confirmed bookings"],
    approval: ["Any cart→checkout escalation", "Any notification to traveler"],
    tone: "specialist",
  },
  {
    name: "Ajax",
    role: "Ops & recovery agent",
    owns: "Retry queues, incident triage, provider fallbacks",
    can: ["Retry idempotent tasks", "Open incidents", "Route to human ops"],
    cannot: ["Issue refunds", "Cancel provider bookings", "Alter ledger records"],
    approval: ["Refunds", "Cancellations", "Manual state overrides"],
    tone: "specialist",
  },
  {
    name: "Tom",
    role: "Hotels specialist",
    owns: "Property search, room selection, rate quality",
    can: ["Rank properties", "Draft room selections", "Explain rate rules"],
    cannot: ["Confirm bookings", "Bypass reprice/quote expiry"],
    approval: ["Any transition past checkout_started"],
    tone: "specialist",
  },
  {
    name: "Scott",
    role: "Flights specialist",
    owns: "Fare shopping, itinerary construction, fare rules",
    can: ["Assemble candidate itineraries", "Explain fare rules and risks"],
    cannot: ["Ticket a flight", "Confirm fare with provider"],
    approval: ["Any ticketing step"],
    tone: "specialist",
  },
  {
    name: "Manny",
    role: "Activities & experiences specialist",
    owns: "Curation, availability windows, per-pax pricing",
    can: ["Recommend activities", "Draft per-pax allocations"],
    cannot: ["Confirm supplier reservations"],
    approval: ["Provider confirmation step"],
    tone: "specialist",
  },
  {
    name: "Benny",
    role: "Dining specialist",
    owns: "Venue discovery, cuisine matching, reservation intent",
    can: ["Recommend venues", "Draft reservation intents"],
    cannot: ["Book a table with a provider"],
    approval: ["Provider handoff"],
    tone: "specialist",
  },
  {
    name: "Piper",
    role: "Packages & bundles specialist",
    owns: "Bundle assembly, cross-item constraints",
    can: ["Compose packages", "Flag conflicts across items"],
    cannot: ["Confirm bundle bookings"],
    approval: ["Package price locks"],
    tone: "specialist",
  },
  {
    name: "Lester",
    role: "Ground transport specialist",
    owns: "Cars, transfers, rail",
    can: ["Recommend and draft ground segments"],
    cannot: ["Confirm with providers"],
    approval: ["Provider handoff"],
    tone: "specialist",
  },
  {
    name: "Scout",
    role: "Research & discovery agent",
    owns: "Destination intel, seasonality, live signals",
    can: ["Fetch and summarize public signals", "Enrich itineraries with context"],
    cannot: ["Write to ledger, bookings, or user identity"],
    approval: ["New external data sources"],
    tone: "specialist",
  },
];

const GATES: { title: string; owner: string; requires: string; notes: string }[] = [
  { title: "Payment actions", owner: "taai_Nucleus + human ops", requires: "Signed user intent + Stripe session", notes: "Hermes and Miles propose; execution is gated by system." },
  { title: "Provider confirmation", owner: "Ops + provider API", requires: "Verified provider response", notes: "No agent may claim confirmed status without a provider-returned record." },
  { title: "Traveler notifications", owner: "taai_Nucleus policy", requires: "Approved template + rate limit", notes: "Miles/Ajax draft; system dispatches." },
  { title: "Credential / security changes", owner: "taai.ID + admin", requires: "Human approval", notes: "Rotation cadence still open — see Risks." },
  { title: "Production deploys", owner: "Release manager", requires: "Green checks + change ticket", notes: "Production remains no-go until Gate 7 merges." },
  { title: "Migrations", owner: "Data owner + admin", requires: "Reviewed migration + rollback plan", notes: "No agent authors migrations autonomously." },
  { title: "Refunds / cancellations", owner: "Ajax + human ops", requires: "Ledger match + provider ack", notes: "System-of-record write only after both." },
  { title: "AI-generated recommendations", owner: "Hermes", requires: "Source attribution + policy check", notes: "Ranked, explainable, always overridable." },
];

const FLOW = [
  "user action",
  "Miles / Ajax / specialist",
  "Hermes orchestration",
  "taai_Nucleus decision",
  "taai_Atlas memory",
  "taai.Minerva event",
  "taai.Athena reporting",
  "taai_IQ executive visibility",
];

const BACKLOG: { group: string; items: string[] }[] = [
  {
    group: "Lovable UI",
    items: [
      "Global app shell audit against TOS v1.0",
      "Booking state indicators on cart/checkout/itinerary",
      "Admin booking ops console (read-only first)",
      "Hermes copilot panel — proposal-only surface",
      "TOS internal control-layer page (this page)",
    ],
  },
  {
    group: "GitHub / repo",
    items: [
      "Codeowners for edge functions and migrations",
      "PR template with gate-impact checklist",
      "Branch protection: Gate 7 checks required",
    ],
  },
  {
    group: "Supabase",
    items: [
      "booking_status enum (browsing→confirmed) with BEFORE UPDATE trigger",
      "transition-booking-status edge function as sole writer",
      "Audit table for state transitions with actor identity",
    ],
  },
  {
    group: "analytics / events",
    items: [
      "taai.Minerva topic catalog v1",
      "taai.Athena executive KPI board",
      "Cross-agent action funnel",
    ],
  },
  {
    group: "AI agents",
    items: [
      "Hermes proposal schema + approval envelope",
      "Specialist capability manifests (Tom, Scott, Manny, Benny, Piper, Lester, Scout)",
      "Miles guardrails for confirmed-booking edits",
    ],
  },
  {
    group: "security / compliance",
    items: [
      "Credential rotation cadence and owners",
      "PII scope map across agents",
      "Provider-confirmation truth policy",
    ],
  },
];

const RISKS = [
  { title: "Production remains no-go", body: "No production behavior may be shipped from agent workflows until control-layer gates are green." },
  { title: "Gate 7 not merged / deployed", body: "Payment/provider logic freeze holds. No changes to checkout, Stripe, migrations, secrets, or env." },
  { title: "Credential rotation still open", body: "Ownership, cadence, and evidence trail for taai.ID rotations are undecided." },
  { title: "Provider confirmation model still pending", body: "Definition of 'confirmed' must be provider-response-backed, not agent-asserted." },
  { title: "No system may claim provider-confirmed status without provider ack", body: "Any agent output that implies confirmation without an actual provider record is a policy violation." },
];

const toneRing: Record<NonNullable<Agent["tone"]>, string> = {
  core: "ring-primary/40",
  orchestration: "ring-accent/40",
  memory: "ring-muted-foreground/30",
  insight: "ring-secondary/40",
  specialist: "ring-border",
};

function SectionHeader({ index, title, subtitle }: { index: string; title: string; subtitle?: string }) {
  return (
    <div className="flex items-baseline gap-4 mb-6">
      <span className="font-mono text-xs tracking-widest text-muted-foreground">{index}</span>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        {subtitle ? <p className="text-sm text-muted-foreground mt-1">{subtitle}</p> : null}
      </div>
    </div>
  );
}

export default function InternalTOS() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Command bar */}
      <header className="border-b border-border/60 bg-card/40 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" aria-hidden />
            <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
              internal · control layer
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-[10px] tracking-wider">TOS v1.0</Badge>
            <Badge variant="outline" className="font-mono text-[10px] tracking-wider">no-deploy</Badge>
            <Badge variant="outline" className="font-mono text-[10px] tracking-wider">docs-only</Badge>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-12 pb-10">
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase mb-3">
          taai operating system
        </p>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
          TOS v1.0 — Control Layer <span className="text-muted-foreground">and</span> Agent Operating Model
        </h1>
        <p className="mt-4 max-w-3xl text-muted-foreground">
          Internal architecture surface. Documents how taai's control layer coordinates agents, enforces
          gates, and preserves the promise that no booking is claimed confirmed without provider truth.
          This page ships no production behavior.
        </p>
      </section>

      <Separator className="max-w-7xl mx-auto" />

      {/* 1. Overview */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <SectionHeader index="01" title="Control Layer Overview" subtitle="How the agents coordinate." />
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Core</CardTitle></CardHeader>
            <CardContent className="text-sm leading-relaxed">
              <p><span className="font-semibold">taai_IQ</span> sets executive priorities and consumes signals from the whole stack.</p>
              <p className="mt-2"><span className="font-semibold">taai_Nucleus</span> evaluates every proposed action against policy before anything mutates state.</p>
              <p className="mt-2"><span className="font-semibold">taai.ID</span> stamps identity onto each action so gates can reason about who acted.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Orchestration & fabric</CardTitle></CardHeader>
            <CardContent className="text-sm leading-relaxed">
              <p><span className="font-semibold">Hermes</span> routes work between agents and assembles multi-step workflows — proposal-only.</p>
              <p className="mt-2"><span className="font-semibold">taai.Minerva</span> is the event bus every state change flows through, with replay for recovery.</p>
              <p className="mt-2"><span className="font-semibold">taai_Atlas</span> stores durable memory and context that agents retrieve on demand.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Surface & specialists</CardTitle></CardHeader>
            <CardContent className="text-sm leading-relaxed">
              <p><span className="font-semibold">Miles</span> is the traveler-facing copilot; <span className="font-semibold">Ajax</span> handles ops and recovery.</p>
              <p className="mt-2">Specialists — <span className="font-semibold">Tom, Scott, Manny, Benny, Piper, Lester, Scout</span> — own vertical expertise and always defer confirmation to the system.</p>
              <p className="mt-2"><span className="font-semibold">taai.Athena</span> turns Minerva events into reporting for humans and taai_IQ.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator className="max-w-7xl mx-auto" />

      {/* 2. Responsibility Matrix */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <SectionHeader index="02" title="Responsibility Matrix" subtitle="Owns · can do · cannot do · approval required for." />
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {AGENTS.map((a) => (
            <Card key={a.name} className={`ring-1 ${toneRing[a.tone ?? "specialist"]}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{a.name}</CardTitle>
                  <Badge variant="secondary" className="font-mono text-[10px] tracking-wider uppercase">{a.tone}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{a.role}</p>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <div>
                  <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-1">owns</p>
                  <p className="text-sm">{a.owns}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-1">can</p>
                    <ul className="space-y-1">
                      {a.can.map((c) => <li key={c} className="text-xs leading-snug">• {c}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-1">cannot</p>
                    <ul className="space-y-1">
                      {a.cannot.map((c) => <li key={c} className="text-xs leading-snug text-muted-foreground">• {c}</li>)}
                    </ul>
                  </div>
                </div>
                <div>
                  <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-1">approval required</p>
                  <ul className="space-y-1">
                    {a.approval.map((c) => <li key={c} className="text-xs leading-snug">→ {c}</li>)}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator className="max-w-7xl mx-auto" />

      {/* 3. Approval Gates */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <SectionHeader index="03" title="Approval Gates" subtitle="What requires a gate, who owns it, what it needs." />
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium">Gate</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Requires</th>
                <th className="px-4 py-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {GATES.map((g, i) => (
                <tr key={g.title} className={i % 2 ? "bg-card/40" : ""}>
                  <td className="px-4 py-3 font-medium">{g.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{g.owner}</td>
                  <td className="px-4 py-3 text-muted-foreground">{g.requires}</td>
                  <td className="px-4 py-3 text-muted-foreground">{g.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Separator className="max-w-7xl mx-auto" />

      {/* 4. Event Flow */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <SectionHeader index="04" title="Event Flow" subtitle="Every state change follows this path." />
        <div className="flex flex-wrap items-center gap-2">
          {FLOW.map((step, i) => (
            <React.Fragment key={step}>
              <div className="px-3 py-2 rounded-md border border-border bg-card text-sm">
                <span className="font-mono text-[10px] tracking-widest text-muted-foreground mr-2">{String(i + 1).padStart(2, "0")}</span>
                {step}
              </div>
              {i < FLOW.length - 1 && <span className="text-muted-foreground">→</span>}
            </React.Fragment>
          ))}
        </div>
      </section>

      <Separator className="max-w-7xl mx-auto" />

      {/* 5. Backlog */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <SectionHeader index="05" title="Implementation Backlog" subtitle="Grouped by surface. Not scheduled." />
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {BACKLOG.map((b) => (
            <Card key={b.group}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{b.group}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {b.items.map((i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <span className="text-muted-foreground font-mono text-xs mt-0.5">▢</span>
                      <span>{i}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator className="max-w-7xl mx-auto" />

      {/* 6. Risks */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <SectionHeader index="06" title="Risks and Open Decisions" subtitle="What is currently unresolved or explicitly frozen." />
        <div className="grid md:grid-cols-2 gap-4">
          {RISKS.map((r) => (
            <Card key={r.title} className="border-l-4 border-l-primary/70">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{r.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{r.body}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <footer className="max-w-7xl mx-auto px-6 pb-16 pt-6">
        <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          internal · taai control layer · TOS v1.0 · docs-only · no production behavior
        </p>
      </footer>
    </main>
  );
}