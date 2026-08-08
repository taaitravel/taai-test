/**
 * Gate 9A1-A commercial agent registry — DEFERRED CONTRACT ONLY.
 *
 * Imports only types from './types'. It must never import permission helpers,
 * COMMERCIAL_PERMISSIONS, or COMMERCIAL_ACTION_CLASSES from './permissions'
 * (permissions.ts imports this module; the reverse would create a cycle).
 *
 * No runtime, route, page, component, hook, edge function, or production
 * authorization flow consumes this registry.
 */
import type {
  CommercialActionClass,
  CommercialAgentDefinition,
  CommercialAgentKey,
  CommercialTaskType,
} from './types';
import { TAAI_AGENT_MANIFEST } from '../operating-system';

/** Local immutable list; intentionally NOT imported from permissions.ts. */
const READ_ANALYZE_DRAFT_EPHEMERAL: readonly CommercialActionClass[] = [
  'read',
  'analyze',
  'propose',
  'draft',
  'schedule_internal',
  'execute_internal_ephemeral',
] as const;

const baseAllowed = (): CommercialActionClass[] => [...READ_ANALYZE_DRAFT_EPHEMERAL];

export const COMMERCIAL_AGENT_REGISTRY: Record<CommercialAgentKey, CommercialAgentDefinition> = {
  ajax: {
    key: 'ajax',
    displayName: TAAI_AGENT_MANIFEST.ajax.name,
    permanentAgentNameApproved: true,
    internalOnly: true,
    mission:
      'Owner/admin conversational interface for requesting analysis, drafts, reports, and approval workflows.',
    ownerBoundary:
      'Ajax may request commercial work but does not bypass deterministic permissions or approvals.',
    allowedTaskTypes: [
      'crm_pipeline_review',
      'weekly_pipeline_report',
      'financial_kpi_snapshot',
      'financial_operations_summary',
      'traction_narrative',
    ],
    allowedWithoutApproval: baseAllowed(),
    requestableWithApproval: [
      'modify_internal_record',
      'send_external',
      'spend',
      'modify_financial_record',
      'grant_access',
    ],
    alwaysProhibited: ['production_change'],
    prohibitedWithoutApproval: [
      'send external communications',
      'spend money',
      'modify financial records',
      'grant data-room access',
      'modify durable internal records',
    ],
  },
  hermes: {
    key: 'hermes',
    displayName: TAAI_AGENT_MANIFEST.hermes.name,
    permanentAgentNameApproved: true,
    internalOnly: true,
    mission: 'Internal orchestration runtime for task-scoped, authorized commercial workflows.',
    ownerBoundary:
      'Hermes coordinates work, approvals, evidence, retries, and reporting but does not make independent business decisions.',
    allowedTaskTypes: [
      'investor_discovery',
      'investor_scoring',
      'financial_kpi_snapshot',
      'campaign_analytics',
      'crm_pipeline_review',
      'weekly_pipeline_report',
    ],
    allowedWithoutApproval: baseAllowed(),
    requestableWithApproval: [
      'modify_internal_record',
      'send_external',
      'spend',
      'modify_financial_record',
      'grant_access',
      'production_change',
    ],
    alwaysProhibited: [],
    prohibitedWithoutApproval: [
      'run unscoped workflows',
      'contact investors',
      'share assets externally',
      'change production systems',
      'modify durable internal records',
    ],
  },
  investor_intelligence_capability: {
    key: 'investor_intelligence_capability',
    displayName: 'Investor Intelligence Capability',
    permanentAgentNameApproved: false,
    internalOnly: true,
    mission:
      'Internal investor research, thesis matching, portfolio analysis, warm-path research, scoring, and briefing generation.',
    ownerBoundary:
      'Defined as an unnamed capability. No permanent agent name and no agent assignment exist until separately approved.',
    allowedTaskTypes: [
      'investor_discovery',
      'thesis_matching',
      'portfolio_analysis',
      'check_size_stage_qualification',
      'warm_path_research',
      'investor_scoring',
      'briefing_generation',
    ],
    allowedWithoutApproval: baseAllowed(),
    requestableWithApproval: ['modify_internal_record', 'send_external', 'grant_access'],
    alwaysProhibited: ['spend', 'modify_financial_record', 'production_change'],
    prohibitedWithoutApproval: [
      'contact investors',
      'send outreach',
      'claim warm introductions without evidence',
      'grant data-room access',
    ],
  },
  scott_marketing_growth: {
    key: 'scott_marketing_growth',
    displayName: `${TAAI_AGENT_MANIFEST.scott.name} / Marketing and Growth`,
    permanentAgentNameApproved: true,
    internalOnly: true,
    mission:
      'Internal growth, performance, campaign analysis, attribution, ICP, channel strategy, and traction narrative support.',
    ownerBoundary:
      'Scott may recommend campaign actions but may not launch, spend, alter budgets, bids, audiences, or statuses without approval.',
    allowedTaskTypes: [
      'icp_persona_analysis',
      'campaign_brief',
      'channel_strategy',
      'campaign_analytics',
      'waitlist_acquisition_analysis',
      'traction_narrative',
    ],
    allowedWithoutApproval: baseAllowed(),
    requestableWithApproval: ['modify_internal_record', 'send_external', 'spend'],
    alwaysProhibited: ['modify_financial_record', 'grant_access', 'production_change'],
    prohibitedWithoutApproval: [
      'launch campaigns',
      'modify campaign budgets',
      'modify bids or audiences',
      'publish traction claims externally',
    ],
  },
  manny_collateral: {
    key: 'manny_collateral',
    displayName: `${TAAI_AGENT_MANIFEST.manny.name} / Creative and Collateral`,
    permanentAgentNameApproved: true,
    internalOnly: true,
    mission:
      'Internal content, creative, pitch collateral, campaign collateral, and landing-page brief drafting.',
    ownerBoundary: 'Manny may draft collateral but may not publish or send externally without approval.',
    allowedTaskTypes: [
      'content_brief',
      'landing_page_brief',
      'campaign_brief',
      'traction_narrative',
      'briefing_generation',
    ],
    allowedWithoutApproval: baseAllowed(),
    requestableWithApproval: ['modify_internal_record', 'send_external'],
    alwaysProhibited: ['spend', 'modify_financial_record', 'grant_access', 'production_change'],
    prohibitedWithoutApproval: [
      'publish content',
      'send pitch collateral',
      'share data-room materials',
    ],
  },
  lester_finance_operations: {
    key: 'lester_finance_operations',
    displayName: `${TAAI_AGENT_MANIFEST.lester.name} / Finance Operations`,
    permanentAgentNameApproved: true,
    internalOnly: true,
    mission:
      'Internal financial operations, reconciliation, commissions, revenue-source reconciliation, and payment reporting.',
    ownerBoundary:
      'Lester owns finance operations only. FP&A, fundraising scenarios, use-of-funds planning, valuation assumptions, and investor financial summaries are NOT Lester tasks.',
    allowedTaskTypes: [
      'financial_operations_summary',
      'payment_reconciliation',
      'commission_reconciliation',
      'payment_reporting',
      'revenue_source_reconciliation',
    ],
    allowedWithoutApproval: baseAllowed(),
    requestableWithApproval: [
      'modify_internal_record',
      'modify_financial_record',
      'send_external',
    ],
    alwaysProhibited: ['spend', 'grant_access', 'production_change'],
    prohibitedWithoutApproval: [
      'modify financial records',
      'alter metric definitions for external reporting',
      'claim investor-grade metrics without source coverage',
      'share financial summaries externally',
    ],
  },
  fpna_investor_modeling_capability: {
    key: 'fpna_investor_modeling_capability',
    displayName: 'FP&A and Investor Modeling Capability',
    permanentAgentNameApproved: false,
    internalOnly: true,
    mission:
      'Internal FP&A and investor modeling: financial KPI snapshots, investor financial summaries, fundraising scenarios, use-of-funds plans, and valuation assumption summaries.',
    ownerBoundary:
      'Unnamed capability with no runtime authority. No permanent owner is assigned until separately approved.',
    allowedTaskTypes: [
      'financial_kpi_snapshot',
      'investor_financial_summary',
      'fundraising_scenario',
      'use_of_funds_plan',
      'valuation_assumption_summary',
    ],
    allowedWithoutApproval: baseAllowed(),
    requestableWithApproval: ['modify_internal_record'],
    alwaysProhibited: [
      'send_external',
      'spend',
      'modify_financial_record',
      'grant_access',
      'production_change',
    ],
    prohibitedWithoutApproval: [
      'share fundraising models externally',
      'commit to valuation or fundraising terms',
      'modify financial records',
      'publish investor-grade metrics without source coverage',
    ],
  },
  sales_ir_capability: {
    key: 'sales_ir_capability',
    displayName: 'Sales/IR Capability',
    permanentAgentNameApproved: false,
    internalOnly: true,
    mission:
      'Internal CRM pipeline, outreach draft, follow-up, meeting prep, objection handling, pitch/data-room coordination, and weekly pipeline reporting capability.',
    ownerBoundary:
      'Defined as a capability only; no permanent agent name is assigned until separately approved.',
    allowedTaskTypes: [
      'crm_pipeline_review',
      'outreach_draft',
      'follow_up_plan',
      'meeting_preparation',
      'objection_handling',
      'pitch_data_room_coordination',
      'weekly_pipeline_report',
    ],
    allowedWithoutApproval: baseAllowed(),
    requestableWithApproval: ['modify_internal_record', 'send_external', 'grant_access'],
    alwaysProhibited: ['spend', 'modify_financial_record', 'production_change'],
    prohibitedWithoutApproval: [
      'send outreach',
      'contact investors',
      'schedule external meetings',
      'grant data-room access',
    ],
  },
};

export const COMMERCIAL_AGENT_KEYS = Object.keys(COMMERCIAL_AGENT_REGISTRY) as CommercialAgentKey[];

export function getCommercialAgentDefinition(key: CommercialAgentKey): CommercialAgentDefinition {
  return COMMERCIAL_AGENT_REGISTRY[key];
}

export function agentSupportsTask(key: CommercialAgentKey, taskType: CommercialTaskType): boolean {
  return COMMERCIAL_AGENT_REGISTRY[key].allowedTaskTypes.includes(taskType);
}
