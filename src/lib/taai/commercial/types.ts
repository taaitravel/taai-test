/**
 * Gate 9A1-A commercial contracts — TYPE LEVEL ONLY.
 *
 * Deferred internal governance. These types are not wired to any runtime:
 * no routes, pages, components, hooks, edge functions, Ajax runtime, Hermes
 * runtime, Miles, Benny, Supabase operations, or production authorization
 * flows import them. Their presence does not authorize runtime use.
 *
 * Authorization inputs must eventually be loaded server-side from an
 * authoritative store. Client input, model output, conversation text, role
 * labels, and boolean flags never constitute approval.
 */

export type CommercialAgentKey =
  | 'ajax'
  | 'hermes'
  | 'investor_intelligence_capability'
  | 'scott_marketing_growth'
  | 'manny_collateral'
  | 'lester_finance_operations'
  | 'fpna_investor_modeling_capability'
  | 'sales_ir_capability';

export type CommercialTaskType =
  | 'investor_discovery'
  | 'thesis_matching'
  | 'portfolio_analysis'
  | 'check_size_stage_qualification'
  | 'warm_path_research'
  | 'investor_scoring'
  | 'briefing_generation'
  | 'financial_kpi_snapshot'
  | 'fundraising_scenario'
  | 'use_of_funds_plan'
  | 'valuation_assumption_summary'
  | 'investor_financial_summary'
  | 'financial_operations_summary'
  | 'payment_reconciliation'
  | 'commission_reconciliation'
  | 'payment_reporting'
  | 'revenue_source_reconciliation'
  | 'icp_persona_analysis'
  | 'campaign_brief'
  | 'content_brief'
  | 'landing_page_brief'
  | 'channel_strategy'
  | 'campaign_analytics'
  | 'waitlist_acquisition_analysis'
  | 'traction_narrative'
  | 'crm_pipeline_review'
  | 'outreach_draft'
  | 'follow_up_plan'
  | 'meeting_preparation'
  | 'objection_handling'
  | 'pitch_data_room_coordination'
  | 'weekly_pipeline_report';

/**
 * `execute_internal` is removed. It conflated ephemeral internal work with
 * durable internal record mutation.
 *
 * - `execute_internal_ephemeral`: internal analysis/artifact generation with no
 *   durable record change. May be allowed without approval when task-scoped.
 * - `modify_internal_record`: durable internal record change. Always requires
 *   deterministic, domain-scoped approval.
 */
export type CommercialActionClass =
  | 'read'
  | 'analyze'
  | 'propose'
  | 'draft'
  | 'schedule_internal'
  | 'execute_internal_ephemeral'
  | 'modify_internal_record'
  | 'send_external'
  | 'spend'
  | 'modify_financial_record'
  | 'grant_access'
  | 'production_change';

export type CommercialConsequentialAction =
  | 'publish_content'
  | 'publish_application'
  | 'deploy'
  | 'apply_migration'
  | 'rotate_secrets'
  | 'launch_campaign';

/** Whether an action class needs approval at all. */
export type CommercialApprovalRequirementStatus = 'not_required' | 'required';

/** Lifecycle state of a concrete approval record. */
export type CommercialApprovalRecordStatus =
  | 'requested'
  | 'approved'
  | 'denied'
  | 'expired'
  | 'revoked';

export type DataQualityStatus =
  | 'verified'
  | 'partial'
  | 'stale'
  | 'missing'
  | 'conflicting'
  | 'manual'
  | 'mock_excluded';

export type CommercialEvidenceSource = {
  source: string;
  sourceType:
    | 'supabase'
    | 'stripe'
    | 'google_workspace'
    | 'monday'
    | 'github'
    | 'manual'
    | 'public_web'
    | 'internal_document'
    | 'analytics'
    | 'other';
  capturedAt: string;
  /** Optional: unverified evidence must not be presented as verified. */
  verifiedAt?: string;
  /** 0-1 inclusive, finite. */
  confidence: number;
  dataQualityStatus: DataQualityStatus;
  knownExclusions: string[];
  responsibleAgentOrPerson: string;
};

export type InvestorOrganizationType =
  | 'angel'
  | 'seed_fund'
  | 'venture_capital'
  | 'family_office'
  | 'strategic'
  | 'accelerator'
  | 'corporate_venture'
  | 'syndicate'
  | 'other';

export type InvestorPipelineStage =
  | 'target'
  | 'researched'
  | 'qualified'
  | 'priority'
  | 'drafted'
  | 'approval_requested'
  | 'approved_to_contact'
  | 'contacted'
  | 'meeting'
  | 'diligence'
  | 'passed'
  | 'committed'
  | 'closed';

export type FundStageFocus =
  | 'pre_seed'
  | 'seed'
  | 'seed_plus'
  | 'series_a'
  | 'series_b'
  | 'growth'
  | 'multi_stage'
  | 'unknown';

export type RelationshipPathType =
  | 'direct'
  | 'warm_intro'
  | 'shared_company'
  | 'shared_investor'
  | 'advisor'
  | 'operator_network'
  | 'public_contact'
  | 'unknown';

export type CommercialPermission = {
  actionClass: CommercialActionClass;
  allowedWithoutApproval: boolean;
  requiresDeterministicApproval: boolean;
  notes: string;
};

export type CommercialArtifactType =
  | 'investor_target_list'
  | 'investor_score'
  | 'investor_brief'
  | 'outreach_draft'
  | 'meeting_brief'
  | 'follow_up_plan'
  | 'weekly_pipeline_report'
  | 'financial_snapshot'
  | 'financial_metric_definition'
  | 'fundraising_scenario'
  | 'use_of_funds_plan'
  | 'valuation_assumption_summary'
  | 'campaign_brief'
  | 'content_brief'
  | 'landing_page_brief'
  | 'traction_narrative'
  | 'data_room_asset_metadata'
  | 'approval_request';

export type PiiClassification =
  | 'none'
  | 'business_contact'
  | 'confidential_company'
  | 'traveler_personal'
  | 'sensitive_traveler'
  | 'payment_sensitive';

export type CommercialTargetEntityType =
  | 'commercial_agent_task'
  | 'fundraising_round'
  | 'fundraising_opportunity'
  | 'fundraising_interaction'
  | 'fundraising_task'
  | 'outreach_draft'
  | 'investor_organization'
  | 'investor_contact'
  | 'campaign'
  | 'content_asset'
  | 'financial_record'
  | 'reconciliation_record'
  | 'data_room_asset'
  | 'production_resource';

/** Every action class is partitioned exactly once across the three lists. */
export type CommercialAgentDefinition = {
  key: CommercialAgentKey;
  displayName: string;
  permanentAgentNameApproved: boolean;
  internalOnly: true;
  mission: string;
  ownerBoundary: string;
  allowedTaskTypes: CommercialTaskType[];
  allowedWithoutApproval: CommercialActionClass[];
  requestableWithApproval: CommercialActionClass[];
  alwaysProhibited: CommercialActionClass[];
  prohibitedWithoutApproval: string[];
};

export type MoneyAmount = {
  amount: number;
  /** ISO 4217 code. No implicit FX conversion is performed anywhere. */
  currency: string;
};

export type InvestorOrganizationContract = {
  id: string;
  name: string;
  organizationType: InvestorOrganizationType;
  website?: string;
  geographyFocus: string[];
  sectorFocus: string[];
  evidence: CommercialEvidenceSource[];
  piiClassification: PiiClassification;
};

export type InvestorContactContract = {
  id: string;
  investorOrganizationId: string;
  name: string;
  title?: string;
  publicProfileUrl?: string;
  emailReference?: string;
  piiClassification: PiiClassification;
  relationshipPathType: RelationshipPathType;
  evidence: CommercialEvidenceSource[];
};

export type FundContract = {
  id: string;
  investorOrganizationId: string;
  name: string;
  stageFocus: FundStageFocus[];
  checkSizeMinimum?: MoneyAmount;
  checkSizeMaximum?: MoneyAmount;
  fundSize?: MoneyAmount;
  leadOrFollow?: 'lead' | 'follow' | 'either' | 'unknown';
  evidence: CommercialEvidenceSource[];
};

export type InvestorScoreContract = {
  investorOrganizationId: string;
  fundId?: string;
  totalScore: number;
  thesisScore: number;
  stageScore: number;
  checkSizeScore: number;
  portfolioFitScore: number;
  warmPathScore: number;
  strategicValueScore: number;
  riskScore: number;
  explanation: string;
  evidence: CommercialEvidenceSource[];
  dataQualityStatus: DataQualityStatus;
};

export type FinancialKpiContract = {
  name: string;
  formula: string;
  sourceTables: string[];
  sourceFields: string[];
  period: string;
  refreshCadence: string;
  owner: CommercialAgentKey | 'marco' | 'unassigned';
  dataQualityState: DataQualityStatus;
  knownExclusions: string[];
  lastVerifiedAt: string;
};

export type CommercialApprovalRequirement = {
  actionClass: CommercialActionClass;
  targetEntityType: CommercialTargetEntityType;
  status: CommercialApprovalRequirementStatus;
  approver: 'marco' | 'authorized_delegate' | 'not_applicable';
  requiredCompletionEvidence: string[];
  oneTimeUse: boolean;
};

/**
 * A durable approval record. Absent `expiresAt` grants no broader authority:
 * the approval remains constrained by exact task, action class, target,
 * approved scope, revocation, record source, agent permissions, and
 * one-time-use consumption.
 */
export type CommercialApprovalRecord = {
  approvalId: string;
  taskId: string;
  requester: string;
  approver: 'marco' | 'authorized_delegate';
  actionClass: CommercialActionClass;
  targetEntityType: CommercialTargetEntityType;
  targetEntityId: string;
  /** Literal, case-sensitive, domain-scoped values. No wildcards. */
  approvedScope: string[];
  status: CommercialApprovalRecordStatus;
  /** ISO 8601 with explicit Z or numeric offset. */
  approvedAt?: string;
  expiresAt?: string;
  revokedAt?: string;
  revokedReason?: string;
  consumedAt?: string;
  oneTimeUse: boolean;
  requiredCompletionEvidence: string[];
};

/**
 * Deterministic authorization input. `records` must originate from a
 * server-authoritative store; conversation history, prior assistant text, and
 * client assertions are never authorization.
 */
export type DeterministicApprovalContext = {
  taskId: string;
  agentKey: CommercialAgentKey;
  actionClass: CommercialActionClass;
  targetEntityType: CommercialTargetEntityType;
  targetEntityId: string;
  /** Complete literal scope values required for this action. */
  requestedScope: string[];
  records: CommercialApprovalRecord[];
  /** ISO 8601 with explicit Z or numeric offset. */
  evaluatedAt: string;
  recordSource: 'server_authoritative' | 'unverified';
};

export type CommercialAuthorizationReason =
  | 'allowed'
  | 'unverified_approval_source'
  | 'agent_action_prohibited'
  | 'agent_cannot_request_action'
  | 'no_matching_approval'
  | 'task_mismatch'
  | 'target_mismatch'
  | 'approval_revoked'
  | 'approval_expired'
  | 'approval_consumed'
  | 'approval_timestamp_missing'
  | 'approval_timestamp_invalid'
  | 'approval_not_approved'
  | 'scope_mismatch';

export type CommercialAuthorizationResult = {
  allowed: boolean;
  reason: CommercialAuthorizationReason;
  message: string;
  approvalId?: string;
};

export type CommercialPermissionPartitionResult = {
  agentKey: CommercialAgentKey;
  missing: CommercialActionClass[];
  duplicates: CommercialActionClass[];
  valid: boolean;
};

export type CommercialTaskEnvelope = {
  taskId: string;
  objective: string;
  requesterId: string;
  requestedBy: 'marco' | 'authorized_delegate';
  agentKey: CommercialAgentKey;
  taskType: CommercialTaskType;
  sourceSystems: string[];
  permittedActions: CommercialActionClass[];
  prohibitedActions: CommercialActionClass[];
  approvalRequirements: CommercialApprovalRequirement[];
  requiredArtifactTypes: CommercialArtifactType[];
  successCriteria: string[];
  requiredCompletionEvidence: string[];
  minimumDataQuality: DataQualityStatus;
  createdAt: string;
};
