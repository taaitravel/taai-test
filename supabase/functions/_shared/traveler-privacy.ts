/**
 * Traveler document minimization for the disabled travel-checkout path.
 * Contact fields may be stored for any item. Passport, date of birth,
 * nationality, and gender are flight-only, and quote reloads never return
 * those document fields to the client.
 */

export const TRAVELER_CONTACT_FIELDS = [
  "first_name",
  "last_name",
  "middle_name",
  "email",
  "phone",
] as const;

export const TRAVELER_DOCUMENT_FIELDS = [
  "dob",
  "gender",
  "nationality",
  "passport_number",
  "passport_expiry",
] as const;

export function isFlightItem(itemType: string | null | undefined): boolean {
  return (itemType ?? "").trim().toLowerCase() === "flight";
}

export function minimizeTraveler(
  itemType: string,
  traveler: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  const source = traveler && typeof traveler === "object" && !Array.isArray(traveler) ? traveler : {};
  const minimized: Record<string, unknown> = {};
  for (const key of TRAVELER_CONTACT_FIELDS) {
    if (source[key] != null && source[key] !== "") minimized[key] = source[key];
  }
  if (isFlightItem(itemType)) {
    for (const key of TRAVELER_DOCUMENT_FIELDS) {
      if (source[key] != null && source[key] !== "") minimized[key] = source[key];
    }
  }
  return minimized;
}

function contactOnly(traveler: Record<string, unknown> | null | undefined): Record<string, unknown> {
  const source = traveler && typeof traveler === "object" ? traveler : {};
  const next: Record<string, unknown> = {};
  for (const key of TRAVELER_CONTACT_FIELDS) {
    next[key] = source[key] ?? "";
  }
  return next;
}

/** Quote reload shape. Document fields are removed for every item type. */
export function redactTravelerRecord<T extends { traveler_data?: unknown }>(row: T): T {
  const data = (row?.traveler_data && typeof row.traveler_data === "object"
    ? row.traveler_data
    : {}) as {
    lead?: Record<string, unknown>;
    additional?: unknown;
    special_requests?: unknown;
    pax?: unknown;
  };
  return {
    ...row,
    traveler_data: {
      lead: contactOnly(data.lead),
      additional: Array.isArray(data.additional)
        ? data.additional.map((traveler) => contactOnly(traveler as Record<string, unknown>))
        : [],
      special_requests: data.special_requests ?? null,
      pax: data.pax ?? 1,
    },
  };
}
