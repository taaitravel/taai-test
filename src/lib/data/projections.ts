/**
 * Central Supabase column allow-lists (egress containment).
 *
 * Every read on a high-traffic route MUST use one of these projections instead
 * of `select('*')`. Provider blobs (`expedia_data`), payment fields and private
 * contact PII are excluded by construction.
 */

/** Fields that must never be selected on the contained routes. */
export const FORBIDDEN_READ_FIELDS = [
  'expedia_data',
  'provider_response',
  'raw_response',
  'raw_offers',
  'payment_intent',
  'payment_method_id',
  'stripe_session_id',
  'card_last4',
] as const;

/** Lightweight itinerary metadata — header, dates, budget. No day/item detail. */
export const ITINERARY_METADATA_FIELDS = [
  'id',
  'itin_id',
  'itin_name',
  'itin_desc',
  'itin_date_start',
  'itin_date_end',
  'budget',
  'spending',
  'budget_rate',
  'b_efficiency_rate',
  'user_type',
  'itin_locations',
  'itin_map_locations',
  'planned_traveler_count',
  'creation_key',
  'userid',
].join(', ');

/** Day/item detail sections, loaded only when a section is rendered. */
export const ITINERARY_SECTION_FIELDS = ['id', 'itin_id', 'flights', 'hotels', 'activities', 'reservations'].join(', ');

/** Budget-only itinerary projection. */
export const ITINERARY_BUDGET_FIELDS = ['id', 'itin_id', 'budget', 'spending'].join(', ');

/** Commerce projection used for totals — no provider snapshot. */
export const CART_COMMERCE_FIELDS = [
  'id',
  'itinerary_id',
  'user_id',
  'type',
  'price',
  'booking_status',
  'saved_at',
].join(', ');

/** Commerce projection plus the JSON detail actually rendered in the cart UI. */
export const CART_DETAIL_FIELDS = [`${CART_COMMERCE_FIELDS}`, 'external_ref', 'item_data'].join(', ');

/** Budget aggregation needs the item kind inside item_data, not the whole blob. */
export const CART_BUDGET_FIELDS = ['id', 'type', 'price', 'item_kind:item_data->>type'].join(', ');

export const CHAT_MESSAGE_FIELDS = [
  'id',
  'itinerary_id',
  'sender_id',
  'content',
  'attachment_type',
  'attachment_data',
  'reply_to_id',
  'edited_at',
  'deleted',
  'created_at',
].join(', ');

export const CHAT_PARTICIPANT_FIELDS = ['id', 'itinerary_id', 'user_id', 'joined_at'].join(', ');

export const CHAT_REACTION_FIELDS = ['id', 'message_id', 'user_id', 'reaction'].join(', ');

/** Bounded page sizes. */
export const PAGE_SIZES = {
  chatInitial: 50,
  chatPage: 50,
  cartItems: 100,
  agentRows: 50,
} as const;

/** Throws in development when a projection accidentally regains a forbidden field. */
export const assertSafeProjection = (label: string, projection: string): string => {
  const lower = projection.toLowerCase();
  if (lower.includes('*')) throw new Error(`[projections] ${label} must not use select('*')`);
  for (const field of FORBIDDEN_READ_FIELDS) {
    if (lower.includes(field)) throw new Error(`[projections] ${label} must not select ${field}`);
  }
  return projection;
};
