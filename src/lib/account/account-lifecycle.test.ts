import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  ACCOUNT_CLOSURE_GRACE_DAYS,
  BILLING_RECORD_RETENTION_YEARS,
  FREE_EDITABLE_ITINERARIES,
  TRAVEL_SELLER_PHRASES,
  applyRetentionCopy,
  billingDecision,
  chooseItinerarySuccessor,
  copyImpliesTravelSale,
  itineraryIdsToLock,
  renderLifecycleEmail,
  reopenDecision,
  unpaidInvoiceKeepsFailure,
} from '../../../supabase/functions/_shared/account-policy';

const read = (relative: string) => readFileSync(resolve(process.cwd(), relative), 'utf8');

const baseBilling = {
  eventType: 'customer.subscription.updated',
  stripeStatus: 'active' as string | null,
  cancelAtPeriodEnd: false,
  previousCancelAtPeriodEnd: null as boolean | null,
  priceId: 'price_new',
  previousPriceId: null as string | null,
  interval: 'month' as string | null,
  billingReason: null as string | null,
  accountClosed: false,
  subscriptionId: 'sub_123',
  invoiceId: 'in_123',
  checkoutPaid: false,
};

describe('billing decisions', () => {
  it('marks a failed invoice unsubscribed even while Stripe still says active', () => {
    const decision = billingDecision({
      ...baseBilling,
      eventType: 'invoice.payment_failed',
      stripeStatus: 'active',
      billingReason: 'subscription_cycle',
    });
    expect(decision.subscribed).toBe(false);
    expect(decision.paymentFailed).toBe(true);
    expect(decision.lockToFreePlan).toBe(false);
    expect(decision.emails.map((email) => email.kind)).toEqual(['payment_failed']);
    expect(decision.emails[0].dedupeKey).toBe('payment-failed:in_123');
  });

  it('sends a monthly or annual renewal from the invoice interval', () => {
    const monthly = billingDecision({
      ...baseBilling,
      eventType: 'invoice.paid',
      billingReason: 'subscription_cycle',
      interval: 'month',
    });
    const annual = billingDecision({
      ...baseBilling,
      eventType: 'invoice.paid',
      billingReason: 'subscription_cycle',
      interval: 'year',
    });
    expect(monthly.emails[0]).toEqual({ kind: 'renewal_monthly', dedupeKey: 'renewal:in_123' });
    expect(annual.emails[0].kind).toBe('renewal_annual');
    expect(monthly.subscribed).toBe(true);
    expect(monthly.clearPaymentFailure).toBe(true);
  });

  it('confirms a new subscription once per subscription id', () => {
    const decision = billingDecision({
      ...baseBilling,
      eventType: 'checkout.session.completed',
      checkoutPaid: true,
    });
    expect(decision.emails).toEqual([{ kind: 'subscription_confirmed', dedupeKey: 'confirmed:sub_123' }]);
  });

  it('keeps a failed payment unsubscribed until the latest invoice is paid', () => {
    expect(unpaidInvoiceKeepsFailure({ status: 'open', amountRemaining: 1200 })).toBe(true);
    expect(unpaidInvoiceKeepsFailure({ status: 'paid', amountRemaining: 0 })).toBe(false);
    expect(unpaidInvoiceKeepsFailure(null)).toBe(false);
  });

  it('emails a plan change and a period-end cancellation, and skips cancellation after account closure', () => {
    const changed = billingDecision({
      ...baseBilling,
      previousPriceId: 'price_old',
      priceId: 'price_new',
    });
    const cancelled = billingDecision({
      ...baseBilling,
      cancelAtPeriodEnd: true,
      previousCancelAtPeriodEnd: false,
    });
    const closed = billingDecision({
      ...baseBilling,
      eventType: 'customer.subscription.deleted',
      stripeStatus: 'canceled',
      accountClosed: true,
    });
    expect(changed.emails[0].kind).toBe('plan_changed');
    expect(cancelled.subscribed).toBe(true);
    expect(cancelled.emails[0]).toEqual({ kind: 'subscription_cancelled', dedupeKey: 'cancelled:sub_123' });
    expect(closed.subscribed).toBe(false);
    expect(closed.lockToFreePlan).toBe(true);
    expect(closed.emails).toEqual([]);
  });
});

describe('shared itineraries and free-plan locks', () => {
  it('picks the earliest accepted collaborator and leaves a solo trip without a successor', () => {
    const successor = chooseItinerarySuccessor([
      { userId: 'owner', role: 'owner', status: 'accepted', joinedAt: '2024-01-01' },
      { userId: 'later', role: 'collaborator', status: 'accepted', joinedAt: '2024-05-01' },
      { userId: 'early', role: 'collaborator', status: 'accepted', joinedAt: '2024-02-01' },
      { userId: 'pending', role: 'collaborator', status: 'pending', joinedAt: '2024-01-02' },
    ], 'owner');
    expect(successor).toBe('early');
    expect(chooseItinerarySuccessor([
      { userId: 'owner', role: 'owner', status: 'accepted', joinedAt: '2024-01-01' },
    ], 'owner')).toBeNull();
  });

  it('keeps the newest free-plan trips editable', () => {
    const trips = [
      { id: 1, createdAt: '2024-01-01' },
      { id: 2, createdAt: '2024-06-01' },
      { id: 3, createdAt: '2024-03-01' },
      { id: 4, createdAt: '2024-09-01' },
    ];
    expect(FREE_EDITABLE_ITINERARIES).toBe(3);
    expect(itineraryIdsToLock(trips)).toEqual([1]);
    expect(itineraryIdsToLock(trips, -1)).toEqual([]);
  });
});

describe('account reopen and retention copy', () => {
  const closed = {
    closedAt: '2026-01-01T00:00:00.000Z',
    reopenedAt: null,
    purgeAfter: '2026-01-31T00:00:00.000Z',
    lastSignInAt: '2026-01-01T00:00:00.000Z',
    now: '2026-01-10T00:00:00.000Z',
  };

  it('rejects a leftover session, reopens a later sign-in, and stops after the grace date', () => {
    expect(reopenDecision(closed)).toBe('reject_stale_session');
    expect(reopenDecision({ ...closed, lastSignInAt: '2026-01-02T00:00:00.000Z' })).toBe('reopen');
    expect(reopenDecision({ ...closed, now: '2026-02-01T00:00:00.000Z' })).toBe('past_grace');
    expect(reopenDecision({ ...closed, reopenedAt: '2026-01-03T00:00:00.000Z' })).toBe('open');
    expect(ACCOUNT_CLOSURE_GRACE_DAYS).toBeGreaterThan(0);
    expect(BILLING_RECORD_RETENTION_YEARS).toBeGreaterThan(0);
  });

  it('substitutes the attorney-reviewed constants into the branded templates', () => {
    const closedCopy = read('supabase/functions/_shared/emails/09-account-closed.txt');
    const deletedCopy = read('supabase/functions/_shared/emails/10-account-deleted.txt');
    const rendered = renderLifecycleEmail(closedCopy, closedCopy, { purge_date: 'March 1, 2026' });
    expect(closedCopy).toContain('(30 days)');
    expect(deletedCopy).toContain('up to 7 years');
    expect(rendered.text).toContain(`(${ACCOUNT_CLOSURE_GRACE_DAYS} days)`);
    expect(applyRetentionCopy(deletedCopy)).toContain(`up to ${BILLING_RECORD_RETENTION_YEARS} years`);
    expect(rendered.subject).toBe('Your taai account is closed');
  });
});

describe('travel-seller copy stays out of the product', () => {
  it('keeps lifecycle templates from saying taai sells or confirms travel', () => {
    const dir = resolve(process.cwd(), 'supabase/functions/_shared/emails');
    const files = readdirSync(dir).filter((name) => name.endsWith('.html') || name.endsWith('.txt'));
    expect(files.length).toBeGreaterThanOrEqual(20);
    for (const file of files) {
      const source = readFileSync(resolve(dir, file), 'utf8');
      expect(copyImpliesTravelSale(source), file).toBe(false);
      expect(source.toLowerCase(), file).toContain('third-party');
    }
    expect(TRAVEL_SELLER_PHRASES.some((pattern) => pattern.test('your booking is confirmed'))).toBe(true);
  });

  it('retires the Resend booking receipt and stops claiming taai booked the trip', () => {
    expect(existsSync(resolve(process.cwd(), 'supabase/functions/send-booking-receipt/index.ts'))).toBe(false);
    const receipt = read('supabase/functions/generate-booking-receipt/index.ts');
    expect(receipt).not.toContain('send-booking-receipt');
    expect(receipt).not.toContain('onboarding@resend.dev');
    expect(receipt).not.toContain('Thanks for booking with TAAI');
    expect(copyImpliesTravelSale(receipt)).toBe(false);
  });
});

describe('deletion migration and privacy promise', () => {
  it('nulls blocking foreign keys and leaves the protected master admin restricted', () => {
    const sql = read('supabase/migrations/20261026235423_account_lifecycle.sql');
    const protectedAdmin = read('supabase/migrations/20260808233000_protected_master_admin.sql');
    expect(sql).toContain('on delete set null');
    expect(sql).toContain('agent_tasks_created_by_fkey');
    expect(sql).toContain('agent_task_approvals_decided_by_fkey');
    expect(sql).toContain('payments_user_id_fkey');
    expect(sql).toContain('trip_external_bookings_created_by_fkey');
    expect(sql).toContain('new.created_by is null');
    expect(sql).not.toMatch(/alter table public\.master_admins/i);
    expect(sql).toContain('stays ON DELETE RESTRICT');
    expect(protectedAdmin).toMatch(/references auth\.users\(id\) on delete restrict/i);
  });

  it('does not edit the Privacy Policy deletion sentence', () => {
    const policy = read('src/pages/PrivacyPolicy.tsx');
    expect(policy).toContain(
      'You may access, update, or delete your personal information through your account settings. You can opt out of marketing communications and choose your privacy preferences.',
    );
  });

  it('schedules the purge without a user JWT and points signup mail at the branded template', () => {
    const config = read('supabase/config.toml');
    expect(config).toContain('[functions.purge-closed-accounts]');
    expect(config).toContain('verify_jwt = false');
    expect(config).toContain('content_path = "./templates/confirmation.html"');
    expect(config).not.toMatch(/smtp_pass/i);
    expect(read('supabase/templates/confirmation.html')).toContain('{{ .ConfirmationURL }}');
  });
});
