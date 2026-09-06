import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';
import type { AgentKey } from '@/lib/taai/operating-system';
import {
  AGENT_APPROVAL_FIELDS,
  AGENT_EVENT_FIELDS,
  AGENT_EVIDENCE_FIELDS,
  AGENT_TASK_FIELDS,
  PAGE_SIZES,
  assertSafeProjection,
  projectedRows,
} from '@/lib/data/projections';

/**
 * Egress containment: the control layer reads bounded, explicitly projected
 * rows. `select('*')` is forbidden here — the tables carry metadata/context
 * JSON the UI never renders.
 */
export type AgentTask = Pick<
  Tables<'agent_tasks'>,
  | 'id'
  | 'title'
  | 'objective'
  | 'assigned_agent'
  | 'action_class'
  | 'risk_level'
  | 'status'
  | 'approval_required'
  | 'success_criteria'
  | 'created_at'
>;
export type AgentTaskApproval = Pick<
  Tables<'agent_task_approvals'>,
  'id' | 'task_id' | 'status' | 'action_class' | 'requested_at' | 'decided_at' | 'decision_reason'
>;
export type AgentTaskEvidence = Pick<
  Tables<'agent_task_evidence'>,
  'id' | 'task_id' | 'evidence_type' | 'label' | 'summary' | 'reference_url' | 'recorded_at'
>;
export type AgentTaskEvent = Pick<
  Tables<'agent_task_events'>,
  'id' | 'task_id' | 'event_type' | 'summary' | 'actor_kind' | 'actor_key' | 'created_at'
>;

const TASK_PROJECTION = assertSafeProjection('agent tasks', AGENT_TASK_FIELDS);
const APPROVAL_PROJECTION = assertSafeProjection('agent approvals', AGENT_APPROVAL_FIELDS);
const EVIDENCE_PROJECTION = assertSafeProjection('agent evidence', AGENT_EVIDENCE_FIELDS);
const EVENT_PROJECTION = assertSafeProjection('agent events', AGENT_EVENT_FIELDS);

export interface CreateAgentTaskInput {
  title: string;
  objective: string;
  assignedAgent: Exclude<AgentKey, 'miles' | 'bob' | 'hermes'>;
  actionClass: string;
  riskLevel: string;
  successCriteria?: string;
}

export interface AddEvidenceInput {
  taskId: string;
  evidenceType: string;
  label: string;
  summary: string;
  referenceUrl?: string;
}

export function useAgentOperations() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [approvals, setApprovals] = useState<AgentTaskApproval[]>([]);
  const [evidence, setEvidence] = useState<AgentTaskEvidence[]>([]);
  const [events, setEvents] = useState<AgentTaskEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setTasks([]);
      setApprovals([]);
      setEvidence([]);
      setEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const limit = PAGE_SIZES.agentRows;
    const [taskResult, approvalResult, evidenceResult, eventResult] = await Promise.all([
      supabase.from('agent_tasks').select(TASK_PROJECTION).order('created_at', { ascending: false }).limit(limit),
      supabase
        .from('agent_task_approvals')
        .select(APPROVAL_PROJECTION)
        .order('requested_at', { ascending: false })
        .limit(limit),
      supabase
        .from('agent_task_evidence')
        .select(EVIDENCE_PROJECTION)
        .order('recorded_at', { ascending: false })
        .limit(limit),
      supabase
        .from('agent_task_events')
        .select(EVENT_PROJECTION)
        .order('created_at', { ascending: false })
        .limit(limit),
    ]);

    const firstError = taskResult.error || approvalResult.error || evidenceResult.error || eventResult.error;
    if (firstError) {
      setError(firstError.message);
    } else {
      setError(null);
      setTasks(projectedRows<AgentTask>(taskResult.data));
      setApprovals(projectedRows<AgentTaskApproval>(approvalResult.data));
      setEvidence(projectedRows<AgentTaskEvidence>(evidenceResult.data));
      setEvents(projectedRows<AgentTaskEvent>(eventResult.data));
    }
    setLoading(false);
  }, [user]);


  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createTask = async (input: CreateAgentTaskInput) => {
    if (!user) throw new Error('Authentication required');
    const { error: insertError } = await supabase.from('agent_tasks').insert({
      title: input.title.trim(),
      objective: input.objective.trim(),
      assigned_agent: input.assignedAgent,
      action_class: input.actionClass,
      risk_level: input.riskLevel,
      success_criteria: input.successCriteria?.trim() || null,
      created_by: user.id,
      updated_by: user.id,
    });
    if (insertError) throw insertError;
    await refresh();
  };

  const decideApproval = async (approvalId: string, decision: 'approved' | 'rejected', reason: string) => {
    const { error: updateError } = await supabase
      .from('agent_task_approvals')
      .update({ status: decision, decision_reason: reason.trim() || null })
      .eq('id', approvalId)
      .eq('status', 'pending');
    if (updateError) throw updateError;
    await refresh();
  };

  const addEvidence = async (input: AddEvidenceInput) => {
    if (!user) throw new Error('Authentication required');
    const { error: insertError } = await supabase.from('agent_task_evidence').insert({
      task_id: input.taskId,
      evidence_type: input.evidenceType,
      label: input.label.trim(),
      summary: input.summary.trim(),
      reference_url: input.referenceUrl?.trim() || null,
      recorded_by: user.id,
    });
    if (insertError) throw insertError;
    await refresh();
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    const { error: updateError } = await supabase
      .from('agent_tasks')
      .update({ status })
      .eq('id', taskId);
    if (updateError) throw updateError;
    await refresh();
  };

  return {
    tasks,
    approvals,
    evidence,
    events,
    loading,
    error,
    refresh,
    createTask,
    decideApproval,
    addEvidence,
    updateTaskStatus,
  };
}
