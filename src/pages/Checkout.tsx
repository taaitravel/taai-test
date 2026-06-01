import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useStripePublishableKey } from '@/hooks/useStripePublishableKey';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface QuoteItem {
  cart_item_id: string;
  type: string;
  name: string;
  new_price: number;
  provider: string;
  status: string;
}

interface TravelerRow {
  cart_item_id: string;
  item_type: string;
  traveler_data: Record<string, string>;
}

type Stage = 'loading' | 'travelers' | 'payment' | 'expired';

function fieldsFor(type: string): { key: string; label: string; type?: string; required?: boolean }[] {
  switch (type) {
    case 'flight':
      return [
        { key: 'full_name', label: 'Full name (as on passport)', required: true },
        { key: 'date_of_birth', label: 'Date of birth', type: 'date', required: true },
        { key: 'passport_number', label: 'Passport number', required: true },
      ];
    case 'hotel':
      return [
        { key: 'full_name', label: 'Guest name', required: true },
        { key: 'email', label: 'Email', type: 'email', required: true },
      ];
    default:
      return [{ key: 'full_name', label: 'Full name', required: true }];
  }
}

export default function Checkout() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const quoteId = params.get('quote_id') ?? '';
  const { data: stripeCfg } = useStripePublishableKey();

  const [stage, setStage] = useState<Stage>('loading');
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [travelers, setTravelers] = useState<Record<string, Record<string, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    if (!quoteId) {
      navigate('/cart', { replace: true });
      return;
    }
    (async () => {
      const { data, error } = await supabase.functions.invoke('get-checkout-quote', {
        body: { quote_id: quoteId },
      });
      if (error || !data) {
        toast({ title: 'Could not load checkout', variant: 'destructive' });
        navigate('/cart', { replace: true });
        return;
      }
      if ((data as any).expired) {
        setStage('expired');
        return;
      }
      const q = (data as any).quote;
      const bookable: QuoteItem[] = (q.items as any[]).filter(
        (v) => v.status === 'available' || v.status === 'price_changed'
      );
      setItems(bookable);
      const existing: TravelerRow[] = (data as any).travelers || [];
      const map: Record<string, Record<string, string>> = {};
      bookable.forEach((it) => {
        const found = existing.find((t) => t.cart_item_id === it.cart_item_id);
        map[it.cart_item_id] = (found?.traveler_data as Record<string, string>) || {};
      });
      setTravelers(map);
      setStage('travelers');
    })();
  }, [quoteId, navigate, toast]);

  const updateField = (cartItemId: string, key: string, value: string) => {
    setTravelers((prev) => ({
      ...prev,
      [cartItemId]: { ...(prev[cartItemId] || {}), [key]: value },
    }));
  };

  const validateForms = (): string | null => {
    for (const it of items) {
      for (const f of fieldsFor(it.type)) {
        if (f.required && !travelers[it.cart_item_id]?.[f.key]?.trim()) {
          return `Please complete "${f.label}" for ${it.name}.`;
        }
      }
    }
    return null;
  };

  const handleContinue = async () => {
    const err = validateForms();
    if (err) {
      toast({ title: 'Missing details', description: err, variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const payload = items.map((it) => ({
        cart_item_id: it.cart_item_id,
        item_type: it.type,
        traveler_data: travelers[it.cart_item_id] || {},
      }));
      const { error: saveErr } = await supabase.functions.invoke('save-traveler-details', {
        body: { quote_id: quoteId, travelers: payload },
      });
      if (saveErr) throw saveErr;

      const { data, error } = await supabase.functions.invoke('create-booking-checkout', {
        body: { quote_id: quoteId, ui_mode: 'embedded' },
      });
      if (error) throw error;
      const secret = (data as any)?.client_secret;
      if (!secret) throw new Error('Stripe did not return a client secret');
      setClientSecret(secret);
      setStage('payment');
    } catch (e: any) {
      toast({
        title: 'Could not start payment',
        description: e.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const total = useMemo(
    () => items.reduce((s, i) => s + Number(i.new_price || 0), 0),
    [items]
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/cart')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to cart
          </Button>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ShieldCheck className="h-3 w-3" /> Secure checkout
          </div>
        </div>

        {stage === 'loading' && (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Preparing your checkout…
          </div>
        )}

        {stage === 'expired' && (
          <Card>
            <CardHeader><CardTitle>Quote expired</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Your price quote has expired. Return to your cart to refresh availability and pricing.
              </p>
              <Button onClick={() => navigate('/cart')}>Return to cart</Button>
            </CardContent>
          </Card>
        )}

        {stage === 'travelers' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Traveler details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {items.map((it) => (
                  <div key={it.cart_item_id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{it.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {it.type} · {it.provider}
                        </div>
                      </div>
                      <div className="text-sm tabular-nums">
                        ${Number(it.new_price).toFixed(2)}
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {fieldsFor(it.type).map((f) => (
                        <div key={f.key} className="space-y-1">
                          <Label htmlFor={`${it.cart_item_id}-${f.key}`} className="text-xs">
                            {f.label}
                          </Label>
                          <Input
                            id={`${it.cart_item_id}-${f.key}`}
                            type={f.type || 'text'}
                            value={travelers[it.cart_item_id]?.[f.key] || ''}
                            onChange={(e) => updateField(it.cart_item_id, f.key, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                    <Separator />
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2">
                  <div className="text-sm text-muted-foreground">
                    Subtotal ({items.length} item{items.length === 1 ? '' : 's'})
                  </div>
                  <div className="text-base font-semibold tabular-nums">
                    ${total.toFixed(2)}
                  </div>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleContinue}
                  disabled={submitting}
                >
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Preparing payment…</>
                  ) : (
                    'Continue to payment'
                  )}
                </Button>
                <p className="text-[11px] text-muted-foreground text-center">
                  Taxes & fees calculated on the next step.
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {stage === 'payment' && clientSecret && stripeCfg?.stripePromise && (
          <Card>
            <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
            <CardContent>
              <div id="checkout">
                <EmbeddedCheckoutProvider
                  stripe={stripeCfg.stripePromise}
                  options={{ clientSecret }}
                >
                  <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
              </div>
            </CardContent>
          </Card>
        )}

        {stage === 'payment' && (!clientSecret || !stripeCfg?.stripePromise) && (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading Stripe…
          </div>
        )}
      </div>
    </div>
  );
}