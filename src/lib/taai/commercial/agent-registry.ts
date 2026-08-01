import type {
  CommercialActionClass,
  CommercialAgentDefinition,
  CommercialAgentKey,
  CommercialTaskType,
} from './types';

const commonReadAnalyzeDraftActions: CommercialActionClass[] = [
  'read',
  'analyze',
  'propose',
  'draft',
  'schedule_internal',
];

const approvalRequiredActions: CommercialActionClass[] = [
  'execute_internal',
  'send_external',
  'spend',
  'modify_financial_record',
  'grant_access',
  'production_change',
];

export const COMMERCIAL_AGENT_REGISTRY: Record<CommercialAgentKey, CommercialAgentDefinition> = {
  ajax: {
    key: 'ajax',
    displayName: 'Ajax',
    permanentAgentNameApproved: true,
    internalOnly: true,
    mission: 'Owner/admin conversational interface for requesting analysis, drafts, reports, and approval workflows.',
    ownerBoundary: 'Ajax may request commercial work but does not bypass deterministic permissions or approvals.',
    allowedTaskTypes: [
      'crm_pipeline_review',
      'weekly_pipeline_report',
      'financial_kpi_snapshot',
      'investor_financial_summary',
      'traction_narrative',
    ],
    allowedActionClasses: commonReadAnalyzeDraftActions,
    approvalRequiredActionClasses: approvalRequiredActions,
    prohibitedWithoutApproval: [
      'send external communications',
      'spend money',
      'modify financial records',
      'grant data-room access',
      'deploy or publish',
    ],
  },
  hermes: {
    key: 'hermes',
    displayName: 'Hermes',
    permanentAgentNameApproved: true,
    internalOnly: true,
    mission: 'Internal orchestration runtime for task-scoped, authorized commercial workflows.',
    ownerBoundary: 'Hermes coordinates work, approvals, evidence, retries, and reporting but does not make independent business decisions.',
    allowedTaskTypes: [
      'investor_discovery',
      'investor_scoring',
      'financial_kpi_snapshot',
      'campaign_analytics',
      'crm_pipeline_review',
      'weekly_pipeline_report',
    ],
    allowedActionClasses: [...commonReadAnalyzeDraftActions, 'execute_internal'],
    approvalRequiredActionClasses: approvalRequiredActions,
    prohibitedWithoutApproval: [
      'run unscoped workflows',
      'contact investors',
      'share assets externally',
      'change production systems',
    ],
  },
  scout_investor_intelligence: {
    key: 'scout_investor_intelligence',
    displayName: 'Scout / Investor Intelligence',
    permanentAgentNameApproved: true,
    internalOnly: true,
    mission: 'Internal investor research, thesis matching, portfolio analysis, warm-path research, scoring, and briefing generation.',
    ownerBoundary: 'Scout research may expand to investor intelligence only when internal, evidence-backed, and approval-gated for external use.',
    allowedTaskTypes: [
      'investor_discovery',
      'thesis_matching',
      'portfolio_analysis',
      'check_size_stage_qualification',
      'warm_path_research',
      'investor_scoring',
      'briefing_generation',
    ],
    allowedActionClasses: commonReadAnalyzeDraftActions,
    approvalRequiredActionClasses: approvalRequiredActions,
    prohibitedWithoutApproval: [
      'contact investors',
      'send outreach',
      'claim warm introductions without evidence',
      'grant data-room access',
    ],
  },
  scott_marketing_growth: {
    key: 'scott_marketing_growth',
    displayName: 'Scott / Marketing and Growth',
    permanentAgentNameApproved: true,
    internalOnly: true,
    mission: 'Internal growth, performance, campaign analysis, attribution, ICP, channel strategy, and traction narrative support.',
    ownerBoundary: 'Scott may recommend campaign actions but may not launch, spend, alter budgets, bids, audiences, or statuses without approval.',
    allowedTaskTypes: [
      'icp_persona_analysis',
      'campaign_brief',
      'channel_strategy',
      'campaign_analytics',
      'waitlist_acquisition_analysis',
      'traction_narrative',
    ],
    allowedActionClasses: commonReadAnalyzeDraftActions,
    approvalRequiredActionClasses: approvalRequiredActions,
    prohibitedWithoutApproval: [
      'launch campaigns',
      'modify campaign budgets',
      'modify bids or audiences',
      'publish traction claims externally',
    ],
  },
  manny_collateral: {
    key: 'manny_collateral',
    displayName: 'Manny / Creative and Collateral',
    permanentAgentNameApproved: true,
    internalOnly: true,
    mission: 'Internal content, creative, pitch collateral, campaign collateral, and landing-page brief drafting.',
    ownerBoundary: 'Manny may draft collateral but may not publish or send externally without approval.',
    allowedTaskTypes: [
      'content_brief',
      'landing_page_brief',
      'campaign_brief',
      'traction_narrative',
      'briefing_generation',
    ],
    allowedActionClasses: commonReadAnalyzeDraftActions,
    approvalRequiredActionClasses: approvalRequiredActions,
    prohibitedWithoutApproval: [
      'publish content',
      'send pitch collateral',
      'share data-room materials',
    ],
  },
  lester_finance_operations: {
    key: 'lester_finance_operations',
    displayName: 'Lester / Finance Operations',
    permanentAgentNameApproved: true,
    internalOnly: true,
    mission: 'Internal financial operations, reconciliation, commissions, and payment reporting.',
    ownerBoundary: 'Lester is not automatically the FP&A or investor-modeling owner; that boundary remains deferred for approval.',
    allowedTaskTypes: [
      'financial_kpi_snapshot',
      'investor_financial_summary',
      'fundraising_scenario',
      'use_of_funds_plan',
      'valuation_assumption_summary',
    ],
    allowedActionClasses: commonReadAnalyzeDraftActions,
    approvalRequiredActionClasses: approvalRequiredActions,
    prohibitedWithoutApproval: [
      'modify financial records',
      'alter metric definitions for external reporting',
      'claim investor-grade metrics without source coverage',
      'share financial summaries externally',
    ],
  },
  sales_ir_capability: {
    key: 'sales_ir_capability',
    displayName: 'Sales/IR Capability',
    permanentAgentNameApproved: false,
    internalOnly: true,
    mission: 'Internal CRM pipeline, outreach draft, follow-up, meeting prep, objection handling, pitch/data-room coordination, and weekly pipeline reporting capability.',
    ownerBoundary: 'Defined as a capability only; no permanent agent name is assigned until separately approved.',
    allowedTaskTypes: [
      'crm_pipeline_review',
      'outreach_draft',
      'follow_up_plan',
      'meeting_preparation',
      'objection_handling',
      'pitch_data_room_coordination',
      'weekly_pipeline_report',
    ],
    allowedActionClasses: commonReadAnalyzeDraftActions,
    approvalRequiredActionClasses: approvalRequiredActions,
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
