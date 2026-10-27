import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';

export function PaymentFailedBanner() {
  const { subscriptionData, loading, openCustomerPortal } = useSubscription();
  const [busy, setBusy] = useState(false);

  if (loading || !subscriptionData?.payment_failed) return null;

  const retry = subscriptionData.payment_retry_at
    ? new Date(subscriptionData.payment_retry_at).toLocaleDateString()
    : null;

  const updatePayment = async () => {
    setBusy(true);
    try {
      const url = await openCustomerPortal();
      if (url) window.location.href = url;
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-b border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-foreground">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <p>
          Your last software-subscription payment did not go through
          {subscriptionData.payment_failure_summary ? `: ${subscriptionData.payment_failure_summary}` : ''}.
          The plan is paused until it succeeds. Your trips stay available.
          {retry ? ` Stripe will retry on ${retry}.` : ''}
        </p>
        <Button size="sm" variant="destructive" onClick={updatePayment} disabled={busy}>
          {busy ? 'Opening…' : 'Update payment'}
        </Button>
      </div>
    </div>
  );
}
