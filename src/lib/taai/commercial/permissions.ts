import type {
  CommercialActionClass,
  CommercialAgentKey,
  CommercialPermission,
} from './types';

export const COMMERCIAL_ACTION_CLASSES: CommercialActionClass[] = [
  'read',
  'analyze',
  'propose',
  'draft',
  'schedule_internal',
  'execute_internal',
  'send_external',
  'spend',
  'modify_financial_record',
  'grant_access',
  'production_change',
];

export const APPROVAL_REQUIRED_ACTION_CLASSES: CommercialActionClass[] = [
  'send_external',
  'spend',
  'modify_financial_record',
  'grant_access',
  'production_change',
];

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
  execute_internal: {
    actionClass: 'execute_internal',
    allowedWithoutApproval: false,
    requiresDeterministicApproval: true,
    notes: 'Requires approval when the internal action is consequential or changes durable records.',
  },
  send_external: {
    actionClass: 'send_external',
    allowedWithoutApproval: false,
    requiresDeterministicApproval: true,
    notes: 'Covers email, messages, investor outreach, partner/customer communications, and external scheduling.',
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

export const AGENT_ACTION_ALLOWLIST: Record<CommercialAgentKey, CommercialActionClass[]> = {
  ajax: ['read', 'analyze', 'propose', 'draft', 'schedule_internal'],
  hermes: ['read', 'analyze', 'propose', 'draft', 'schedule_internal', 'execute_internal'],
  scout_investor_intelligence: ['read', 'analyze', 'propose', 'draft', 'schedule_internal'],
  scott_marketing_growth: ['read', 'analyze', 'propose', 'draft', 'schedule_internal'],
  manny_collateral: ['read', 'analyze', 'propose', 'draft', 'schedule_internal'],
  lester_finance_operations: ['read', 'analyze', 'propose', 'draft', 'schedule_internal'],
  sales_ir_capability: ['read', 'analyze', 'propose', 'draft', 'schedule_internal'],
};

export function actionRequiresApproval(actionClass: CommercialActionClass): boolean {
  return COMMERCIAL_PERMISSIONS[actionClass].requiresDeterministicApproval;
}

export function agentCanRequestAction(
  agentKey: CommercialAgentKey,
  actionClass: CommercialActionClass,
): boolean {
  return AGENT_ACTION_ALLOWLIST[agentKey].includes(actionClass);
}

export function assertCommercialActionAllowed(
  agentKey: CommercialAgentKey,
  actionClass: CommercialActionClass,
  hasDeterministicApproval: boolean,
): { allowed: boolean; reason: string } {
  if (!agentCanRequestAction(agentKey, actionClass)) {
    return {
      allowed: false,
      reason: `${agentKey} is not permitted to request ${actionClass}.`,
    };
  }

  if (actionRequiresApproval(actionClass) && !hasDeterministicApproval) {
    return {
      allowed: false,
      reason: `${actionClass} requires deterministic approval before execution.`,
    };
  }

  return {
    allowed: true,
    reason: 'Action is permitted within the scoped commercial contract.',
  };
}
