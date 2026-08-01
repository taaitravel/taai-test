/**
 * Gate 9A1-A commercial permissions — DEFERRED CONTRACT ONLY.
 *
 * These helpers compile as contracts. They are not imported by any route,
 * page, component, hook, edge function, Ajax runtime, Hermes runtime, Miles,
 * Benny, Supabase operation, or production authorization flow. Their presence
 * does not authorize runtime use.
 *
 * Import direction: permissions.ts -> agent-registry.ts -> types.ts.
 */
import { COMMERCIAL_AGENT_REGISTRY } from './agent-registry';
import type {
  CommercialActionClass,
  CommercialAgentKey,
  CommercialApprovalRecord,
  CommercialAuthorizationReason,
  CommercialAuthorizationResult,
  CommercialConsequentialAction,
  CommercialPermission,
  CommercialPermissionPartitionResult,
  DeterministicApprovalContext,
} from './types';

export const COMMERCIAL_ACTION_CLASSES: readonly CommercialActionClass[] = [
  'read',
  'analyze',
  'propose',
  'draft',
  'schedule_internal',
  'execute_internal_ephemeral',
  'modify_internal_record',
  'send_external',
  'spend',
  'modify_financial_record',
  'grant_access',
  'production_change',
] as const;

/** Single source of truth for approval semantics per action class. */
export const COMMERCIAL_PERMISSIONS: Record<CommercialActionClass, CommercialPermission> = {
  read: {
    actionClass: 'read',
    allowedWithoutApproval: true,
    requiresDeterministicApproval: false,
    notes: 'Allowed only for scoped, authorized internal records.',
  },
  analyze: {
    actionClass: 'analyze',
    allowedWithoutApproval: true,
    requiresDeterministicApproval: false,
    notes: 'Allowed when sources are permitted and outputs label facts, assumptions, and confidence.',
  },
  propose: {
    actionClass: 'propose',
    allowedWithoutApproval: true,
    requiresDeterministicApproval: false,
    notes: 'Allowed for internal recommendations that do not execute consequential actions.',
  },
  draft: {
    actionClass: 'draft',
    allowedWithoutApproval: true,
    requiresDeterministicApproval: false,
    notes: 'Allowed for internal drafts only; drafts are not sent, published, or shared externally.',
  },
  schedule_internal: {
    actionClass: 'schedule_internal',
    allowedWithoutApproval: true,
    requiresDeterministicApproval: false,
    notes: 'Allowed for internal reminders or task proposals only.',
  },
  execute_internal_ephemeral: {
    actionClass: 'execute_internal_ephemeral',
    allowedWithoutApproval: true,
    requiresDeterministicApproval: false,
    notes:
      'Internal analysis or artifact generation with no durable record change. Task-scoped only; any durable change is modify_internal_record.',
  },
  modify_internal_record: {
    actionClass: 'modify_internal_record',
    allowedWithoutApproval: false,
    requiresDeterministicApproval: true,
    notes:
      'Durable internal record change. Requires an exact domain-scoped approval; the generic scope literal "modify_internal_record" is never sufficient.',
  },
  send_external: {
    actionClass: 'send_external',
    allowedWithoutApproval: false,
    requiresDeterministicApproval: true,
    notes:
      'Covers email, messages, investor outreach, partner/customer communications, and external scheduling.',
  },
  spend: {
    actionClass: 'spend',
    allowedWithoutApproval: false,
    requiresDeterministicApproval: true,
    notes: 'Covers spending money and changing budgets, bids, audiences, campaign status, or spend controls.',
  },
  modify_financial_record: {
    actionClass: 'modify_financial_record',
    allowedWithoutApproval: false,
    requiresDeterministicApproval: true,
    notes: 'Covers creating, updating, deleting, reconciling, or overriding financial records.',
  },
  grant_access: {
    actionClass: 'grant_access',
    allowedWithoutApproval: false,
    requiresDeterministicApproval: true,
    notes: 'Covers data-room access, file sharing, permission grants, and confidential asset access.',
  },
  production_change: {
    actionClass: 'production_change',
    allowedWithoutApproval: false,
    requiresDeterministicApproval: true,
    notes: 'Covers deploy, publish, migrations, production config/data changes, and secret/key changes.',
  },
};

/** Derived from COMMERCIAL_PERMISSIONS; never maintained by hand. */
export const APPROVAL_REQUIRED_ACTION_CLASSES: CommercialActionClass[] =
  COMMERCIAL_ACTION_CLASSES.filter(
    (actionClass) => COMMERCIAL_PERMISSIONS[actionClass].requiresDeterministicApproval,
  );

/**
 * Classification only. This map does NOT constitute approval, execution
 * authority, or proof that every action class a workflow requires was
 * authorized. Each required action class must be authorized independently.
 */
export const CONSEQUENTIAL_ACTION_MAP = {
  publish_content: 'send_external',
  publish_application: 'production_change',
  deploy: 'production_change',
  apply_migration: 'production_change',
  rotate_secrets: 'production_change',
  launch_campaign: 'spend',
} as const satisfies Record<CommercialConsequentialAction, CommercialActionClass>;

/**
 * Documented examples of complete domain-scoped authorization values for
 * `modify_internal_record`. A domain prefix is never broad authorization.
 */
export const MODIFY_INTERNAL_RECORD_DOMAIN_SCOPES: readonly string[] = [
  'finance_operations:reconciliation_record:update',
  'crm:fundraising_opportunity:update',
  'crm:fundraising_task:update',
  'campaign:status:update',
  'content:content_asset:update',
  'investor_intelligence:investor_score:update',
] as const;

/** The generic action-class literal is explicitly not an authorization scope. */
export const GENERIC_MODIFY_INTERNAL_RECORD_SCOPE = 'modify_internal_record' as const;

export function actionRequiresApproval(actionClass: CommercialActionClass): boolean {
  return COMMERCIAL_PERMISSIONS[actionClass].requiresDeterministicApproval;
}

export function agentCanPerformWithoutApproval(
  agentKey: CommercialAgentKey,
  actionClass: CommercialActionClass,
): boolean {
  return (
    COMMERCIAL_AGENT_REGISTRY[agentKey].allowedWithoutApproval.includes(actionClass) &&
    COMMERCIAL_PERMISSIONS[actionClass].allowedWithoutApproval
  );
}

export function agentCanRequestApprovalFor(
  agentKey: CommercialAgentKey,
  actionClass: CommercialActionClass,
): boolean {
  return COMMERCIAL_AGENT_REGISTRY[agentKey].requestableWithApproval.includes(actionClass);
}

export function agentIsAlwaysProhibitedFrom(
  agentKey: CommercialAgentKey,
  actionClass: CommercialActionClass,
): boolean {
  return COMMERCIAL_AGENT_REGISTRY[agentKey].alwaysProhibited.includes(actionClass);
}

/** Finite number within 0-1 inclusive. */
export function isValidConfidence(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
}

const ISO_TIMESTAMP_WITH_OFFSET =
  /^\d{4}-\d{2}-\d{2}[Tt]\d{2}:\d{2}(:\d{2}(\.\d+)?)?([Zz]|[+-]\d{2}:\d{2})$/;

/**
 * Requires BOTH ISO 8601 structure with an explicit `Z` or numeric offset AND a
 * finite parsed timestamp. Timezone-less and locale-formatted values fail.
 */
export function isValidAuthorizationTimestamp(value: unknown): boolean {
  if (typeof value !== 'string' || !ISO_TIMESTAMP_WITH_OFFSET.test(value)) return false;
  return Number.isFinite(Date.parse(value));
}

function parsedTime(value: string): number {
  return Date.parse(value);
}

/**
 * A scope entry is valid only when it is a non-empty, non-whitespace-only
 * string with no wildcard character. Values are never trimmed or normalized.
 */
export function isValidAuthorizationScopeEntry(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  if (value.length === 0) return false;
  if (value.trim().length === 0) return false;
  if (value.includes('*')) return false;
  return true;
}

export function isValidAuthorizationScopeList(values: unknown): boolean {
  if (!Array.isArray(values) || values.length === 0) return false;
  return values.every((value) => isValidAuthorizationScopeEntry(value));
}

/**
 * For `modify_internal_record`, the generic action-class literal is rejected
 * wherever it appears — in requestedScope or approvedScope.
 */
function containsGenericModifyInternalRecordScope(values: readonly string[]): boolean {
  return values.some((value) => value === GENERIC_MODIFY_INTERNAL_RECORD_SCOPE);
}

/** Literal, case-sensitive equality. No trimming, normalization, or matching heuristics. */
function scopeIsExactlyApproved(requested: string, approvedScope: readonly string[]): boolean {
  return approvedScope.some((approved) => approved === requested);
}

export function validateAgentPermissionPartition(
  agentKey: CommercialAgentKey,
): CommercialPermissionPartitionResult {
  const definition = COMMERCIAL_AGENT_REGISTRY[agentKey];
  const all: CommercialActionClass[] = [
    ...definition.allowedWithoutApproval,
    ...definition.requestableWithApproval,
    ...definition.alwaysProhibited,
  ];

  const counts = new Map<CommercialActionClass, number>();
  for (const actionClass of all) {
    counts.set(actionClass, (counts.get(actionClass) ?? 0) + 1);
  }

  const missing = COMMERCIAL_ACTION_CLASSES.filter((actionClass) => !counts.has(actionClass));
  const duplicates = COMMERCIAL_ACTION_CLASSES.filter(
    (actionClass) => (counts.get(actionClass) ?? 0) > 1,
  );

  return {
    agentKey,
    missing,
    duplicates,
    valid: missing.length === 0 && duplicates.length === 0,
  };
}

export function validateAllAgentPermissionPartitions(): CommercialPermissionPartitionResult[] {
  return (Object.keys(COMMERCIAL_AGENT_REGISTRY) as CommercialAgentKey[]).map((agentKey) =>
    validateAgentPermissionPartition(agentKey),
  );
}

/** Ordered failure precedence used when no record passes evaluation. */
const RECORD_FAILURE_PRECEDENCE: CommercialAuthorizationReason[] = [
  'approval_revoked',
  'approval_expired',
  'approval_consumed',
  'approval_timestamp_missing',
  'approval_timestamp_invalid',
  'approval_not_approved',
  'scope_mismatch',
];

function deny(
  reason: CommercialAuthorizationReason,
  message: string,
): CommercialAuthorizationResult {
  return { allowed: false, reason, message };
}

function evaluateRecord(
  record: CommercialApprovalRecord,
  context: DeterministicApprovalContext,
): CommercialAuthorizationResult {
  if (record.revokedAt !== undefined) {
    if (!isValidAuthorizationTimestamp(record.revokedAt)) {
      return deny('approval_timestamp_invalid', 'revokedAt is not a valid ISO 8601 timestamp.');
    }
    return deny('approval_revoked', 'Approval was revoked.');
  }
  if (record.status === 'revoked') {
    return deny('approval_revoked', 'Approval status is revoked.');
  }
  if (record.status === 'expired') {
    return deny('approval_expired', 'Approval status is expired.');
  }
  if (record.status !== 'approved') {
    return deny('approval_not_approved', `Approval status is ${record.status}.`);
  }
  if (record.approvedAt === undefined) {
    return deny('approval_timestamp_missing', 'approvedAt is required for an approved record.');
  }
  if (!isValidAuthorizationTimestamp(record.approvedAt)) {
    return deny('approval_timestamp_invalid', 'approvedAt is not a valid ISO 8601 timestamp.');
  }
  if (!isValidAuthorizationTimestamp(context.evaluatedAt)) {
    return deny('approval_timestamp_invalid', 'evaluatedAt is not a valid ISO 8601 timestamp.');
  }

  const evaluatedAtMs = parsedTime(context.evaluatedAt);
  const approvedAtMs = parsedTime(record.approvedAt);
  if (evaluatedAtMs < approvedAtMs) {
    return deny('approval_timestamp_invalid', 'evaluatedAt is earlier than approvedAt.');
  }

  if (record.expiresAt !== undefined) {
    if (!isValidAuthorizationTimestamp(record.expiresAt)) {
      return deny('approval_timestamp_invalid', 'expiresAt is not a valid ISO 8601 timestamp.');
    }
    const expiresAtMs = parsedTime(record.expiresAt);
    if (expiresAtMs <= approvedAtMs) {
      return deny('approval_timestamp_invalid', 'expiresAt is not later than approvedAt.');
    }
    if (evaluatedAtMs >= expiresAtMs) {
      return deny('approval_expired', 'Approval is expired at evaluation time.');
    }
  }

  if (record.consumedAt !== undefined) {
    if (!isValidAuthorizationTimestamp(record.consumedAt)) {
      return deny('approval_timestamp_invalid', 'consumedAt is not a valid ISO 8601 timestamp.');
    }
    if (record.oneTimeUse) {
      return deny('approval_consumed', 'One-time-use approval was already consumed.');
    }
  }

  if (!isValidAuthorizationScopeList(record.approvedScope)) {
    return deny('scope_mismatch', 'approvedScope is empty or contains an invalid entry.');
  }

  if (
    context.actionClass === 'modify_internal_record' &&
    containsGenericModifyInternalRecordScope(record.approvedScope)
  ) {
    return deny(
      'scope_mismatch',
      'Generic scope "modify_internal_record" is not a valid domain-scoped authorization.',
    );
  }

  for (const requested of context.requestedScope) {
    if (!scopeIsExactlyApproved(requested, record.approvedScope)) {
      return deny('scope_mismatch', `Requested scope "${requested}" is not exactly approved.`);
    }
  }

  return {
    allowed: true,
    reason: 'allowed',
    message: 'Action is authorized by a matching server-authoritative approval record.',
    approvalId: record.approvalId,
  };
}

/**
 * Deterministic, default-deny authorization. Gate order:
 *  1. record source must be server_authoritative
 *  2. context.agentKey must equal the agentKey argument
 *  3. context.actionClass must equal the actionClass argument
 *  4. agent must not be always prohibited from the action class
 *  5. agent must be permitted to request approval for the action class
 *  6. requestedScope must be a valid literal scope list (and, for
 *     modify_internal_record, must not contain the generic action-class literal)
 *  7. records filtered by action class
 *  8. records filtered by taskId
 *  9. records filtered by target entity type and id
 * 10. every remaining record evaluated; allow if any passes, else the highest
 *     precedence failure reason is returned
 */
export function validateApprovedCommercialAction(
  agentKey: CommercialAgentKey,
  actionClass: CommercialActionClass,
  context: DeterministicApprovalContext,
): CommercialAuthorizationResult {
  if (context.recordSource !== 'server_authoritative') {
    return deny('unverified_approval_source', 'Approval records are not server-authoritative.');
  }
  if (context.agentKey !== agentKey) {
    return deny('agent_action_prohibited', 'Context agentKey does not match the requesting agent.');
  }
  if (context.actionClass !== actionClass) {
    return deny('agent_action_prohibited', 'Context actionClass does not match the requested action.');
  }
  if (agentIsAlwaysProhibitedFrom(agentKey, actionClass)) {
    return deny('agent_action_prohibited', `${agentKey} is always prohibited from ${actionClass}.`);
  }
  if (!agentCanRequestApprovalFor(agentKey, actionClass)) {
    return deny(
      'agent_cannot_request_action',
      `${agentKey} may not request approval for ${actionClass}.`,
    );
  }
  if (!isValidAuthorizationScopeList(context.requestedScope)) {
    return deny('scope_mismatch', 'requestedScope is empty or contains an invalid entry.');
  }
  if (
    actionClass === 'modify_internal_record' &&
    containsGenericModifyInternalRecordScope(context.requestedScope)
  ) {
    return deny(
      'scope_mismatch',
      'Generic scope "modify_internal_record" is not a valid domain-scoped authorization.',
    );
  }

  const byActionClass = context.records.filter((record) => record.actionClass === actionClass);
  if (byActionClass.length === 0) {
    return deny('no_matching_approval', 'No approval record exists for this action class.');
  }

  const byTask = byActionClass.filter((record) => record.taskId === context.taskId);
  if (byTask.length === 0) {
    return deny('task_mismatch', 'No approval record matches this taskId.');
  }

  const byTarget = byTask.filter(
    (record) =>
      record.targetEntityType === context.targetEntityType &&
      record.targetEntityId === context.targetEntityId,
  );
  if (byTarget.length === 0) {
    return deny('target_mismatch', 'No approval record matches this target entity.');
  }

  const failures: CommercialAuthorizationResult[] = [];
  for (const record of byTarget) {
    const result = evaluateRecord(record, context);
    if (result.allowed) return result;
    failures.push(result);
  }

  for (const reason of RECORD_FAILURE_PRECEDENCE) {
    const match = failures.find((failure) => failure.reason === reason);
    if (match) return match;
  }

  return deny('no_matching_approval', 'No approval record authorized this action.');
}
