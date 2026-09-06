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

/**
 * Commerce projection plus the JSON detail actually rendered in the itinerary
 * workspace cards (hotel/flight/activity snapshots).
 */
export const CART_DETAIL_FIELDS = [`${CART_COMMERCE_FIELDS}`, 'external_ref', 'item_data'].join(', ');

/**
 * Cart LIST projection — deliberately excludes the `item_data` blob. Only the
 * handful of scalars/objects the list row renders are extracted server-side via
 * JSON paths, so an unopened cart never ships a provider snapshot.
 */
export const CART_LIST_FIELDS = [
  `${CART_COMMERCE_FIELDS}`,
  'external_ref',
  'item_name:item_data->>name',
  'item_provider:item_data->>provider',
  'item_service_dates:item_data->service_dates',
  'item_service_timing:item_data->service_timing',
].join(', ');

/** Detail projection for exactly ONE explicitly opened cart item. */
export const CART_ITEM_DETAIL_FIELDS = ['id', 'item_data'].join(', ');

/** Budget aggregation needs the item kind inside item_data, not the whole blob. */
export const CART_BUDGET_FIELDS = ['id', 'type', 'price', 'item_kind:item_data->>type'].join(', ');


/** Split rows rendered by the cart UI. */
export const CART_SPLIT_FIELDS = [
  'id',
  'cart_item_id',
  'itinerary_id',
  'attendee_user_id',
  'attendee_label',
  'share_method',
  'share_value',
  'computed_amount',
  'computed_taxes_and_fees',
  'payment_status',
  'paid_by_user_id',
  'auto_added',
  'created_at',
  'updated_at',
].join(', ');

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

/* ------------------------------------------------------------------------- */
/* Agent operations (internal control layer)                                  */
/* ------------------------------------------------------------------------- */

export const AGENT_TASK_FIELDS = [
  'id',
  'title',
  'objective',
  'assigned_agent',
  'action_class',
  'risk_level',
  'status',
  'approval_required',
  'success_criteria',
  'created_at',
].join(', ');

export const AGENT_APPROVAL_FIELDS = [
  'id',
  'task_id',
  'status',
  'action_class',
  'requested_at',
  'decided_at',
  'decision_reason',
].join(', ');

export const AGENT_EVIDENCE_FIELDS = [
  'id',
  'task_id',
  'evidence_type',
  'label',
  'summary',
  'reference_url',
  'recorded_at',
].join(', ');

export const AGENT_EVENT_FIELDS = [
  'id',
  'task_id',
  'event_type',
  'summary',
  'actor_kind',
  'actor_key',
  'created_at',
].join(', ');


/** Bounded page sizes. */
export const PAGE_SIZES = {
  chatInitial: 50,
  chatPage: 50,
  cartItems: 100,
  cartList: 100,
  agentRows: 50,
} as const;

/**
 * Documented boundary cast.
 *
 * PostgREST cannot infer a row type from a runtime column-list string, so the
 * generated client widens projected results to an error-ish placeholder. These
 * two helpers are the ONLY sanctioned place where that boundary is crossed, and
 * they exist so no call site needs an ad-hoc `as unknown as` cast. They do not
 * hide live-schema drift for columns read through generated helpers — only for
 * the explicit allow-lists above, each of which is covered by a regression test.
 */
export const projectedRow = <T>(data: unknown): T | null => (data ?? null) as T | null;
export const projectedRows = <T>(data: unknown): T[] => (Array.isArray(data) ? (data as T[]) : []);


/** Throws in development when a projection accidentally regains a forbidden field. */
export const assertSafeProjection = (label: string, projection: string): string => {
  const lower = projection.toLowerCase();
  if (lower.includes('*')) throw new Error(`[projections] ${label} must not use select('*')`);
  for (const field of FORBIDDEN_READ_FIELDS) {
    if (lower.includes(field)) throw new Error(`[projections] ${label} must not select ${field}`);
  }
  return projection;
};
