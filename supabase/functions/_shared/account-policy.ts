/**
 * Account closure, billing retention, and lifecycle-email decisions.
 *
 * ACCOUNT_CLOSURE_GRACE_DAYS and BILLING_RECORD_RETENTION_YEARS are the
 * values an attorney still needs to review. They are the only source for the
 * grace period and the billing-record retention window. The Privacy Policy
 * text is intentionally not edited here.
 */
import { PUBLISHED_LIMITS, normalizeTier, type TierId } from './tier-map.ts';

/** Days a closed account can be reopened by signing in, before the purge. */
export const ACCOUNT_CLOSURE_GRACE_DAYS = 30;

/** Years unlinked software-subscription billing records are retained. */
export const BILLING_RECORD_RETENTION_YEARS = 7;

/** Free Traveler itineraries that stay editable after a paid plan ends. */
export const FREE_EDITABLE_ITINERARIES = PUBLISHED_LIMITS.traveler.maxItineraries;

export const APP_ORIGIN = 'https://taai-travel.lovable.app';

export const PLAN_DISPLAY_NAMES: Record<TierId, string> = {
  traveler: 'Traveler',
  taai_traveler: 'taaiTraveler',
  taai_traveler_plus: 'taaiTraveler+',
  corp_taai_traveler_plus: 'Corp. taaiTraveler+',
  taai_enterprise_plus: 'taaiEnterprise+',
};

export const planDisplayName = (tier: string | null | undefined): string =>
  PLAN_DISPLAY_NAMES[normalizeTier(tier) ?? 'traveler'];

export type LifecycleTemplateId =
  | '02-welcome'
  | '03-subscription-confirmation'
  | '04-renewal-monthly'
  | '05-renewal-annual'
  | '06-payment-failed'
  | '07-plan-changed'
  | '08-subscription-cancelled'
  | '09-account-closed'
  | '10-account-deleted';

export type LifecycleKind =
  | 'welcome'
  | 'subscription_confirmed'
  | 'renewal_monthly'
  | 'renewal_annual'
  | 'payment_failed'
  | 'plan_changed'
  | 'subscription_cancelled'
  | 'account_closed'
  | 'account_deleted';

export const LIFECYCLE_TEMPLATE_FILES: Record<LifecycleKind, LifecycleTemplateId> = {
  welcome: '02-welcome',
  subscription_confirmed: '03-subscription-confirmation',
  renewal_monthly: '04-renewal-monthly',
  renewal_annual: '05-renewal-annual',
  payment_failed: '06-payment-failed',
  plan_changed: '07-plan-changed',
  subscription_cancelled: '08-subscription-cancelled',
  account_closed: '09-account-closed',
  account_deleted: '10-account-deleted',
};

const DAY_MS = 24 * 60 * 60 * 1000;

export const addUtcDays = (from: Date, days: number): Date => new Date(from.getTime() + days * DAY_MS);

export const addUtcYears = (from: Date, years: number): Date => {
  const next = new Date(from.getTime());
  next.setUTCFullYear(next.getUTCFullYear() + years);
  return next;
};

export const closurePurgeAt = (closedAt: Date, graceDays = ACCOUNT_CLOSURE_GRACE_DAYS): Date =>
  addUtcDays(closedAt, graceDays);

export const billingRetainUntil = (purgedAt: Date, years = BILLING_RECORD_RETENTION_YEARS): Date =>
  addUtcYears(purgedAt, years);

export const formatEmailDate = (iso: string | null | undefined, fallback = 'the date in your account'): string => {
  if (!iso) return fallback;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
};

export const formatMoney = (cents: number | null | undefined, currency = 'usd'): string => {
  if (cents == null || !Number.isFinite(cents)) return 'the plan price';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
};

/** Substitute the attorney-reviewed retention numbers into the branded copy. */
export const applyRetentionCopy = (source: string): string =>
  source
    .replaceAll('(30 days)', `(${ACCOUNT_CLOSURE_GRACE_DAYS} days)`)
    .replaceAll('up to 7 years', `up to ${BILLING_RECORD_RETENTION_YEARS} years`);

export const renderPlaceholders = (source: string, vars: Record<string, string | null | undefined>): string =>
  source.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (_match, key: string) => vars[key] ?? '');

export const renderLifecycleEmail = (
  html: string,
  text: string,
  vars: Record<string, string | null | undefined>,
): { html: string; text: string; subject: string } => {
  const renderedText = renderPlaceholders(applyRetentionCopy(text), vars).replace(/^\uFEFF/, '');
  const subjectLine = renderedText.match(/^Subject:\s*(.+)\s*$/m);
  const subject = subjectLine?.[1]?.trim() || 'A note from taai';
  const body = renderedText.replace(/^Subject:\s*.+\n+/, '');
  return {
    html: renderPlaceholders(applyRetentionCopy(html), vars),
    text: body,
    subject,
  };
};

export interface AttendeeCandidate {
  userId: string;
  role: string;
  status: string;
  joinedAt: string | null;
}

/**
 * Shared trips need a living owner. The successor is the earliest accepted
 * collaborator. A trip with nobody else is not shared.
 */
export const chooseItinerarySuccessor = (
  members: AttendeeCandidate[],
  ownerId: string,
): string | null => {
  const candidates = members.filter((member) =>
    member.userId !== ownerId && member.status === 'accepted' && member.role !== 'owner');
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => {
    const joined = (a.joinedAt ?? '9999').localeCompare(b.joinedAt ?? '9999');
    if (joined !== 0) return joined;
    return a.userId.localeCompare(b.userId);
  });
  return candidates[0].userId;
};

export interface OwnedItinerary {
  id: number;
  createdAt: string;
}

/** Keep the newest `keep` itineraries editable. Negative keep means unlimited. */
export const itineraryIdsToLock = (trips: OwnedItinerary[], keep = FREE_EDITABLE_ITINERARIES): number[] => {
  if (!Number.isFinite(keep) || keep < 0) return [];
  const sorted = [...trips].sort((a, b) => {
    const created = b.createdAt.localeCompare(a.createdAt);
    if (created !== 0) return created;
    return b.id - a.id;
  });
  return sorted.slice(keep).map((trip) => trip.id);
};

export type ReopenDecision = 'open' | 'reopen' | 'reject_stale_session' | 'past_grace';

/**
 * Closing an account revokes sessions. A session issued before the closure
 * cannot keep using the app. A later sign-in reopens it, until the grace
 * period ends.
 */
export const reopenDecision = (input: {
  closedAt: string | null;
  reopenedAt: string | null;
  purgeAfter: string | null;
  lastSignInAt: string | null;
  now: string;
}): ReopenDecision => {
  if (!input.closedAt || input.reopenedAt) return 'open';
  if (input.purgeAfter && input.now >= input.purgeAfter) return 'past_grace';
  if (!input.lastSignInAt || input.lastSignInAt <= input.closedAt) return 'reject_stale_session';
  return 'reopen';
};

export interface BillingEmail {
  kind: Exclude<LifecycleKind, 'welcome' | 'account_closed' | 'account_deleted'>;
  dedupeKey: string;
}

export interface BillingDecision {
  subscribed: boolean;
  /** Paid limits stop while a payment is failed, without locking existing trips. */
  paymentFailed: boolean;
  clearPaymentFailure: boolean;
  cancelAtPeriodEnd: boolean;
  /** Subscription ended: free Traveler limits, excess itineraries become read-only. */
  lockToFreePlan: boolean;
  /** A paid plan is active again, so read-only locks come off. */
  unlockAll: boolean;
  emails: BillingEmail[];
}

const GOOD_STANDING = new Set(['active', 'trialing']);
const FAILED_PAYMENT = new Set(['past_due', 'unpaid', 'incomplete']);

/**
 * Stripe is the source of the subscription. A failed invoice is not an active
 * subscription, even when the subscription object has not flipped to past_due
 * yet. Cancelling at period end keeps access until that period ends.
 */
export const billingDecision = (input: {
  eventType: string;
  stripeStatus: string | null;
  cancelAtPeriodEnd: boolean;
  previousCancelAtPeriodEnd: boolean | null;
  priceId: string | null;
  previousPriceId: string | null;
  interval: string | null;
  billingReason: string | null;
  accountClosed: boolean;
  subscriptionId: string | null;
  invoiceId: string | null;
  checkoutPaid: boolean;
}): BillingDecision => {
  const subscriptionId = input.subscriptionId ?? 'unknown-subscription';
  const invoiceId = input.invoiceId ?? 'unknown-invoice';
  const failedEvent = input.eventType === 'invoice.payment_failed' || FAILED_PAYMENT.has(input.stripeStatus ?? '');
  const deleted = input.eventType === 'customer.subscription.deleted' || input.stripeStatus === 'canceled';
  const good = !deleted && !failedEvent && GOOD_STANDING.has(input.stripeStatus ?? '');
  const emails: BillingEmail[] = [];

  if (input.eventType === 'checkout.session.completed' && input.checkoutPaid) {
    emails.push({ kind: 'subscription_confirmed', dedupeKey: `confirmed:${subscriptionId}` });
  }
  if (input.eventType === 'invoice.paid' && input.billingReason === 'subscription_create') {
    emails.push({ kind: 'subscription_confirmed', dedupeKey: `confirmed:${subscriptionId}` });
  }
  if (input.eventType === 'invoice.paid' && input.billingReason === 'subscription_cycle') {
    const annual = input.interval === 'year';
    emails.push({
      kind: annual ? 'renewal_annual' : 'renewal_monthly',
      dedupeKey: `renewal:${invoiceId}`,
    });
  }
  if (input.eventType === 'invoice.payment_failed') {
    emails.push({ kind: 'payment_failed', dedupeKey: `payment-failed:${invoiceId}` });
  }
  if (
    input.eventType === 'customer.subscription.updated'
    && input.previousPriceId
    && input.priceId
    && input.previousPriceId !== input.priceId
  ) {
    emails.push({ kind: 'plan_changed', dedupeKey: `plan:${subscriptionId}:${input.priceId}` });
  }
  const cancelJustScheduled = input.eventType === 'customer.subscription.updated'
    && input.cancelAtPeriodEnd
    && input.previousCancelAtPeriodEnd === false;
  const cancelCompleted = input.eventType === 'customer.subscription.deleted';
  if ((cancelJustScheduled || cancelCompleted) && !input.accountClosed) {
    emails.push({ kind: 'subscription_cancelled', dedupeKey: `cancelled:${subscriptionId}` });
  }

  return {
    subscribed: good,
    paymentFailed: failedEvent && !deleted,
    clearPaymentFailure: good || deleted,
    cancelAtPeriodEnd: good && input.cancelAtPeriodEnd,
    lockToFreePlan: deleted,
    unlockAll: good,
    emails,
  };
};

export const unpaidInvoiceKeepsFailure = (invoice: {
  status: string | null;
  amountRemaining: number;
} | null): boolean =>
  !!invoice
  && invoice.amountRemaining > 0
  && (invoice.status === 'open' || invoice.status === 'uncollectible');

/** Phrases that would mean taai is the travel seller. Used by tests and copy review. */
export const TRAVEL_SELLER_PHRASES = [
  /onboarding@resend\.dev/i,
  /your booking is confirmed/i,
  /taai sells travel/i,
  /we sell travel/i,
  /we booked your (flight|hotel|trip)/i,
];

export const copyImpliesTravelSale = (source: string): boolean =>
  TRAVEL_SELLER_PHRASES.some((pattern) => pattern.test(source));
