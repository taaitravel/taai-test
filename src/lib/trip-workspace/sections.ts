export const TRIP_WORKSPACE_SECTIONS = [
  'overview',
  'plan',
  'bookings',
  'costs',
  'people',
] as const;

export type TripWorkspaceSection = (typeof TRIP_WORKSPACE_SECTIONS)[number];

export const TRIP_WORKSPACE_SECTION_LABELS: Record<TripWorkspaceSection, string> = {
  overview: 'Overview',
  plan: 'Plan',
  bookings: 'Bookings',
  costs: 'Costs',
  people: 'People',
};

export const DEFAULT_TRIP_WORKSPACE_SECTION: TripWorkspaceSection = 'overview';

export function isTripWorkspaceSection(value: string | null | undefined): value is TripWorkspaceSection {
  return TRIP_WORKSPACE_SECTIONS.includes(value as TripWorkspaceSection);
}

export function normalizeTripWorkspaceSection(
  value: string | null | undefined,
): TripWorkspaceSection {
  return isTripWorkspaceSection(value) ? value : DEFAULT_TRIP_WORKSPACE_SECTION;
}
