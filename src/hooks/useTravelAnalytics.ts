import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { guardRead } from '@/lib/data/read-guard';
import {
  CART_ANALYTICS_FIELDS,
  EXTERNAL_BOOKING_ANALYTICS_FIELDS,
  PAGE_SIZES,
  PROVIDER_BOOKING_ANALYTICS_FIELDS,
  SETTLEMENT_ANALYTICS_FIELDS,
  SHARE_ANALYTICS_FIELDS,
  assertSafeProjection,
} from '@/lib/data/projections';
import { getViewerTimezone } from '@/lib/date-time';
import {
  occurrenceFromCart,
  occurrenceFromExternal,
  occurrenceFromProvider,
  reportedFromExternal,
  settlementFromPayment,
  shareFromRow,
  tripInputFromRow,
  type AnalyticsCartRow,
  type AnalyticsExternalRow,
  type AnalyticsPaymentRow,
  type AnalyticsProviderRow,
  type AnalyticsShareRow,
  type AnalyticsTripRow,
} from '@/lib/dashboard/analytics-sources';
import type { MetricsInput, OccurrenceInput, ReportedPaymentInput, SettlementInput, ShareInput } from '@/lib/dashboard/travel-metrics';

const LIMIT = PAGE_SIZES.analytics;

export interface TravelAnalyticsState {
  input: MetricsInput;
  loading: boolean;
  errors: string[];
  truncated: boolean;
  viewerId: string | null;
  viewerTimeZone: string;
}

async function readRows<T>(
  label: string,
  run: () => PromiseLike<{ data: unknown; error: { message?: string } | null }>,
): Promise<{ rows: T[]; error: string | null; truncated: boolean }> {
  try {
    guardRead(`dashboard-analytics:${label}`);
    const { data, error } = await run();
    if (error) return { rows: [], error: error.message || `${label} unavailable`, truncated: false };
    const rows = Array.isArray(data) ? data as T[] : [];
    return { rows, error: null, truncated: rows.length >= LIMIT };
  } catch (error) {
    return { rows: [], error: (error as Error)?.message || `${label} unavailable`, truncated: false };
  }
}

export function useTravelAnalytics(trips: AnalyticsTripRow[]): TravelAnalyticsState {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const viewerTimeZone = getViewerTimezone() || 'UTC';
  const [lineItems, setLineItems] = useState<{
    occurrences: OccurrenceInput[];
    shares: ShareInput[];
    settlements: SettlementInput[];
    reportedPayments: ReportedPaymentInput[];
    reimbursementCount: number;
  }>({ occurrences: [], shares: [], settlements: [], reportedPayments: [], reimbursementCount: 0 });
  const [loading, setLoading] = useState(Boolean(userId));
  const [errors, setErrors] = useState<string[]>([]);
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const itineraryIds = trips
      .map((trip) => Number(trip.id))
      .filter((id) => Number.isFinite(id));
    const itinIdByText = new Map(
      trips
        .filter((trip): trip is AnalyticsTripRow & { itin_id: string } => typeof trip.itin_id === 'string')
        .map((trip) => [trip.itin_id, String(trip.id)]),
    );

    const load = async () => {
      const cartProjection = assertSafeProjection('cart analytics', CART_ANALYTICS_FIELDS);
      const externalProjection = assertSafeProjection('external analytics', EXTERNAL_BOOKING_ANALYTICS_FIELDS);
      const providerProjection = assertSafeProjection('provider analytics', PROVIDER_BOOKING_ANALYTICS_FIELDS);
      const settlementProjection = assertSafeProjection('settlement analytics', SETTLEMENT_ANALYTICS_FIELDS);
      const shareProjection = assertSafeProjection('share analytics', SHARE_ANALYTICS_FIELDS);

      const [cart, external, provider, shares, reimbursements] = await Promise.all([
        readRows<AnalyticsCartRow>('cart', () => supabase
          .from('cart_items')
          .select(cartProjection)
          .eq('user_id', userId)
          .limit(LIMIT)),
        itineraryIds.length
          ? readRows<AnalyticsExternalRow>('external', () => supabase
            .from('trip_external_bookings')
            .select(externalProjection)
            .in('itinerary_id', itineraryIds)
            .limit(LIMIT))
          : Promise.resolve({ rows: [], error: null, truncated: false }),
        readRows<AnalyticsProviderRow>('provider', () => supabase
          .from('expedia_bookings')
          .select(providerProjection)
          .eq('user_id', userId)
          .limit(LIMIT)),
        readRows<AnalyticsShareRow>('shares', () => supabase
          .from('cart_item_splits')
          .select(shareProjection)
          .eq('attendee_user_id', userId)
          .limit(LIMIT)),
        itineraryIds.length
          ? readRows<{ id: string }>('reimbursements', () => supabase
            .from('trip_balances_ledger')
            .select('id')
            .in('itinerary_id', itineraryIds)
            .limit(LIMIT))
          : Promise.resolve({ rows: [], error: null, truncated: false }),
      ]);

      const providerIds = provider.rows.map((row) => row.id).filter(Boolean);
      const payments = providerIds.length
        ? await readRows<AnalyticsPaymentRow>('settlements', () => supabase
          .from('booking_payments')
          .select(settlementProjection)
          .in('booking_id', providerIds)
          .limit(LIMIT))
        : { rows: [], error: null, truncated: false };

      if (cancelled) return;
      const providerById = new Map(provider.rows.map((row) => [row.id, row]));
      const occurrences = [
        ...cart.rows.map((row) => occurrenceFromCart(row, row.itinerary_id ? itinIdByText.get(row.itinerary_id) ?? null : null)),
        ...external.rows.map(occurrenceFromExternal),
        ...provider.rows.map(occurrenceFromProvider),
      ];
      setLineItems({
        occurrences,
        shares: shares.rows.map(shareFromRow),
        settlements: payments.rows.map((row) => settlementFromPayment(row, providerById.get(row.booking_id), viewerTimeZone)),
        reportedPayments: external.rows.map(reportedFromExternal),
        reimbursementCount: reimbursements.rows.length,
      });
      setErrors([cart.error, external.error, provider.error, shares.error, reimbursements.error, payments.error].filter((error): error is string => Boolean(error)));
      setTruncated([cart, external, provider, shares, reimbursements, payments].some((result) => result.truncated));
      setLoading(false);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [userId, trips, viewerTimeZone]);

  return {
    input: {
      trips: trips.map(tripInputFromRow),
      ...lineItems,
    },
    loading,
    errors,
    truncated,
    viewerId: userId,
    viewerTimeZone,
  };
}
