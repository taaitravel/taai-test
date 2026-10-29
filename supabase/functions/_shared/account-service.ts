import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import {
  ACCOUNT_CLOSURE_GRACE_DAYS,
  APP_ORIGIN,
  FREE_EDITABLE_ITINERARIES,
  billingRetainUntil,
  closurePurgeAt,
  formatEmailDate,
  reopenDecision,
} from './account-policy.ts';
import { sendLifecycleEmail } from './lifecycle-mail.ts';

export type AdminClient = ReturnType<typeof createClient>;

export const adminClient = (): AdminClient => createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false } },
);

export const stripeClient = (): Stripe | null => {
  const key = Deno.env.get('STRIPE_SECRET_KEY');
  if (!key) return null;
  return new Stripe(key, { apiVersion: '2023-10-16' });
};

const isMasterAdmin = async (admin: AdminClient, userId: string): Promise<boolean> => {
  const { data } = await admin.from('master_admins').select('user_id').eq('user_id', userId).maybeSingle();
  return !!data;
};

export const cancelStripeNow = async (stripe: Stripe, customerId: string) => {
  const listed = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 100 });
  for (const subscription of listed.data) {
    if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') continue;
    await stripe.subscriptions.cancel(subscription.id);
  }
};

export const deleteStripeCustomer = async (stripe: Stripe, customerId: string): Promise<boolean> => {
  try {
    await stripe.customers.del(customerId);
    return true;
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
    if (code === 'resource_missing') return true;
    throw error;
  }
};

const removeStorage = async (
  admin: AdminClient,
  userId: string,
  itineraryIds: number[],
): Promise<number> => {
  const { data, error } = await admin.rpc('list_user_storage_objects', {
    p_user_id: userId,
    p_itinerary_ids: itineraryIds,
  });
  if (error) throw new Error(error.message);
  const grouped = new Map<string, string[]>();
  for (const row of (data ?? []) as Array<{ bucket_id: string; name: string }>) {
    const names = grouped.get(row.bucket_id) ?? [];
    names.push(row.name);
    grouped.set(row.bucket_id, names);
  }
  let removed = 0;
  for (const [bucket, names] of grouped) {
    for (let index = 0; index < names.length; index += 100) {
      const chunk = names.slice(index, index + 100);
      const { error: removeError } = await admin.storage.from(bucket).remove(chunk);
      if (removeError) throw new Error(removeError.message);
      removed += chunk.length;
    }
  }
  return removed;
};

export interface PurgeResult {
  requestId: string;
  storageObjectsRemoved: number;
  sharedItinerariesTransferred: number;
  soloItinerariesDeleted: number;
  milesMemoryDeleted: number;
  stripeCustomerDeleted: boolean;
  emailSent: boolean;
  authDeleted: boolean;
}

/**
 * Order: storage files, Miles memory and the rest of the personal rows,
 * anonymized analytics, Stripe customer, billing rows unlinked, audit log,
 * deletion email, then the auth user.
 */
export const purgeClosedAccount = async (
  admin: AdminClient,
  stripe: Stripe | null,
  userId: string,
): Promise<PurgeResult> => {
  if (await isMasterAdmin(admin, userId)) {
    throw new Error('Protected master administrator identity cannot be deleted');
  }

  const { data: closure, error: closureError } = await admin
    .from('account_closures')
    .select('request_id, email, stripe_customer_id, reopened_at, purge_after')
    .eq('user_id', userId)
    .maybeSingle();
  if (closureError) throw new Error(closureError.message);
  if (!closure || closure.reopened_at) throw new Error('Account is not closed');

  const requestId = closure.request_id as string;
  const email = closure.email as string;
  const customerId = (closure.stripe_customer_id as string | null) ?? null;

  const { data: owned } = await admin.from('itinerary').select('id').eq('userid', userId);
  const ownedIds = ((owned ?? []) as Array<{ id: number }>).map((trip) => trip.id);
  const { data: collaborators } = ownedIds.length
    ? await admin.from('itinerary_attendees').select('itinerary_id').in('itinerary_id', ownedIds).neq('user_id', userId).eq('status', 'accepted').neq('role', 'owner')
    : { data: [] };
  const sharedIds = new Set(((collaborators ?? []) as Array<{ itinerary_id: number }>).map((row) => row.itinerary_id));
  const soloIds = ownedIds.filter((id) => !sharedIds.has(id));

  // Storage files, then Miles memory / analytics / unlinked billing inside
  // prepare_account_purge, then the Stripe customer, then the auth user.
  const storageObjectsRemoved = await removeStorage(admin, userId, soloIds);
  const { data: prepared, error: prepareError } = await admin.rpc('prepare_account_purge', {
    p_user_id: userId,
    p_request_id: requestId,
  });
  if (prepareError) throw new Error(prepareError.message);
  const summary = (prepared ?? {}) as {
    transferred?: number;
    deleted_itinerary_ids?: number[];
    miles_memory_deleted?: number;
  };
  const deletedIds = Array.isArray(summary.deleted_itinerary_ids) ? summary.deleted_itinerary_ids : soloIds;
  let stripeCustomerDeleted = false;
  if (customerId && stripe) {
    stripeCustomerDeleted = await deleteStripeCustomer(stripe, customerId);
  }

  const purgedAt = new Date();
  const mailed = await sendLifecycleEmail(admin, {
    kind: 'account_deleted',
    to: email,
    dedupeKey: `account-deleted:${requestId}`,
    vars: {
      deleted_date: formatEmailDate(purgedAt.toISOString()),
      request_id: requestId,
    },
  });

  const { error: auditError } = await admin.from('account_deletion_audit').upsert({
    request_id: requestId,
    purged_at: purgedAt.toISOString(),
    billing_retain_until: billingRetainUntil(purgedAt).toISOString(),
    stripe_customer_deleted: stripeCustomerDeleted,
    storage_objects_removed: storageObjectsRemoved,
    shared_itineraries_transferred: summary.transferred ?? 0,
    solo_itineraries_deleted: deletedIds.length,
    miles_memory_deleted: summary.miles_memory_deleted ?? 0,
    email_sent: mailed.ok,
    notes: mailed.ok ? null : mailed.error ?? 'email_not_sent',
  }, { onConflict: 'request_id' });
  if (auditError) throw new Error(auditError.message);

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) throw new Error(deleteError.message);

  return {
    requestId,
    storageObjectsRemoved,
    sharedItinerariesTransferred: summary.transferred ?? 0,
    soloItinerariesDeleted: deletedIds.length,
    milesMemoryDeleted: summary.miles_memory_deleted ?? 0,
    stripeCustomerDeleted,
    emailSent: mailed.ok,
    authDeleted: true,
  };
};

export const closeAccount = async (
  admin: AdminClient,
  stripe: Stripe | null,
  user: { id: string; email: string },
  deleteNow: boolean,
) => {
  if (await isMasterAdmin(admin, user.id)) {
    return { ok: false as const, status: 403, error: 'The protected master administrator account cannot be closed.' };
  }
  if (deleteNow && !stripe) {
    const { data: existingCustomer } = await admin.from('subscribers').select('stripe_customer_id').eq('user_id', user.id).maybeSingle();
    if (existingCustomer?.stripe_customer_id) {
      return { ok: false as const, status: 500, error: 'Billing is not configured, so the account was not deleted.' };
    }
  }

  const { data: subscriber } = await admin
    .from('subscribers')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle();
  const customerId = (subscriber?.stripe_customer_id as string | null) ?? null;
  if (customerId && stripe) await cancelStripeNow(stripe, customerId);

  const closedAt = new Date();
  const purgeAt = deleteNow ? new Date(closedAt.getTime() + 1000) : closurePurgeAt(closedAt);
  const { data: closure, error } = await admin.from('account_closures').upsert({
    user_id: user.id,
    status: 'closed',
    closed_at: closedAt.toISOString(),
    purge_after: purgeAt.toISOString(),
    email: user.email,
    stripe_customer_id: customerId,
    reopened_at: null,
    request_id: crypto.randomUUID(),
  }, { onConflict: 'user_id' }).select('request_id, purge_after').single();
  if (error || !closure) return { ok: false as const, status: 500, error: 'Could not close the account.' };

  await admin.rpc('revoke_user_sessions', { p_user_id: user.id });
  const mailed = await sendLifecycleEmail(admin, {
    kind: 'account_closed',
    to: user.email,
    dedupeKey: `account-closed:${closure.request_id}`,
    vars: { purge_date: formatEmailDate(closure.purge_after as string) },
  });

  let purged = false;
  if (deleteNow) {
    if (!stripe && customerId) return { ok: false as const, status: 500, error: 'Billing is not configured, so the account was not deleted.' };
    await purgeClosedAccount(admin, stripe, user.id);
    purged = true;
  }

  return {
    ok: true as const,
    requestId: closure.request_id as string,
    purgeAfter: closure.purge_after as string,
    graceDays: ACCOUNT_CLOSURE_GRACE_DAYS,
    emailSent: mailed.ok,
    purged,
  };
};

export const reopenAccount = async (
  admin: AdminClient,
  user: { id: string; lastSignInAt: string | null },
) => {
  const { data: closure } = await admin
    .from('account_closures')
    .select('closed_at, reopened_at, purge_after')
    .eq('user_id', user.id)
    .maybeSingle();
  const decision = reopenDecision({
    closedAt: closure?.closed_at ?? null,
    reopenedAt: closure?.reopened_at ?? null,
    purgeAfter: closure?.purge_after ?? null,
    lastSignInAt: user.lastSignInAt,
    now: new Date().toISOString(),
  });
  if (decision === 'reopen') {
    const { error } = await admin
      .from('account_closures')
      .update({ reopened_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('reopened_at', null);
    if (error) return { ok: false as const, status: 500, error: 'Could not reopen the account.' };
  }
  return { ok: true as const, decision };
};

export const exportAccountData = async (admin: AdminClient, userId: string) => {
  const [profile, trips, subscription, closure, memory] = await Promise.all([
    admin.from('users').select('email, first_name, last_name, username, city, country, created_at, bio').eq('userid', userId).maybeSingle(),
    admin.from('itinerary').select('id, itin_name, itin_desc, itin_date_start, itin_date_end, editing_locked, created_at').eq('userid', userId),
    admin.from('subscribers').select('subscribed, subscription_tier, subscription_end, cancel_at_period_end, payment_failed_at').eq('user_id', userId).maybeSingle(),
    admin.from('account_closures').select('closed_at, purge_after, reopened_at, request_id').eq('user_id', userId).maybeSingle(),
    admin.from('miles_memory').select('content, created_at').eq('user_id', userId),
  ]);
  const tripIds = ((trips.data ?? []) as Array<{ id: number }>).map((trip) => trip.id);
  const attendees = tripIds.length
    ? await admin.from('itinerary_attendees').select('itinerary_id, user_id, role, status').in('itinerary_id', tripIds)
    : { data: [] };
  return {
    exported_at: new Date().toISOString(),
    note: 'taai is trip-planning software. This export does not include a travel booking, because taai does not sell travel.',
    profile: profile.data,
    itineraries: trips.data ?? [],
    collaborators: attendees.data ?? [],
    subscription: subscription.data,
    closure: closure.data,
    miles_memory: memory.data ?? [],
  };
};

export const transferOwnedItinerary = async (
  admin: AdminClient,
  ownerId: string,
  itineraryId: number,
  successorId: string,
) => {
  const { data, error } = await admin.rpc('transfer_itinerary_owner', {
    p_itinerary_id: itineraryId,
    p_from: ownerId,
    p_to: successorId,
  });
  if (error) return { ok: false as const, status: 400, error: 'Could not transfer that itinerary.' };
  if (!data) return { ok: false as const, status: 400, error: 'Choose an accepted collaborator on that itinerary.' };
  return { ok: true as const };
};

export const cancelAtPeriodEnd = async (admin: AdminClient, stripe: Stripe, userId: string) => {
  const { data: subscriber } = await admin
    .from('subscribers')
    .select('stripe_customer_id, email')
    .eq('user_id', userId)
    .maybeSingle();
  const customerId = subscriber?.stripe_customer_id as string | null;
  if (!customerId) return { ok: false as const, status: 404, error: 'No software subscription was found.' };

  const listed = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 20 });
  const subscription = listed.data.find((item) => item.status === 'active' || item.status === 'trialing' || item.status === 'past_due');
  if (!subscription) return { ok: false as const, status: 404, error: 'No software subscription was found.' };
  if (subscription.cancel_at_period_end) {
    return {
      ok: true as const,
      already: true,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
    };
  }
  const updated = await stripe.subscriptions.update(subscription.id, { cancel_at_period_end: true });
  await admin.from('subscribers').update({
    cancel_at_period_end: true,
    subscription_end: new Date(updated.current_period_end * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('user_id', userId);
  return {
    ok: true as const,
    already: false,
    currentPeriodEnd: new Date(updated.current_period_end * 1000).toISOString(),
  };
};

export const sendWelcomeIfNeeded = async (admin: AdminClient, user: { id: string; email: string; emailConfirmedAt: string | null; name: string }) => {
  if (!user.emailConfirmedAt) return { ok: true as const, skipped: 'unconfirmed' as const };
  const { data: profile } = await admin.from('users').select('welcome_email_sent_at').eq('userid', user.id).maybeSingle();
  if (profile?.welcome_email_sent_at) return { ok: true as const, skipped: 'already_sent' as const };
  const mailed = await sendLifecycleEmail(admin, {
    kind: 'welcome',
    to: user.email,
    dedupeKey: `welcome:${user.id}`,
    vars: { name: user.name || 'there' },
  });
  if (!mailed.ok) return { ok: false as const, error: mailed.error ?? 'email_failed' };
  await admin.from('users').update({ welcome_email_sent_at: new Date().toISOString() }).eq('userid', user.id);
  return { ok: true as const, sent: true as const };
};

export const billingReturnUrl = `${APP_ORIGIN}/profile?tab=billing`;
export { FREE_EDITABLE_ITINERARIES };
