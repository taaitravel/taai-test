import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, LockKeyhole, Network, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  ARCHITECTURE_VERSION,
  TAAI_AGENT_KEYS,
  TAAI_AGENT_MANIFEST,
  TAAI_ARCHITECTURE_LAYERS,
  TAAI_DIRECTIONAL_FLOW,
  type ImplementationStatus,
} from '@/lib/taai/operating-system';

const statusClasses: Record<ImplementationStatus, string> = {
  current: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-300',
  partial: 'border-amber-500/40 text-amber-600 dark:text-amber-300',
  planned: 'border-blue-500/40 text-blue-600 dark:text-blue-300',
  conceptual: 'border-muted-foreground/40 text-muted-foreground',
};

const APPROVAL_GATES = [
  ['Code and product mutations', 'Human approval linked to the exact task and scope'],
  ['Database changes and migrations', 'Reviewed SQL, target environment, rollback plan, and explicit approval'],
  ['Production deploys', 'Approved release scope and verified checks'],
  ['External communications', 'Approved recipient, content, channel, and sending authority'],
  ['Payments, refunds, and finance changes', 'Financial evidence plus authorized human decision'],
  ['Provider and booking actions', 'Traveler intent, provider evidence, and authorized execution'],
  ['Secrets, credentials, and access', 'Admin approval with rotation and audit evidence'],
] as const;

const PRINCIPLES = [
  'The traveler creates the workflow; the system must preserve traveler context and consent.',
  'Miles is the general traveler companion. Bob appears only in Create Itinerary planning.',
  'Hermes routes work; it does not approve its own consequential actions.',
  'Ajax and specialist agents are internal-only and operate inside assigned scopes.',
  'taai_Nucleus owns commerce decisions; the UI and agents never invent booking truth.',
  'Every consequential action is actor-attributed, approval-gated, and evidence-backed.',
] as const;

function StatusBadge({ status }: { status: ImplementationStatus }) {
  return (
    <Badge variant="outline" className={`text-[10px] uppercase tracking-wider ${statusClasses[status]}`}>
      {status}
    </Badge>
  );
}

export default function InternalTOS() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">taai_IQ · Internal TOS</p>
            <p className="text-sm font-semibold">Directional architecture {ARCHITECTURE_VERSION}</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm"><Link to="/admin">Command center</Link></Button>
            <Button asChild size="sm"><Link to="/internal/agents">Agent operations <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="max-w-4xl">
          <Badge variant="secondary" className="mb-4">Active source of truth</Badge>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">TAAI operating system</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Traveler → Experience → AI → Orchestration → Business Logic → Data → Intelligence → Executive Command.
            Details may mature; ownership and direction stay fixed until a reviewed version replaces this one.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-2">
          {TAAI_DIRECTIONAL_FLOW.map((step, index) => (
            <React.Fragment key={step}>
              <div className="rounded-md border bg-card px-3 py-2 text-sm">
                <span className="mr-2 font-mono text-[10px] text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
                {step}
              </div>
              {index < TAAI_DIRECTIONAL_FLOW.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
            </React.Fragment>
          ))}
        </div>
      </section>

      <Separator />

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-6 flex items-center gap-3">
          <Network className="h-5 w-5 text-primary" />
          <div><h2 className="text-2xl font-semibold">Architectural layers</h2><p className="text-sm text-muted-foreground">Every major component is explicitly marked.</p></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {TAAI_ARCHITECTURE_LAYERS.map((layer) => (
            <Card key={layer.key}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="font-mono text-[10px] text-muted-foreground">L{String(layer.order).padStart(2, '0')}</p><CardTitle className="mt-1 text-base">{layer.name}</CardTitle></div>
                  <StatusBadge status={layer.status} />
                </div>
                <p className="text-xs text-muted-foreground">{layer.summary}</p>
              </CardHeader>
              <CardContent className="space-y-2">
                {layer.components.map((component) => (
                  <div key={component.key} className="rounded-md border border-border/70 p-3">
                    <div className="flex items-center justify-between gap-2"><span className="text-sm font-medium">{component.name}</span><StatusBadge status={component.status} /></div>
                    <p className="mt-1 text-xs text-muted-foreground">{component.summary}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-2xl font-semibold">Shared agent responsibility manifest</h2>
        <p className="mt-1 text-sm text-muted-foreground">One roster powers traveler identity, Internal TOS, and taai_IQ agent operations.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {TAAI_AGENT_KEYS.map((key) => {
            const agent = TAAI_AGENT_MANIFEST[key];
            return (
              <Card key={agent.key} className={agent.key === 'tom' ? 'ring-1 ring-primary/50' : undefined}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2"><CardTitle className="text-base">{agent.name}</CardTitle><StatusBadge status={agent.status} /></div>
                  <div className="flex flex-wrap gap-2"><Badge variant="secondary">{agent.role}</Badge><Badge variant="outline">{agent.visibility}</Badge></div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">{agent.summary}</p>
                  <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Owns</p><p>{agent.owns.join(' · ')}</p></div>
                  <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Approval required</p><p>{agent.approvalRequired.join(' · ')}</p></div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <Separator />

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-2">
        <div>
          <div className="mb-5 flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-primary" /><h2 className="text-2xl font-semibold">Security / Control approval gates</h2></div>
          <div className="overflow-hidden rounded-lg border">
            {APPROVAL_GATES.map(([action, requirement], index) => (
              <div key={action} className={`grid gap-1 p-4 sm:grid-cols-[0.8fr_1.2fr] ${index ? 'border-t' : ''}`}>
                <p className="text-sm font-medium">{action}</p><p className="text-sm text-muted-foreground">{requirement}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-5 flex items-center gap-3"><LockKeyhole className="h-5 w-5 text-primary" /><h2 className="text-2xl font-semibold">Operating principles</h2></div>
          <div className="space-y-3">
            {PRINCIPLES.map((principle, index) => (
              <div key={principle} className="flex gap-3 rounded-lg border bg-card p-4"><span className="font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, '0')}</span><p className="text-sm">{principle}</p></div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t px-6 py-8 text-center text-xs text-muted-foreground">
        Version {ARCHITECTURE_VERSION} · architecture document: architecture/taai-operating-system-2026.08.08-v1.md
      </footer>
    </main>
  );
}
