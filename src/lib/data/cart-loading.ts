/**
 * Split cart loading (egress containment).
 *
 * The cart LIST never selects the `item_data` provider snapshot. It selects the
 * commerce columns plus a few server-extracted JSON scalars the row renders.
 * The full snapshot is loaded only for one explicitly opened item, on demand.
 *
 * No payment or commerce logic lives here: prices, totals, quotes and checkout
 * continue to use the same commerce columns as before.
 */

import {
  CART_ITEM_DETAIL_FIELDS,
  CART_LIST_FIELDS,
  PAGE_SIZES,
  assertSafeProjection,
  projectedRow,
  projectedRows,
} from './projections';

export const CART_LIST_PROJECTION = assertSafeProjection('cart list', CART_LIST_FIELDS);
export const CART_ITEM_DETAIL_PROJECTION = assertSafeProjection('cart item detail', CART_ITEM_DETAIL_FIELDS);

/** Bounded service-date/timing shapes actually rendered in a list row. */
export interface CartListServiceDates {
  check_in?: string | null;
  checkIn?: string | null;
  check_out?: string | null;
  checkOut?: string | null;
  start?: string | null;
  startDate?: string | null;
  end?: string | null;
  endDate?: string | null;
  depart?: string | null;
  return?: string | null;
  date?: string | null;
}

export interface CartListServiceTiming {
  kind?: string | null;
  starts_at_utc?: string | null;
  local_start?: string | null;
  service_timezone?: string | null;
}

/** One cart row as rendered in the list — no provider snapshot. */
export interface CartListItem {
  id: string;
  itinerary_id: string | null;
  user_id: string;
  type: string;
  price: number;
  booking_status: string | null;
  saved_at: string;
  external_ref: string | null;
  item_name: string | null;
  item_provider: string | null;
  item_service_dates: CartListServiceDates | null;
  item_service_timing: CartListServiceTiming | null;
}

/** Minimal Supabase-like surface, so this module is unit-testable. */
export interface CartQueryClient {
  from: (table: string) => {
    select: (columns: string) => any;
  };
}

export interface FetchCartListOptions {
  itineraryId?: string | null;
  limit?: number;
}

export const fetchCartList = async (
  client: CartQueryClient,
  { itineraryId, limit = PAGE_SIZES.cartList }: FetchCartListOptions = {},
): Promise<CartListItem[]> => {
  let query = client
    .from('cart_items')
    .select(CART_LIST_PROJECTION)
    .order('saved_at', { ascending: false })
    .limit(limit);
  if (itineraryId) query = query.eq('itinerary_id', itineraryId);
  const { data, error } = await query;
  if (error) throw error;
  return projectedRows<CartListItem>(data);
};

/** Loads the provider snapshot for exactly ONE opened cart item. */
export const fetchCartItemDetail = async (
  client: CartQueryClient,
  cartItemId: string,
): Promise<Record<string, unknown> | null> => {
  const { data, error } = await client
    .from('cart_items')
    .select(CART_ITEM_DETAIL_PROJECTION)
    .eq('id', cartItemId)
    .maybeSingle();
  if (error) throw error;
  const row = projectedRow<{ id: string; item_data: unknown }>(data);
  const detail = row?.item_data;
  return detail && typeof detail === 'object' ? (detail as Record<string, unknown>) : null;
};
