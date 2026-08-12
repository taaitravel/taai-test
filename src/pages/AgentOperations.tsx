import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CheckCircle2, FileCheck2, Network, RefreshCw, Route, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAgentOperations } from '@/hooks/useAgentOperations';
import {
  ROUTABLE_INTERNAL_AGENT_KEYS,
  TAAI_AGENT_MANIFEST,
  TAAI_ARCHITECTURE_LAYERS,
  isStateChangingAction,
  type AgentKey,
} from '@/lib/taai/operating-system';

const ACTION_CLASSES = [
  ['read', 'Read'], ['analyze', 'Analyze'], ['propose', 'Propose'], ['draft', 'Draft'], ['test', 'Test'],
  ['modify_code', 'Modify code'], ['modify_data', 'Modify data'], ['deploy', 'Deploy'],
  ['send_external', 'Send external'], ['financial_action', 'Financial action'], ['provider_action', 'Provider action'],
] as const;

const EVIDENCE_TYPES = ['analysis', 'code', 'test', 'query', 'deployment', 'approval', 'report', 'artifact', 'screenshot', 'provider', 'financial', 'other'] as const;

type RoutableAgent = Exclude<AgentKey, 'miles' | 'bob' | 'hermes'>;

const initialTask = {
  title: '',
  objective: '',
  assignedAgent: 'tom' as RoutableAgent,
  actionClass: 'analyze',
  riskLevel: 'low',
  successCriteria: '',
};

export default function AgentOperations() {
  const operations = useAgentOperations();
  const [taskForm, setTaskForm] = useState(initialTask);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [approvalReasons, setApprovalReasons] = useState<Record<string, string>>({});
  const [evidenceForm, setEvidenceForm] = useState({ evidenceType: 'test', label: '', summary: '', referenceUrl: '' });

  const pendingApprovals = operations.approvals.filter((approval) => approval.status === 'pending');
  const selectedTask = operations.tasks.find((task) => task.id === selectedTaskId) ?? null;
  const selectedEvidence = operations.evidence.filter((item) => item.task_id === selectedTaskId);
  const selectedEvents = operations.events.filter((item) => item.task_id === selectedTaskId).slice().reverse();

  const metrics = useMemo(() => ({
    open: operations.tasks.filter((task) => !['completed', 'failed', 'cancelled'].includes(task.status)).length,
    approvals: pendingApprovals.length,
    evidence: operations.evidence.length,
    tom: operations.tasks.filter((task) => task.assigned_agent === 'tom').length,
  }), [operations.tasks, operations.evidence, pendingApprovals.length]);

  const handleCreateTask = async () => {
    if (!taskForm.title.trim() || !taskForm.objective.trim()) {
      toast.error('Task title and objective are required.');
      return;
    }
    setSubmitting(true);
    try {
      await operations.createTask(taskForm);
      toast.success(isStateChangingAction(taskForm.actionClass)
        ? 'Hermes routed the task to Security / Control for approval.'
        : `Hermes routed the task to ${TAAI_AGENT_MANIFEST[taskForm.assignedAgent].name}.`);
      setTaskForm(initialTask);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create task.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecision = async (approvalId: string, decision: 'approved' | 'rejected') => {
    try {
      await operations.decideApproval(approvalId, decision, approvalReasons[approvalId] ?? '');
      toast.success(`Task ${decision}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to record decision.');
    }
  };

  const handleAddEvidence = async () => {
    if (!selectedTaskId || !evidenceForm.label.trim() || !evidenceForm.summary.trim()) {
      toast.error('Evidence label and summary are required.');
      return;
    }
    try {
      await operations.addEvidence({ taskId: selectedTaskId, ...evidenceForm });
      toast.success('Evidence added to the execution journal.');
      setEvidenceForm({ evidenceType: 'test', label: '', summary: '', referenceUrl: '' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to add evidence.');
    }
  };

  const changeStatus = async (taskId: string, status: string) => {
    try {
      await operations.updateTaskStatus(taskId, status);
      toast.success(`Task moved to ${status.replaceAll('_', ' ')}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Status change was blocked.');
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-background/95">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">taai_IQ · Agent operations</p>
            <h1 className="text-2xl font-semibold">Hermes control desk</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => void operations.refresh()}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
            <Button asChild variant="outline" size="sm"><Link to="/internal/tos">Internal TOS</Link></Button>
            <Button asChild size="sm"><Link to="/admin">Command center</Link></Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <section aria-label="taai IQ architecture navigation" className="mb-8 overflow-x-auto rounded-xl border bg-card p-3">
          <div className="flex min-w-max items-center gap-2">
            {TAAI_ARCHITECTURE_LAYERS.map((layer, index) => (
              <div key={layer.key} className="flex items-center gap-2">
                <div className={`rounded-lg border px-3 py-2 ${layer.key === 'orchestration' ? 'border-primary bg-primary/10' : 'border-border'}`}>
                  <p className="font-mono text-[9px] text-muted-foreground">L{String(layer.order).padStart(2, '0')}</p>
                  <p className="text-xs font-medium">{layer.name}</p>
                </div>
                {index < TAAI_ARCHITECTURE_LAYERS.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </section>

        {operations.error && (
          <Card className="mb-8 border-amber-500/50 bg-amber-500/5">
            <CardContent className="flex gap-3 p-4 text-sm"><AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" /><div><p className="font-medium">Agent operations storage is not available in this environment.</p><p className="text-muted-foreground">Apply the reviewed agent-operations migration before using this console. Database detail: {operations.error}</p></div></CardContent>
          </Card>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {([
            ['Open tasks', metrics.open, Route], ['Pending approvals', metrics.approvals, ShieldCheck],
            ['Evidence records', metrics.evidence, FileCheck2], ['Tom lane', metrics.tom, Network],
          ] as [string, number, React.ElementType][]).map(([label, value, Icon]) => (
            <Card key={String(label)}><CardContent className="flex items-center justify-between p-5"><div><p className="text-xs text-muted-foreground">{String(label)}</p><p className="mt-1 text-2xl font-semibold">{String(value)}</p></div><Icon className="h-5 w-5 text-primary" /></CardContent></Card>
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader><CardTitle className="text-lg">Route a task through Hermes</CardTitle><p className="text-sm text-muted-foreground">Tom is the first active specialist lane. Consequential action classes automatically stop at Security / Control.</p></CardHeader>
            <CardContent className="space-y-4">
              <div><label className="mb-1 block text-xs font-medium">Title</label><Input value={taskForm.title} onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })} placeholder="Review itinerary date regression" /></div>
              <div><label className="mb-1 block text-xs font-medium">Objective</label><Textarea value={taskForm.objective} onChange={(event) => setTaskForm({ ...taskForm, objective: event.target.value })} placeholder="Describe the exact scope and expected outcome." rows={5} /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="mb-1 block text-xs font-medium">Assigned lane</label><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={taskForm.assignedAgent} onChange={(event) => setTaskForm({ ...taskForm, assignedAgent: event.target.value as RoutableAgent })}>{ROUTABLE_INTERNAL_AGENT_KEYS.map((key) => <option key={key} value={key}>{TAAI_AGENT_MANIFEST[key].name} · {TAAI_AGENT_MANIFEST[key].role}</option>)}</select></div>
                <div><label className="mb-1 block text-xs font-medium">Action class</label><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={taskForm.actionClass} onChange={(event) => setTaskForm({ ...taskForm, actionClass: event.target.value })}>{ACTION_CLASSES.map(([value, label]) => <option key={value} value={value}>{label}{isStateChangingAction(value) ? ' · approval required' : ''}</option>)}</select></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="mb-1 block text-xs font-medium">Risk</label><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={taskForm.riskLevel} onChange={(event) => setTaskForm({ ...taskForm, riskLevel: event.target.value })}>{['low', 'medium', 'high', 'consequential'].map((risk) => <option key={risk} value={risk}>{risk}</option>)}</select></div>
                <div><label className="mb-1 block text-xs font-medium">Success criteria</label><Input value={taskForm.successCriteria} onChange={(event) => setTaskForm({ ...taskForm, successCriteria: event.target.value })} placeholder="Evidence-backed completion" /></div>
              </div>
              {isStateChangingAction(taskForm.actionClass) && <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-300">This task will be created as awaiting approval. Hermes cannot queue, start, or complete it until a human records an approved decision.</div>}
              <Button className="w-full" disabled={submitting || Boolean(operations.error)} onClick={() => void handleCreateTask()}>{submitting ? 'Routing…' : 'Create and route task'}</Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Security / Control approval inbox</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {pendingApprovals.length === 0 ? <p className="text-sm text-muted-foreground">No pending approvals.</p> : pendingApprovals.map((approval) => {
                  const task = operations.tasks.find((item) => item.id === approval.task_id);
                  return <div key={approval.id} className="rounded-lg border p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-medium">{task?.title ?? 'Task approval'}</p><p className="text-xs text-muted-foreground">{approval.action_class.replaceAll('_', ' ')} · {task?.assigned_agent ?? 'unassigned'}</p></div><Badge variant="outline">pending human decision</Badge></div><p className="mt-2 text-sm text-muted-foreground">{task?.objective}</p><Input className="mt-3" placeholder="Decision reason / constraints" value={approvalReasons[approval.id] ?? ''} onChange={(event) => setApprovalReasons({ ...approvalReasons, [approval.id]: event.target.value })} /><div className="mt-3 flex gap-2"><Button size="sm" onClick={() => void handleDecision(approval.id, 'approved')}><CheckCircle2 className="mr-2 h-4 w-4" />Approve scope</Button><Button size="sm" variant="outline" onClick={() => void handleDecision(approval.id, 'rejected')}>Reject</Button></div></div>;
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Hermes task queue</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {operations.loading ? <p className="text-sm text-muted-foreground">Loading task records…</p> : operations.tasks.length === 0 ? <p className="text-sm text-muted-foreground">No tasks recorded.</p> : operations.tasks.map((task) => {
                  const taskApproval = operations.approvals.find((approval) => approval.task_id === task.id && approval.status === 'approved');
                  const evidenceCount = operations.evidence.filter((item) => item.task_id === task.id).length;
                  return <div key={task.id} className={`rounded-lg border p-4 ${selectedTaskId === task.id ? 'border-primary' : ''}`}><button type="button" className="w-full text-left" onClick={() => setSelectedTaskId(task.id)}><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-medium">{task.title}</p><p className="text-xs text-muted-foreground">Hermes → {TAAI_AGENT_MANIFEST[task.assigned_agent as AgentKey]?.name ?? task.assigned_agent}</p></div><div className="flex gap-2"><Badge variant="secondary">{task.status.replaceAll('_', ' ')}</Badge>{task.approval_required && <Badge variant="outline">{taskApproval ? 'approved' : 'gated'}</Badge>}</div></div><p className="mt-2 text-sm text-muted-foreground">{task.objective}</p><p className="mt-2 text-xs text-muted-foreground">{task.action_class.replaceAll('_', ' ')} · {task.risk_level} risk · {evidenceCount} evidence record{evidenceCount === 1 ? '' : 's'}</p></button><div className="mt-3 flex flex-wrap gap-2">{task.status === 'awaiting_approval' && taskApproval && <Button size="sm" variant="outline" onClick={() => void changeStatus(task.id, 'queued')}>Queue approved work</Button>}{task.status === 'queued' && <Button size="sm" variant="outline" onClick={() => void changeStatus(task.id, 'in_progress')}>Start</Button>}{['queued', 'in_progress', 'blocked'].includes(task.status) && <Button size="sm" variant="outline" onClick={() => void changeStatus(task.id, 'completed')}>Complete with evidence</Button>}{task.status === 'in_progress' && <Button size="sm" variant="ghost" onClick={() => void changeStatus(task.id, 'blocked')}>Block</Button>}</div></div>;
                })}
              </CardContent>
            </Card>
          </div>
        </section>

        {selectedTask && (
          <section className="mt-8 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-lg">Add evidence · {selectedTask.title}</CardTitle><p className="text-sm text-muted-foreground">Evidence is immutable and required before completion.</p></CardHeader>
              <CardContent className="space-y-4">
                <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={evidenceForm.evidenceType} onChange={(event) => setEvidenceForm({ ...evidenceForm, evidenceType: event.target.value })}>{EVIDENCE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select>
                <Input placeholder="Evidence label" value={evidenceForm.label} onChange={(event) => setEvidenceForm({ ...evidenceForm, label: event.target.value })} />
                <Textarea placeholder="What was observed, tested, or produced?" rows={4} value={evidenceForm.summary} onChange={(event) => setEvidenceForm({ ...evidenceForm, summary: event.target.value })} />
                <Input placeholder="Optional file, commit, report, or artifact URL" value={evidenceForm.referenceUrl} onChange={(event) => setEvidenceForm({ ...evidenceForm, referenceUrl: event.target.value })} />
                <Button onClick={() => void handleAddEvidence()}>Record evidence</Button>
                {selectedEvidence.map((item) => <div key={item.id} className="rounded-lg border p-3"><div className="flex justify-between gap-2"><p className="text-sm font-medium">{item.label}</p><Badge variant="outline">{item.evidence_type}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{item.summary}</p></div>)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">Execution journal</CardTitle><p className="text-sm text-muted-foreground">Actor-attributed route, approval, status, and evidence events.</p></CardHeader>
              <CardContent className="space-y-3">
                {selectedEvents.map((event) => <div key={event.id} className="border-l-2 border-primary/40 pl-3"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium">{event.summary}</p><span className="text-[10px] text-muted-foreground">{new Date(event.created_at).toLocaleString()}</span></div><p className="text-xs text-muted-foreground">{event.actor_kind}{event.actor_key ? ` · ${event.actor_key}` : ''} · {event.event_type.replaceAll('_', ' ')}</p></div>)}
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </main>
  );
}
