import { asDateOnly } from '@/lib/date-time';
import { calendarDateInTimeZone } from '@/lib/dashboard/trip-phase';
import {
  categoryForSource,
  isCancelledStatus,
  normalizeCurrency,
  recordedAmount,
  type CostCategory,
  type OccurrenceInput,
  type Provenance,
  type ReportedPaymentInput,
  type SettlementInput,
  type ShareInput,
  type TripInput,
} from '@/lib/dashboard/travel-metrics';

/**
 * Maps rows the signed-in user can read into metric inputs.
 * Provider snapshots, payment instruments, and reimbursement amounts are not read.
 * Room counts and flight segments are not inferred from those snapshots.
 */

export interface AnalyticsTripRow {
  id: number | string;
  itin_id?: string | null;
  itin_name?: string | null;
  itin_date_start?: string | null;
  itin_date_end?: string | null;
  budget?: number | null;
  spending?: number | null;
  provenance?: Provenance | null;
}

export interface AnalyticsCartRow {
  id: string;
  itinerary_id?: string | null;
  type?: string | null;
  price?: number | null;
  booking_status?: string | null;
  item_kind?: string | null;
  item_currency?: string | null;
  item_service_timezone?: string | null;
  item_service_dates?: {
    check_in?: string | null;
    checkIn?: string | null;
    check_out?: string | null;
    checkOut?: string | null;
    depart?: string | null;
    return?: string | null;
    start?: string | null;
    startDate?: string | null;
    end?: string | null;
    endDate?: string | null;
    date?: string | null;
  } | null;
}

export interface AnalyticsExternalRow {
  id: string;
  itinerary_id: number | string;
  category?: string | null;
  currency?: string | null;
  total_amount?: number | null;
  amount_paid?: number | null;
  payment_status?: string | null;
  evidence_quality?: string | null;
  record_status?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  associated_itinerary_item_id?: string | null;
}

export interface AnalyticsProviderRow {
  id: string;
  booking_type?: string | null;
  currency?: string | null;
  total_amount?: number | null;
  booking_status?: string | null;
  service_start_date?: string | null;
  service_end_date?: string | null;
}

export interface AnalyticsPaymentRow {
  id: string;
  booking_id: string;
  payment_amount?: number | null;
  payment_date?: string | null;
  payment_status?: string | null;
}

export interface AnalyticsShareRow {
  id: string;
  cart_item_id: string;
  attendee_user_id?: string | null;
  share_method?: string | null;
  computed_amount?: number | null;
  auto_added?: boolean | null;
  payment_status?: string | null;
}

export function tripInputFromRow(row: AnalyticsTripRow): TripInput {
  return {
    id: String(row.id),
    name: row.itin_name?.trim() || 'Untitled trip',
    start: row.itin_date_start ?? null,
    end: row.itin_date_end ?? null,
    budget: row.budget ?? null,
    spending: row.spending ?? null,
    provenance: row.provenance ?? null,
  };
}

function calendarFromValue(value: unknown, timeZone: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return asDateOnly(trimmed);
  if (!timeZone) return null;
  const instant = new Date(trimmed);
  if (Number.isNaN(instant.getTime())) return null;
  return calendarDateInTimeZone(instant, timeZone);
}

export function occurrenceFromCart(row: AnalyticsCartRow, tripId: string | null): OccurrenceInput {
  const dates = row.item_service_dates;
  const zone = row.item_service_timezone ?? null;
  const start = calendarFromValue(
    dates?.check_in ?? dates?.checkIn ?? dates?.depart ?? dates?.start ?? dates?.startDate ?? dates?.date ?? null,
    zone,
  );
  const end = calendarFromValue(
    dates?.check_out ?? dates?.checkOut ?? dates?.return ?? dates?.end ?? dates?.endDate ?? null,
    zone,
  );
  return {
    id: `cart:${row.id}`,
    tripId,
    source: 'cart',
    category: categoryForSource(row.type, row.item_kind),
    amount: recordedAmount(row.price),
    currency: normalizeCurrency(row.item_currency),
    serviceDate: start,
    serviceEnd: end,
    status: row.booking_status ?? null,
    cancelled: isCancelledStatus(row.booking_status),
    rooms: null,
    segments: null,
    linkedToId: null,
  };
}

export function occurrenceFromExternal(row: AnalyticsExternalRow): OccurrenceInput {
  const linked = row.associated_itinerary_item_id
    ? `cart:${row.associated_itinerary_item_id}`
    : null;
  return {
    id: `external:${row.id}`,
    tripId: String(row.itinerary_id),
    source: 'external',
    category: categoryForSource(row.category),
    amount: recordedAmount(row.total_amount),
    currency: normalizeCurrency(row.currency),
    serviceDate: null,
    serviceEnd: null,
    status: row.record_status ?? null,
    archived: row.record_status === 'archived',
    rooms: null,
    segments: null,
    linkedToId: linked,
  };
}

export function reportedFromExternal(row: AnalyticsExternalRow): ReportedPaymentInput {
  return {
    id: `reported:${row.id}`,
    occurrenceId: `external:${row.id}`,
    category: categoryForSource(row.category),
    amount: recordedAmount(row.amount_paid),
    currency: normalizeCurrency(row.currency),
    status: row.payment_status ?? 'unknown',
    evidence: row.evidence_quality ?? 'unverified',
  };
}

export function occurrenceFromProvider(row: AnalyticsProviderRow): OccurrenceInput {
  return {
    id: `provider:${row.id}`,
    tripId: null,
    source: 'provider',
    category: categoryForSource(row.booking_type),
    amount: recordedAmount(row.total_amount),
    currency: normalizeCurrency(row.currency),
    serviceDate: calendarFromValue(row.service_start_date, null),
    serviceEnd: calendarFromValue(row.service_end_date, null),
    status: row.booking_status ?? null,
    cancelled: isCancelledStatus(row.booking_status),
    rooms: null,
    segments: null,
    linkedToId: null,
  };
}

export function settlementFromPayment(
  row: AnalyticsPaymentRow,
  provider: AnalyticsProviderRow | undefined,
  settlementTimeZone: string,
): SettlementInput {
  return {
    id: `settlement:${row.id}`,
    occurrenceId: provider ? `provider:${provider.id}` : null,
    category: categoryForSource(provider?.booking_type),
    amount: recordedAmount(row.payment_amount),
    currency: normalizeCurrency(provider?.currency),
    settledOn: calendarFromValue(row.payment_date, settlementTimeZone),
    status: row.payment_status ?? null,
  };
}

export function shareFromRow(row: AnalyticsShareRow): ShareInput {
  return {
    id: row.id,
    occurrenceId: `cart:${row.cart_item_id}`,
    attendeeUserId: row.attendee_user_id ?? null,
    method: row.share_method ?? 'equal',
    amount: recordedAmount(row.computed_amount),
    autoAdded: Boolean(row.auto_added),
    paymentStatus: row.payment_status ?? null,
  };
}

export function categoryLabel(category: CostCategory | 'all'): string {
  switch (category) {
    case 'all': return 'All';
    case 'flights': return 'Flights';
    case 'properties': return 'Properties';
    case 'activities': return 'Activities';
    case 'dining': return 'Dining';
    case 'transport': return 'Transport';
    case 'unclassified': return 'Unclassified';
    default: return category;
  }
}
