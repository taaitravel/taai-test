/**
 * TAAI operating-system manifest.
 *
 * This is the application-facing source of truth for architectural layers,
 * agent identity, ownership, visibility, and approval boundaries. Product
 * surfaces must consume this manifest instead of maintaining local rosters.
 */

export type ImplementationStatus = 'current' | 'partial' | 'planned' | 'conceptual';

export type ArchitectureLayerKey =
  | 'identity'
  | 'experience'
  | 'commerce'
  | 'orchestration'
  | 'knowledge'
  | 'observability'
  | 'intelligence'
  | 'executive'
  | 'finance'
  | 'security'
  | 'platform'
  | 'growth';

export interface ArchitectureComponent {
  key: string;
  name: string;
  status: ImplementationStatus;
  summary: string;
}

export interface ArchitectureLayer {
  key: ArchitectureLayerKey;
  order: number;
  name: string;
  status: ImplementationStatus;
  summary: string;
  components: readonly ArchitectureComponent[];
}

export const ARCHITECTURE_VERSION = '2026.08.08-v1' as const;

export const TAAI_ARCHITECTURE_LAYERS: readonly ArchitectureLayer[] = [
  {
    key: 'identity',
    order: 1,
    name: 'Traveler Identity',
    status: 'partial',
    summary: 'Identity, authentication, profiles, permissions, consent, and future Travel DNA.',
    components: [
      { key: 'taai-id', name: 'taai.ID', status: 'partial', summary: 'Identity product boundary exists across profiles and preferences but is not yet unified.' },
      { key: 'supabase-auth', name: 'Supabase Auth', status: 'current', summary: 'Sessions, protected routes, roles, and admin checks.' },
    ],
  },
  {
    key: 'experience',
    order: 2,
    name: 'Traveler Experience',
    status: 'current',
    summary: 'Traveler web surfaces, app chrome, Miles, and planning-only Bob.',
    components: [
      { key: 'web-app', name: 'Web / mobile web app', status: 'current', summary: 'Search, itinerary, cart, checkout, profile, subscriptions, and support surfaces.' },
      { key: 'global-chrome', name: 'Global app chrome', status: 'current', summary: 'Navigation, drawers, page context, mobile actions, and notifications.' },
      { key: 'miles', name: 'Miles', status: 'partial', summary: 'General traveler companion and itinerary-aware concierge.' },
      { key: 'bob', name: 'Bob', status: 'partial', summary: 'Traveler-facing Create Itinerary planning specialist.' },
    ],
  },
  {
    key: 'commerce',
    order: 3,
    name: 'Booking & Commerce',
    status: 'partial',
    summary: 'Business rules, quotes, checkout, provider truth, payment truth, and bookings.',
    components: [
      { key: 'nucleus', name: 'taai_Nucleus', status: 'partial', summary: 'Rules exist across application and database code; a unified rule service is planned.' },
      { key: 'cart-checkout', name: 'Cart / Checkout', status: 'current', summary: 'Traveler checkout and booking contract surfaces.' },
      { key: 'providers', name: 'External booking providers', status: 'partial', summary: 'Provider adapters exist with uneven inventory and booking evidence coverage.' },
    ],
  },
  {
    key: 'orchestration',
    order: 4,
    name: 'AI Orchestration',
    status: 'planned',
    summary: 'Hermes routes work to Ajax and internal specialist lanes with evidence and approvals.',
    components: [
      { key: 'hermes', name: 'Hermes', status: 'partial', summary: 'Task, route, approval, and evidence foundation is defined; autonomous runtime remains planned.' },
      { key: 'ajax', name: 'Ajax', status: 'planned', summary: 'Internal commercial and operational operator.' },
      { key: 'specialists', name: 'Internal specialist lanes', status: 'partial', summary: 'Shared role contracts are current; Tom is the first operational lane.' },
    ],
  },
  {
    key: 'knowledge',
    order: 5,
    name: 'Knowledge & Data',
    status: 'partial',
    summary: 'Operational database, documents, and the future relationship graph.',
    components: [
      { key: 'atlas', name: 'taai_Atlas', status: 'planned', summary: 'Traveler, trip, supplier, agent, campaign, and support relationship graph.' },
      { key: 'supabase-db', name: 'Supabase Database', status: 'current', summary: 'Primary application data and row-level security.' },
      { key: 'documents', name: 'Document knowledge', status: 'partial', summary: 'Specs and operating material exist but retrieval and validation are not unified.' },
    ],
  },
  {
    key: 'observability',
    order: 6,
    name: 'Events & Observability',
    status: 'partial',
    summary: 'Product, booking, payment, agent, error, and user-behavior signals.',
    components: [
      { key: 'minerva', name: 'taai.Minerva', status: 'planned', summary: 'Unified observability backbone and canonical event catalog.' },
      { key: 'analytics-events', name: 'Analytics events', status: 'partial', summary: 'Event fragments exist; lifecycle coverage and naming need consolidation.' },
      { key: 'external-tracking', name: 'External tracking', status: 'partial', summary: 'Client tracking exists; server-side conversion coverage remains planned.' },
    ],
  },
  {
    key: 'intelligence',
    order: 7,
    name: 'Intelligence & Reporting',
    status: 'partial',
    summary: 'BI, forecasting, revenue, funnel, cohort, booking, and agent reporting.',
    components: [
      { key: 'athena', name: 'taai.Athena', status: 'planned', summary: 'Unified BI, forecasting, and strategic-insight layer.' },
      { key: 'dashboards', name: 'Operational dashboards', status: 'partial', summary: 'Business metrics exist; functional dashboards need expansion.' },
    ],
  },
  {
    key: 'executive',
    order: 8,
    name: 'Executive Operating',
    status: 'partial',
    summary: 'taai_IQ command, strategy, roadmap, decisions, KPIs, and Internal TOS.',
    components: [
      { key: 'taai-iq', name: 'taai_IQ', status: 'partial', summary: 'Admin command surfaces exist; layered navigation and agent operations are being established.' },
      { key: 'internal-tos', name: 'Internal TOS', status: 'current', summary: 'Responsibility, visibility, approval, risk, and directional architecture contract.' },
    ],
  },
  {
    key: 'finance',
    order: 9,
    name: 'Finance',
    status: 'partial',
    summary: 'Payment, refund, commission, fee, payable, reconciliation, and margin truth.',
    components: [
      { key: 'ledger', name: 'taai_Ledger', status: 'partial', summary: 'Financial records exist across booking tables; the unified ledger boundary is planned.' },
      { key: 'stripe', name: 'Stripe', status: 'current', summary: 'Checkout, payment, webhook, refund, and subscription platform.' },
      { key: 'accounting', name: 'Accounting operations', status: 'planned', summary: 'CPA exports, reconciliation, tax support, and revenue recognition.' },
    ],
  },
  {
    key: 'security',
    order: 10,
    name: 'Security & Control',
    status: 'partial',
    summary: 'Secrets, RLS, identity checks, and human approval gates for consequential actions.',
    components: [
      { key: 'vault', name: 'taai_Vault', status: 'conceptual', summary: 'Unified secret, credential, access-policy, and rotation-log product boundary.' },
      { key: 'rls', name: 'Supabase RLS', status: 'current', summary: 'Database access controls and traveler-data isolation.' },
      { key: 'approvals', name: 'Approval gates', status: 'partial', summary: 'Policy is current; task-level durable approvals are the next implementation foundation.' },
    ],
  },
  {
    key: 'platform',
    order: 11,
    name: 'Platform & Tooling',
    status: 'current',
    summary: 'Lovable, GitHub, local runtime, Supabase, Stripe, workspace, and design tools.',
    components: [
      { key: 'delivery-tooling', name: 'Delivery tooling', status: 'current', summary: 'Lovable, GitHub, local development, Supabase, and Stripe.' },
      { key: 'business-tooling', name: 'Business tooling', status: 'partial', summary: 'Workspace, CRM, automation, and design integrations are uneven.' },
      { key: 'native-mobile', name: 'Native mobile', status: 'planned', summary: 'Capacitor foundation exists; store distribution and native services remain planned.' },
    ],
  },
  {
    key: 'growth',
    order: 12,
    name: 'Growth & Commercial',
    status: 'partial',
    summary: 'Marketing, sales, partnerships, investor operations, and company growth.',
    components: [
      { key: 'marketing', name: 'Marketing channels', status: 'partial', summary: 'Organic, paid, email, referral, and attribution operations.' },
      { key: 'partnerships', name: 'Sales & partnerships', status: 'partial', summary: 'Suppliers, travel partners, organizers, corporate accounts, and affiliates.' },
      { key: 'company', name: 'Investor & company operations', status: 'partial', summary: 'Updates, pitch materials, funding pipeline, KPIs, and strategic partnerships.' },
    ],
  },
] as const;

export type AgentKey =
  | 'miles'
  | 'bob'
  | 'hermes'
  | 'ajax'
  | 'tom'
  | 'scott'
  | 'manny'
  | 'benny'
  | 'piper'
  | 'lester'
  | 'scout';

export type AgentVisibility = 'traveler' | 'contextual' | 'internal';

export interface AgentRole {
  key: AgentKey;
  name: string;
  role: string;
  layer: ArchitectureLayerKey;
  status: ImplementationStatus;
  visibility: AgentVisibility;
  travelerFacing: boolean;
  allowedSurfaces: readonly string[];
  summary: string;
  owns: readonly string[];
  can: readonly string[];
  cannot: readonly string[];
  approvalRequired: readonly string[];
}

const INTERNAL_STATE_BOUNDARY = [
  'Execute state-changing actions without Security / Control approval',
  'Claim payment or provider confirmation without system-of-record evidence',
] as const;

export const TAAI_AGENT_MANIFEST: Record<AgentKey, AgentRole> = {
  miles: {
    key: 'miles', name: 'Miles', role: 'Traveler companion', layer: 'experience', status: 'partial',
    visibility: 'traveler', travelerFacing: true, allowedSurfaces: ['traveler', 'itinerary', 'support'],
    summary: 'General traveler-facing companion for concierge help, trip context, and support guidance.',
    owns: ['Concierge interaction', 'Contextual itinerary help', 'General traveler assistance'],
    can: ['Recommend and explain options', 'Read permitted itinerary context', 'Draft traveler choices'],
    cannot: ['Own the Create Itinerary planning conversation', ...INTERNAL_STATE_BOUNDARY],
    approvalRequired: ['Cart-to-checkout escalation', 'External notifications', 'Provider or payment actions'],
  },
  bob: {
    key: 'bob', name: 'Bob', role: 'Create Itinerary specialist', layer: 'experience', status: 'partial',
    visibility: 'contextual', travelerFacing: true, allowedSurfaces: ['create-itinerary'],
    summary: 'Traveler-facing only inside Create Itinerary for destination, date, budget, and trip-plan interpretation.',
    owns: ['Create Itinerary conversation', 'Planning revisions', 'Itinerary-building guidance'],
    can: ['Interpret destinations, dates, budgets, and travelers', 'Draft flights, stays, activities, and notes'],
    cannot: ['Appear as the general concierge outside planning', ...INTERNAL_STATE_BOUNDARY],
    approvalRequired: ['Saving a traveler plan', 'Cart or checkout escalation', 'Provider or payment actions'],
  },
  hermes: {
    key: 'hermes', name: 'Hermes', role: 'Workflow orchestrator', layer: 'orchestration', status: 'partial',
    visibility: 'internal', travelerFacing: false, allowedSurfaces: ['taai-iq', 'internal'],
    summary: 'Routes scoped work, records steps and evidence, coordinates retries, and requests approvals.',
    owns: ['Task routing', 'Workflow state', 'Evidence chain', 'Approval requests'],
    can: ['Route tasks', 'Coordinate specialist work', 'Record evidence and status'],
    cannot: ['Approve its own consequential actions', ...INTERNAL_STATE_BOUNDARY],
    approvalRequired: ['Durable mutations', 'Deployments', 'External communications', 'Payments and provider actions'],
  },
  ajax: {
    key: 'ajax', name: 'Ajax', role: 'Internal commercial operator', layer: 'orchestration', status: 'planned',
    visibility: 'internal', travelerFacing: false, allowedSurfaces: ['taai-iq', 'internal'],
    summary: 'Internal commercial and operational operator for sales, planning automation, revenue opportunities, and follow-up.',
    owns: ['Commercial operations', 'Lead and account routing', 'Revenue opportunity follow-up'],
    can: ['Analyze pipelines', 'Draft internal and external work', 'Request scoped workflows'],
    cannot: INTERNAL_STATE_BOUNDARY,
    approvalRequired: ['External communications', 'Durable record changes', 'Spend and production changes'],
  },
  tom: {
    key: 'tom', name: 'Tom', role: 'Engineering & technical QA', layer: 'orchestration', status: 'partial',
    visibility: 'internal', travelerFacing: false, allowedSurfaces: ['taai-iq', 'engineering'],
    summary: 'First internal specialist lane for engineering triage, bug review, product fixes, code planning, and technical QA.',
    owns: ['Engineering triage', 'Bug review', 'Code-change planning', 'Technical QA evidence'],
    can: ['Analyze defects', 'Propose fixes', 'Prepare test plans', 'Record code and QA evidence'],
    cannot: INTERNAL_STATE_BOUNDARY,
    approvalRequired: ['Code mutation', 'Migrations', 'Deployments', 'Production configuration changes'],
  },
  scott: {
    key: 'scott', name: 'Scott', role: 'Growth & performance', layer: 'orchestration', status: 'planned',
    visibility: 'internal', travelerFacing: false, allowedSurfaces: ['taai-iq', 'growth'],
    summary: 'Growth strategy, performance marketing, funnel review, campaign optimization, and acquisition experiments.',
    owns: ['Growth strategy', 'Funnels', 'Campaign performance'], can: ['Analyze performance', 'Propose experiments'],
    cannot: INTERNAL_STATE_BOUNDARY, approvalRequired: ['Campaign launch', 'Budget or audience changes', 'External publishing'],
  },
  manny: {
    key: 'manny', name: 'Manny', role: 'Content & creative', layer: 'orchestration', status: 'planned',
    visibility: 'internal', travelerFacing: false, allowedSurfaces: ['taai-iq', 'creative'],
    summary: 'Content operations, creative production, brand assets, social content, and editorial consistency.',
    owns: ['Content operations', 'Creative production', 'Brand consistency'], can: ['Draft assets and briefs', 'Review editorial consistency'],
    cannot: INTERNAL_STATE_BOUNDARY, approvalRequired: ['Publishing', 'External distribution', 'Paid creative deployment'],
  },
  benny: {
    key: 'benny', name: 'Benny', role: 'Traveler care', layer: 'orchestration', status: 'planned',
    visibility: 'internal', travelerFacing: false, allowedSurfaces: ['taai-iq', 'support-ops'],
    summary: 'Internal traveler-care lane for escalations, service recovery, issue resolution, and satisfaction.',
    owns: ['Traveler-care operations', 'Escalation and recovery'], can: ['Triage issues', 'Draft recovery plans', 'Coordinate approved support steps'],
    cannot: INTERNAL_STATE_BOUNDARY, approvalRequired: ['Traveler communications', 'Refunds', 'Provider changes'],
  },
  piper: {
    key: 'piper', name: 'Piper', role: 'Booking operations', layer: 'orchestration', status: 'planned',
    visibility: 'internal', travelerFacing: false, allowedSurfaces: ['taai-iq', 'booking-ops'],
    summary: 'Reservation follow-up, provider coordination, pending-confirmation tracking, and booking-quality control.',
    owns: ['Booking operations', 'Pending confirmation quality'], can: ['Track provider evidence', 'Triage pending bookings', 'Draft follow-up'],
    cannot: INTERNAL_STATE_BOUNDARY, approvalRequired: ['Provider contact', 'Booking mutation', 'Cancellation or rebooking'],
  },
  lester: {
    key: 'lester', name: 'Lester', role: 'Finance operations', layer: 'orchestration', status: 'planned',
    visibility: 'internal', travelerFacing: false, allowedSurfaces: ['taai-iq', 'finance'],
    summary: 'Payments, refunds, reconciliation, commissions, ledger checks, and margin review.',
    owns: ['Finance operations', 'Reconciliation', 'Margin review'], can: ['Analyze financial records', 'Draft reconciliations and exception reports'],
    cannot: INTERNAL_STATE_BOUNDARY, approvalRequired: ['Payment or refund action', 'Financial record mutation', 'External financial reporting'],
  },
  scout: {
    key: 'scout', name: 'Scout', role: 'Research & market intelligence', layer: 'orchestration', status: 'planned',
    visibility: 'internal', travelerFacing: false, allowedSurfaces: ['taai-iq', 'research'],
    summary: 'Destination, supplier, market, competitor, and opportunity research.',
    owns: ['Research', 'Supplier and destination discovery', 'Market intelligence'], can: ['Research public sources', 'Create sourced briefs'],
    cannot: INTERNAL_STATE_BOUNDARY, approvalRequired: ['New paid data sources', 'External distribution', 'Durable supplier changes'],
  },
};

export const TAAI_AGENT_KEYS = Object.keys(TAAI_AGENT_MANIFEST) as AgentKey[];

export const INTERNAL_AGENT_KEYS = TAAI_AGENT_KEYS.filter(
  (key) => TAAI_AGENT_MANIFEST[key].visibility === 'internal',
);

export const ROUTABLE_INTERNAL_AGENT_KEYS = INTERNAL_AGENT_KEYS.filter(
  (key) => key !== 'hermes',
);

export const TAAI_DIRECTIONAL_FLOW = [
  'Traveler',
  'Experience',
  'AI assistance',
  'Hermes orchestration',
  'taai_Nucleus business logic',
  'Data & knowledge',
  'Intelligence',
  'taai_IQ executive command',
] as const;

export const STATE_CHANGING_ACTIONS = [
  'modify_code',
  'modify_data',
  'deploy',
  'send_external',
  'financial_action',
  'provider_action',
] as const;

export type StateChangingAction = (typeof STATE_CHANGING_ACTIONS)[number];

export const isStateChangingAction = (action: string): action is StateChangingAction =>
  STATE_CHANGING_ACTIONS.includes(action as StateChangingAction);
