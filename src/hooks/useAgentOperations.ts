import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';
import type { AgentKey } from '@/lib/taai/operating-system';

export type AgentTask = Tables<'agent_tasks'>;
export type AgentTaskApproval = Tables<'agent_task_approvals'>;
export type AgentTaskEvidence = Tables<'agent_task_evidence'>;
export type AgentTaskEvent = Tables<'agent_task_events'>;

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
    const [taskResult, approvalResult, evidenceResult, eventResult] = await Promise.all([
      supabase.from('agent_tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('agent_task_approvals').select('*').order('requested_at', { ascending: false }),
      supabase.from('agent_task_evidence').select('*').order('recorded_at', { ascending: false }),
      supabase.from('agent_task_events').select('*').order('created_at', { ascending: false }),
    ]);

    const firstError = taskResult.error || approvalResult.error || evidenceResult.error || eventResult.error;
    if (firstError) {
      setError(firstError.message);
    } else {
      setError(null);
      setTasks(taskResult.data ?? []);
      setApprovals(approvalResult.data ?? []);
      setEvidence(evidenceResult.data ?? []);
      setEvents(eventResult.data ?? []);
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
