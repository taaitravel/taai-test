import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { PUBLISHED_LIMITS, normalizeTier } from '../../../supabase/functions/_shared/tier-map';

interface HistoryRow {
  date: string | null;
  description: string;
  amount: number;
  currency: string;
  status: string;
  amount_refunded: number;
  receipt_url: string | null;
  invoice_pdf: string | null;
  hosted_invoice_url: string | null;
  kind: 'subscription' | 'one_off';
}

const money = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(amount);

const readError = async (error: unknown) => {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.clone().json();
      return body?.error || 'Unable to load billing.';
    } catch {
      return 'Unable to load billing.';
    }
  }
  return error instanceof Error ? error.message : 'Unable to load billing.';
};

export const BillingSection = () => {
  const { subscriptionData, openCustomerPortal, loading: subLoading } = useSubscription();
  const { toast } = useToast();
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [portalBusy, setPortalBusy] = useState(false);
  const [note, setNote] = useState('');
  const tier = normalizeTier(subscriptionData?.subscription_tier) ?? 'traveler';
  const limits = PUBLISHED_LIMITS[tier];
  const renews = subscriptionData?.subscription_end
    ? new Date(subscriptionData.subscription_end).toLocaleDateString()
    : null;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('list-billing-history', { body: {} });
      if (cancelled) return;
      if (error) {
        toast({ title: 'Billing history unavailable', description: await readError(error), variant: 'destructive' });
        setHistory([]);
      } else {
        setHistory(Array.isArray(data?.history) ? data.history : []);
      }
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [toast]);

  const manage = async () => {
    setPortalBusy(true);
    try {
      const url = await openCustomerPortal();
      if (url) window.location.href = url;
    } finally {
      setPortalBusy(false);
    }
  };

  const requestRefund = async () => {
    const { error } = await supabase.functions.invoke('list-billing-history', {
      body: { action: 'refund_request', note },
    });
    if (error) {
      toast({ title: 'Could not send the request', description: await readError(error), variant: 'destructive' });
      return;
    }
    setNote('');
    toast({ title: 'Request sent', description: 'A person at taai reviews subscription refunds in Stripe. This is not a travel refund.' });
  };

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>
            Software subscription only. taai does not sell travel or take payment for flights, stays, or activities.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="gold-gradient text-primary-foreground">{limits ? tier.replaceAll('_', ' ') : 'Traveler'}</Badge>
            <Badge variant="outline">{subscriptionData?.subscribed ? 'Active' : 'Free'}</Badge>
            {renews && <span className="text-sm text-muted-foreground">{subscriptionData?.subscribed ? 'Renews' : 'Ended'} {renews}</span>}
          </div>
          <p className="text-sm text-muted-foreground">
            {limits.maxItineraries < 0 ? 'Unlimited trips' : `${limits.maxItineraries} trips`} · {limits.monthlyAiCredits < 0 ? 'Unlimited planning credits' : `${limits.monthlyAiCredits} planning credits / month`}
            {subscriptionData ? ` · ${subscriptionData.credits_remaining < 0 ? 'unlimited' : subscriptionData.credits_remaining} credits left this month` : ''}
          </p>
          <Button className="gold-gradient text-primary-foreground" onClick={manage} disabled={portalBusy || subLoading}>
            {portalBusy ? 'Opening…' : 'Manage or cancel'}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Invoices and charges</CardTitle>
          <CardDescription>Receipts and invoice PDFs open on Stripe for this account's customer.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">Loading billing history…</p> : history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No subscription charges yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {history.map((row, index) => (
                <li key={`${row.date}-${index}`} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{row.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {row.date ? new Date(row.date).toLocaleDateString() : 'Date unavailable'} · {row.kind === 'subscription' ? 'Subscription' : 'One-off charge'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{money(row.amount, row.currency)}</span>
                    <Badge variant="outline">{row.status}</Badge>
                    {row.receipt_url && <a className="text-sm text-primary underline" href={row.receipt_url} target="_blank" rel="noreferrer">Receipt</a>}
                    {row.invoice_pdf && <a className="text-sm text-primary underline" href={row.invoice_pdf} target="_blank" rel="noreferrer">Invoice PDF</a>}
                    {!row.invoice_pdf && row.hosted_invoice_url && <a className="text-sm text-primary underline" href={row.hosted_invoice_url} target="_blank" rel="noreferrer">Invoice</a>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Ask about a charge</CardTitle>
          <CardDescription>This sends a billing note. It does not refund anything by itself.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={1000}
            placeholder="Which charge should we look at?"
            className="min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <Button variant="outline" onClick={requestRefund} disabled={!note.trim()}>Send request</Button>
        </CardContent>
      </Card>
    </div>
  );
};
