export type PlanningDraftItemKind =
  | 'flight' | 'hotel' | 'activity' | 'restaurant' | 'note';

export type PlanningDraftResultType =
  | 'flights' | 'hotels' | 'activities' | 'restaurants';

export interface PlanningDraftItem {
  draftId: string;
  kind: PlanningDraftItemKind;
  title: string;
  provider: string | null;
  sourceResultId: string | null;
  providerRef: string | null;
  serviceDateStart: string | null;
  serviceDateEnd: string | null;
  locationLabel: string | null;
  price: number | null;
  currency: string | null;
  availabilityStatus:
    | 'provider_search_result'
    | 'planning_only'
    | 'needs_review';
  checkoutReadiness: 'not_checkout_ready';
  validationIssues: string[];
  rawSource: unknown;
}

export type ResultInteraction =
  | { mode: 'default' }
  | {
      mode: 'planning-draft';
      selectedDraftIds: ReadonlySet<string>;
      onAddToDraft: (resultType: PlanningDraftResultType, rawResult: unknown) => void;
      onRemoveFromDraft: (draftId: string) => void;
    };

export type PlanningDraftCardAction =
  | { mode: 'enabled'; draftId: string; selected: boolean; onToggle: () => void }
  | { mode: 'disabled'; reason: string };