export type CommercialAgentKey =
  | 'ajax'
  | 'hermes'
  | 'scout_investor_intelligence'
  | 'scott_marketing_growth'
  | 'manny_collateral'
  | 'lester_finance_operations'
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

export type CommercialActionClass =
  | 'read'
  | 'analyze'
  | 'propose'
  | 'draft'
  | 'schedule_internal'
  | 'execute_internal'
  | 'send_external'
  | 'spend'
  | 'modify_financial_record'
  | 'grant_access'
  | 'production_change';

export type CommercialApprovalStatus =
  | 'not_required'
  | 'required'
  | 'requested'
  | 'approved'
  | 'denied'
  | 'expired'
  | 'revoked';

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
  verifiedAt: string;
  confidence: number;
  dataQualityStatus: DataQualityStatus;
  knownExclusions: string[];
  responsibleAgentOrPerson: string;
};

export type DataQualityStatus =
  | 'verified'
  | 'partial'
  | 'stale'
  | 'missing'
  | 'conflicting'
  | 'manual'
  | 'mock_excluded';

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

export type CommercialAgentDefinition = {
  key: CommercialAgentKey;
  displayName: string;
  permanentAgentNameApproved: boolean;
  internalOnly: true;
  mission: string;
  ownerBoundary: string;
  allowedTaskTypes: CommercialTaskType[];
  allowedActionClasses: CommercialActionClass[];
  approvalRequiredActionClasses: CommercialActionClass[];
  prohibitedWithoutApproval: string[];
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
  checkSizeMinimumUsd?: number;
  checkSizeMaximumUsd?: number;
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
  status: CommercialApprovalStatus;
  approver: 'marco' | 'authorized_delegate' | 'not_applicable';
  approvalEvidenceRequired: string[];
};
