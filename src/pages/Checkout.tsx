import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { format, addDays, differenceInCalendarDays, parseISO } from 'date-fns';
import {
  Loader2, ArrowLeft, ShieldCheck, Calendar, Users, BedDouble, Plane, MapPin,
  Hotel as HotelIcon, ChevronDown, ChevronUp, Info, AlertTriangle, Minus, Plus,
  Sparkles, RefreshCw,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useStripePublishableKey } from '@/hooks/useStripePublishableKey';
import { useTaxesAndFeesRate } from '@/hooks/useTaxesAndFeesRate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { formatMoney, cn } from '@/lib/utils';
import { formatDualTime } from '@/lib/date-time';

interface QuoteItem {
  cart_item_id: string;
  type: string;
  name: string;
  new_price: number;
  old_price?: number;
  provider: string;
  status: string;
  service_dates?: Record<string, any> | null;
  occupancy?: Record<string, any> | null;
  pricing?: Record<string, any> | null;
  booking_context?: Record<string, any> | null;
  selected_product?: Record<string, any> | null;
  policies?: Record<string, any> | null;
  provider_quote?: Record<string, any> | null;
  earnings?: Record<string, any> | null;
  external_id?: string | null;
  service_timezone?: string | null;
  service_location?: Record<string, any> | null;
  service_timing?: Record<string, any> | null;
}

interface ProfileLite {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  cell?: string | number | null;
  currency?: string | null;
}

interface SavedTraveler {
  id: string;
  label?: string | null;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  dob?: string | null;
  nationality?: string | null;
  passport_number?: string | null;
  passport_expiry?: string | null;
  is_self: boolean;
}

interface PrefsLite {
  default_payer_mode?: string | null;
  preferred_currency?: string | null;
}

type Stage = 'loading' | 'review' | 'payment' | 'expired';
type PayerMode = 'single_payer' | 'slice';

type FieldDef = {
  key: string;
  label: string;
  type?: string;
  required?: boolean;
  advanced?: boolean;
  placeholder?: string;
};

const BASE_FIELDS: FieldDef[] = [
  { key: 'first_name', label: 'First name', required: true },
  { key: 'last_name', label: 'Last name', required: true },
  { key: 'email', label: 'Email', type: 'email', required: true },
  { key: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: '+1 555 555 5555' },
];

const DOC_FIELDS: FieldDef[] = [
  { key: 'dob', label: 'Date of birth', type: 'date', required: true, advanced: true },
  { key: 'nationality', label: 'Nationality (e.g. US)', required: true, advanced: true },
  { key: 'passport_number', label: 'Passport number', required: true, advanced: true },
  { key: 'passport_expiry', label: 'Passport expiry', type: 'date', required: true, advanced: true },
];

function fieldsFor(type: string): FieldDef[] {
  return type.toLowerCase() === 'flight' ? [...BASE_FIELDS, ...DOC_FIELDS] : BASE_FIELDS;
}

function defaultDates(type: string): { start: string; end: string; nights: number } {
  const today = new Date();
  const t = type.toLowerCase();
  if (t === 'hotel' || t === 'rental') {
    const end = addDays(today, 2);
    return { start: format(today, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd'), nights: 2 };
  }
  const dateOnly = format(today, 'yyyy-MM-dd');
  return { start: dateOnly, end: dateOnly, nights: 0 };
}

function extractDates(item: QuoteItem): { start: string; end: string; tentative: boolean; nights: number } {
  const sd = item.service_dates || {};
  const start = sd.check_in || sd.checkIn || sd.start || sd.startDate || sd.depart || sd.date || null;
  const end = sd.check_out || sd.checkOut || sd.end || sd.endDate || sd.return || null;
  if (start) {
    const s = String(start).slice(0, 10);
    const e = end ? String(end).slice(0, 10) : s;
    let nights = 0;
    try { nights = Math.max(0, differenceInCalendarDays(parseISO(e), parseISO(s))); } catch { /* noop */ }
    return { start: s, end: e, tentative: false, nights };
  }
  const d = defaultDates(item.type);
  return { ...d, tentative: true };
}

function getRoomLabel(item: QuoteItem): string | null {
  const selected: any = item.selected_product || {};
  if (selected.room_name || selected.rate_name) {
    return [selected.room_name, selected.rate_name].filter(Boolean).join(' · ');
  }
  const sd: any = item.service_dates || {};
  return sd.room || sd.room_type || sd.bed_type || sd.cabin || sd.fare_class || null;
}

function getItemPolicy(item: QuoteItem): { cancellation: string; payment: string; change: string; captured: boolean } {
  const policy: any = item.policies || {};
  if (policy.cancellation_summary || policy.payment_timing) {
    return {
      cancellation: policy.cancellation_summary || 'Review the provider cancellation terms.',
      payment: policy.payment_timing || 'Payment timing is confirmed by the provider.',
      change: 'Changes require a refreshed room and rate selection.',
      captured: true,
    };
  }
  return { ...getDefaultPolicy(item.type), captured: false };
}

function getDefaultPolicy(type: string): { cancellation: string; payment: string; change: string } {
  const t = type.toLowerCase();
  if (t === 'flight') {
    return {
      cancellation: 'Non-refundable after ticketing. 24-hour free cancellation if booked 7+ days before departure (US DOT rule).',
      payment: 'Charged in full at booking.',
      change: 'Changes subject to airline fare rules and fee differences.',
    };
  }
  if (t === 'activity') {
    return {
      cancellation: 'Free cancellation up to 24 hours before start. Non-refundable thereafter.',
      payment: 'Charged in full at booking.',
      change: 'One free reschedule subject to availability.',
    };
  }
  return {
    cancellation: 'Free cancellation up to 48 hours before check-in. Non-refundable thereafter.',
    payment: 'Charged in full at booking.',
    change: 'Date changes subject to availability and rate differences.',
  };
}

const ICONS: Record<string, JSX.Element> = {
  hotel: <HotelIcon className="h-4 w-4" />,
  flight: <Plane className="h-4 w-4" />,
  activity: <MapPin className="h-4 w-4" />,
};

export default function Checkout() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const quoteId = params.get('quote_id') ?? '';
  const { data: stripeCfg } = useStripePublishableKey();
  const { combinedRate, label: taxesLabel } = useTaxesAndFeesRate();

  const [stage, setStage] = useState<Stage>('loading');
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [datesByItem, setDatesByItem] = useState<Record<string, { start: string; end: string; tentative: boolean; nights: number }>>({});
  const [paxByItem, setPaxByItem] = useState<Record<string, number>>({});
  const [travelers, setTravelers] = useState<Record<string, Record<string, string>>>({});
  const [profile, setProfile] = useState<ProfileLite | null>(null);
  const [savedTravelers, setSavedTravelers] = useState<SavedTraveler[]>([]);
  const [currency, setCurrency] = useState<string>('USD');
  const [payerMode, setPayerMode] = useState<PayerMode>('single_payer');
  const [showDocs, setShowDocs] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [repricing, setRepricing] = useState(false);
  const [lastRepricedAt, setLastRepricedAt] = useState<Date | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

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
      if ((data as any).expired) { setStage('expired'); return; }
      const q = (data as any).quote;
      const bookable: QuoteItem[] = (q.items as any[]).filter(
        (v) => v.status === 'available' || v.status === 'price_changed'
      );
      const prof: ProfileLite | null = (data as any).profile || null;
      const saved: SavedTraveler[] = (data as any).saved_travelers || [];
      const prefs: PrefsLite | null = (data as any).preferences || null;
      const existingRows: any[] = (data as any).travelers || [];

      setItems(bookable);
      setProfile(prof);
      setSavedTravelers(saved);
      setCurrency((prefs?.preferred_currency || prof?.currency || q.currency || 'USD').toUpperCase());
      setPayerMode((prefs?.default_payer_mode === 'slice' ? 'slice' : 'single_payer'));

      const datesMap: Record<string, { start: string; end: string; tentative: boolean; nights: number }> = {};
      const paxMap: Record<string, number> = {};
      const trMap: Record<string, Record<string, string>> = {};
      bookable.forEach((it) => {
        datesMap[it.cart_item_id] = extractDates(it);
        const sd: any = it.service_dates || {};
        const occupancy: any = it.occupancy || {};
        paxMap[it.cart_item_id] = Number(
          occupancy.adults || sd.pax || sd.guests || sd.adults || 1
        ) + Number(occupancy.children || 0);
        const existing = existingRows.find((t: any) => t.cart_item_id === it.cart_item_id);
        const lead = existing?.traveler_data?.lead;
        if (lead && Object.keys(lead).length > 0) {
          trMap[it.cart_item_id] = lead;
        } else if (prof) {
          trMap[it.cart_item_id] = {
            first_name: prof.first_name || '',
            last_name: prof.last_name || '',
            email: prof.email || '',
            phone: prof.cell ? String(prof.cell) : '',
          };
        } else {
          trMap[it.cart_item_id] = {};
        }
      });
      setDatesByItem(datesMap);
      setPaxByItem(paxMap);
      setTravelers(trMap);
      setStage('review');
      setHasLoaded(true);
    })();
  }, [quoteId, navigate, toast]);

  const updateField = (cartItemId: string, key: string, value: string) =>
    setTravelers((prev) => ({ ...prev, [cartItemId]: { ...(prev[cartItemId] || {}), [key]: value } }));

  const applySavedTraveler = (cartItemId: string, st: SavedTraveler) =>
    setTravelers((prev) => ({
      ...prev,
      [cartItemId]: {
        first_name: st.first_name,
        last_name: st.last_name,
        email: st.email || '',
        phone: st.phone || '',
        dob: st.dob || '',
        nationality: st.nationality || '',
        passport_number: st.passport_number || '',
        passport_expiry: st.passport_expiry || '',
      },
    }));

  const setDate = (cartItemId: string, key: 'start' | 'end', value: string) => {
    setDatesByItem((prev) => {
      const cur = prev[cartItemId];
      const next = { ...cur, [key]: value, tentative: false };
      try {
        next.nights = Math.max(0, differenceInCalendarDays(parseISO(next.end), parseISO(next.start)));
      } catch { /* noop */ }
      return { ...prev, [cartItemId]: next };
    });
  };

  const setPax = (cartItemId: string, delta: number) =>
    setPaxByItem((prev) => ({ ...prev, [cartItemId]: Math.max(1, Math.min(20, (prev[cartItemId] || 1) + delta)) }));

  // Live re-quote: on first load AND whenever dates/pax change, ask the
  // server to recompute the quote. Debounced 600ms so date pickers /
  // guest steppers don't fire on every keystroke.
  useEffect(() => {
    if (!hasLoaded || !quoteId || items.length === 0) return;
    const t = setTimeout(() => {
      const overrides = items.map((it) => {
        const d = datesByItem[it.cart_item_id];
        return {
          cart_item_id: it.cart_item_id,
          check_in: d?.start,
          check_out: d?.end,
          pax: paxByItem[it.cart_item_id] || 1,
        };
      });
      setRepricing(true);
      supabase.functions
        .invoke('reprice-quote', { body: { quote_id: quoteId, overrides } })
        .then(({ data, error }) => {
          if (error || !data) return;
          const next = (data as any).items as QuoteItem[];
          if (Array.isArray(next)) {
            setItems(next);
          }
          setLastRepricedAt(new Date());
        })
        .catch(() => {/* silent — keep last good prices */})
        .finally(() => setRepricing(false));
    }, 600);
    return () => clearTimeout(t);
    // We intentionally key off serialized dates + pax so React re-fires when
    // any per-item value changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasLoaded, quoteId, JSON.stringify(datesByItem), JSON.stringify(paxByItem)]);

  const validateForms = (): string | null => {
    for (const it of items) {
      const flds = fieldsFor(it.type).filter((f) => !f.advanced || (it.type === 'flight'));
      for (const f of flds) {
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
        lead: travelers[it.cart_item_id] || {},
        additional: [],
        pax: paxByItem[it.cart_item_id] || 1,
      }));
      const { error: saveErr } = await supabase.functions.invoke('save-traveler-details', {
        body: { quote_id: quoteId, travelers: payload },
      });
      if (saveErr) throw new Error((saveErr as any)?.message || 'Could not save traveler details');

      const { data, error } = await supabase.functions.invoke('create-booking-checkout', {
        body: { quote_id: quoteId, ui_mode: 'embedded', payer_mode: payerMode, currency },
      });
      if (error) {
        const serverMsg = (data as any)?.error || (error as any)?.message;
        throw new Error(typeof serverMsg === 'string' ? serverMsg : 'Checkout failed');
      }
      const secret = (data as any)?.client_secret;
      if (!secret) throw new Error('Stripe did not return a client secret');
      setClientSecret(secret);
      setStage('payment');
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + Number(i.new_price || 0), 0),
    [items]
  );
  const taxesAndFees = useMemo(() => Math.round(subtotal * combinedRate * 100) / 100, [subtotal, combinedRate]);
  const grandTotal = useMemo(() => Math.round((subtotal + taxesAndFees) * 100) / 100, [subtotal, taxesAndFees]);
  const perPersonTotal = useMemo(() => {
    const totalPax = items.reduce((s, i) => s + (paxByItem[i.cart_item_id] || 1), 0) || 1;
    return grandTotal / totalPax;
  }, [grandTotal, items, paxByItem]);

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="container max-w-3xl mx-auto px-4 py-6 space-y-5">
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

        {stage === 'review' && (
          <>
            {/* Payer mode toggle */}
            <Card>
              <CardContent className="p-4">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Who's paying?
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayerMode('single_payer')}
                    className={cn(
                      'rounded-md border px-3 py-2 text-left text-sm transition',
                      payerMode === 'single_payer'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/40'
                    )}
                  >
                    <div className="font-medium">I'll pay it all</div>
                    <div className="text-xs text-muted-foreground">
                      You front {formatMoney(grandTotal, currency)} and the rest is added to the trip budget as owed to you.
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayerMode('slice')}
                    className={cn(
                      'rounded-md border px-3 py-2 text-left text-sm transition',
                      payerMode === 'slice'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/40'
                    )}
                  >
                    <div className="font-medium">Just my slice</div>
                    <div className="text-xs text-muted-foreground">
                      Pay ~{formatMoney(perPersonTotal, currency)} for your share — others get an invite to pay theirs.
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Item review cards */}
            <div className="space-y-4">
              {items.map((it) => {
                const d = datesByItem[it.cart_item_id];
                const pax = paxByItem[it.cart_item_id] || 1;
                const room = getRoomLabel(it);
                const policy = getItemPolicy(it);
                const t = it.type.toLowerCase();
                const isHotel = t === 'hotel' || t === 'rental';
                const lockedHotelSelection = isHotel && Boolean(it.selected_product?.room_id && it.selected_product?.rate_id);
                const rooms = Math.max(1, Number(it.occupancy?.rooms || 1));
                const nightly = isHotel && d?.nights ? it.new_price / (d.nights * rooms) : null;
                const docsOpen = !!showDocs[it.cart_item_id];
                const serviceTime = it.service_timing?.kind === 'scheduled'
                  ? formatDualTime(
                      it.service_timing.starts_at_utc,
                      it.service_timing.service_timezone || it.service_timezone,
                    )
                  : null;
                const localServiceTime = serviceTime?.service || (
                  it.service_timing?.kind === 'scheduled' && it.service_timing.local_start
                    ? `${it.service_timing.local_start}${it.service_timing.service_timezone ? ` (${it.service_timing.service_timezone})` : ''}`
                    : null
                );
                return (
                  <Card key={it.cart_item_id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="gap-1 text-xs capitalize">
                              {ICONS[t] ?? <Sparkles className="h-3 w-3" />} {it.type}
                            </Badge>
                            {it.status === 'price_changed' && (
                              <Badge variant="outline" className="text-xs gap-1 border-amber-500/40 text-amber-700 dark:text-amber-400">
                                <AlertTriangle className="h-3 w-3" /> Price changed
                              </Badge>
                            )}
                            {d?.tentative && (
                              <Badge variant="outline" className="text-xs gap-1 border-amber-500/40 text-amber-700 dark:text-amber-400">
                                <Info className="h-3 w-3" /> Tentative dates — confirm
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-base leading-tight">{it.name}</CardTitle>
                          <div className="text-xs text-muted-foreground capitalize">{it.provider || 'manual'}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-base font-semibold tabular-nums">
                            {formatMoney(it.new_price, currency)}
                          </div>
                          {nightly && (
                            <div className="text-[11px] text-muted-foreground">
                              {formatMoney(nightly, currency)} × {d.nights} night{d.nights === 1 ? '' : 's'}
                              {rooms > 1 ? ` × ${rooms} rooms` : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Booking specifics: dates + pax + room */}
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {isHotel ? 'Check-in' : t === 'flight' ? 'Depart' : 'Date'}
                          </Label>
                          <Input
                            type="date"
                            value={d?.start || ''}
                            onChange={(e) => setDate(it.cart_item_id, 'start', e.target.value)}
                            disabled={lockedHotelSelection}
                          />
                        </div>
                        {(isHotel || t === 'flight') && (
                          <div className="space-y-1">
                            <Label className="text-xs flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {isHotel ? 'Check-out' : 'Return'}
                            </Label>
                            <Input
                              type="date"
                              value={d?.end || ''}
                              onChange={(e) => setDate(it.cart_item_id, 'end', e.target.value)}
                              disabled={lockedHotelSelection}
                            />
                          </div>
                        )}
                        <div className="space-y-1">
                          <Label className="text-xs flex items-center gap-1">
                            <Users className="h-3 w-3" /> Guests
                          </Label>
                          <div className="flex items-center gap-2">
                            <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => setPax(it.cart_item_id, -1)} disabled={lockedHotelSelection}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <div className="w-10 text-center text-sm font-medium tabular-nums">{pax}</div>
                            <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => setPax(it.cart_item_id, 1)} disabled={lockedHotelSelection}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        {(room || isHotel) && (
                          <div className="space-y-1">
                            <Label className="text-xs flex items-center gap-1">
                              <BedDouble className="h-3 w-3" /> Room
                            </Label>
                            <div className="text-sm py-2">
                              {room || (
                                <span className="text-muted-foreground italic">Standard (to be confirmed)</span>
                              )}
                              {lockedHotelSelection && (
                                <div className="text-xs text-muted-foreground mt-1">Dates and guests are locked to this rate. Reselect the room to change them.</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {localServiceTime && (
                        <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                          <div className="font-medium">Local service time</div>
                          <div className="text-muted-foreground">{localServiceTime}</div>
                          {serviceTime.viewer && (
                            <div className="text-xs text-muted-foreground mt-1">Your time: {serviceTime.viewer}</div>
                          )}
                        </div>
                      )}

                      {/* Saved-traveler picker */}
                      {savedTravelers.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          <span className="text-xs text-muted-foreground self-center mr-1">Prefill from:</span>
                          {savedTravelers.slice(0, 4).map((st) => (
                            <Button
                              key={st.id}
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => applySavedTraveler(it.cart_item_id, st)}
                            >
                              {st.label || `${st.first_name} ${st.last_name}`}
                              {st.is_self && <span className="ml-1 opacity-60">(you)</span>}
                            </Button>
                          ))}
                        </div>
                      )}

                      {/* Traveler fields */}
                      <div className="grid sm:grid-cols-2 gap-3">
                        {BASE_FIELDS.map((f) => (
                          <div key={f.key} className="space-y-1">
                            <Label htmlFor={`${it.cart_item_id}-${f.key}`} className="text-xs">
                              {f.label}
                            </Label>
                            <Input
                              id={`${it.cart_item_id}-${f.key}`}
                              type={f.type || 'text'}
                              placeholder={f.placeholder}
                              value={travelers[it.cart_item_id]?.[f.key] || ''}
                              onChange={(e) => updateField(it.cart_item_id, f.key, e.target.value)}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Optional travel docs (flight = always; hotel/activity = collapsible) */}
                      {t === 'flight' ? (
                        <div className="grid sm:grid-cols-2 gap-3">
                          {DOC_FIELDS.map((f) => (
                            <div key={f.key} className="space-y-1">
                              <Label htmlFor={`${it.cart_item_id}-${f.key}`} className="text-xs">{f.label}</Label>
                              <Input
                                id={`${it.cart_item_id}-${f.key}`}
                                type={f.type || 'text'}
                                value={travelers[it.cart_item_id]?.[f.key] || ''}
                                onChange={(e) => updateField(it.cart_item_id, f.key, e.target.value)}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Collapsible open={docsOpen} onOpenChange={(o) => setShowDocs((p) => ({ ...p, [it.cart_item_id]: o }))}>
                          <CollapsibleTrigger asChild>
                            <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
                              {docsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              Add travel docs (optional)
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="grid sm:grid-cols-2 gap-3 pt-2">
                            {DOC_FIELDS.map((f) => (
                              <div key={f.key} className="space-y-1">
                                <Label htmlFor={`${it.cart_item_id}-${f.key}`} className="text-xs">{f.label}</Label>
                                <Input
                                  id={`${it.cart_item_id}-${f.key}`}
                                  type={f.type || 'text'}
                                  value={travelers[it.cart_item_id]?.[f.key] || ''}
                                  onChange={(e) => updateField(it.cart_item_id, f.key, e.target.value)}
                                />
                              </div>
                            ))}
                          </CollapsibleContent>
                        </Collapsible>
                      )}

                      {/* Policies */}
                      <Collapsible>
                        <CollapsibleTrigger asChild>
                          <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 text-muted-foreground">
                            <Info className="h-3 w-3" /> Cancellation & policies
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-2 space-y-1.5 text-xs text-muted-foreground">
                          <div><span className="font-medium text-foreground">Cancellation:</span> {policy.cancellation}</div>
                          <div><span className="font-medium text-foreground">Payment:</span> {policy.payment}</div>
                          <div><span className="font-medium text-foreground">Changes:</span> {policy.change}</div>
                          <div className="italic">
                            {policy.captured ? 'Policy captured with the selected provider rate.' : 'Default policy — confirmed with provider after booking.'}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Breakdown */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Price breakdown</CardTitle>
                {repricing ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Checking live availability…
                  </span>
                ) : lastRepricedAt ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <RefreshCw className="h-3 w-3" /> Updated {format(lastRepricedAt, 'HH:mm')}
                  </span>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {items.map((it) => {
                  const d = datesByItem[it.cart_item_id];
                  const isHotel = (it.type || '').toLowerCase() === 'hotel';
                  const rooms = Math.max(1, Number(it.occupancy?.rooms || 1));
                  const nightly = isHotel && d?.nights ? it.new_price / (d.nights * rooms) : null;
                  return (
                    <div key={it.cart_item_id} className="flex justify-between gap-2">
                      <div className="text-muted-foreground min-w-0 truncate">
                        {it.name}
                        {nightly && <span className="text-xs"> · {formatMoney(nightly, currency)} × {d.nights}n{rooms > 1 ? ` × ${rooms} rooms` : ''}</span>}
                      </div>
                      <div className="tabular-nums shrink-0">{formatMoney(it.new_price, currency)}</div>
                    </div>
                  );
                })}
                <Separator className="my-2" />
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{formatMoney(subtotal, currency)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{taxesLabel}</span>
                  <span className="tabular-nums">{formatMoney(taxesAndFees, currency)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-base font-semibold">Total</span>
                  <span className="tabular-nums text-2xl font-bold text-primary">
                    {formatMoney(grandTotal, currency)}
                    <span className="ml-1 text-xs font-medium text-muted-foreground">{currency}</span>
                  </span>
                </div>
                {payerMode === 'slice' && (
                  <div className="text-xs text-muted-foreground pt-1">
                    Your slice today: <span className="font-medium text-foreground">{formatMoney(perPersonTotal, currency)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {stage === 'payment' && clientSecret && stripeCfg?.stripePromise && (
          <Card>
            <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
            <CardContent>
              <div id="checkout">
                <EmbeddedCheckoutProvider stripe={stripeCfg.stripePromise} options={{ clientSecret }}>
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

      {/* Sticky checkout bar */}
      {stage === 'review' && (
        <div className="fixed bottom-0 inset-x-0 z-30 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 py-3">
          <div className="container max-w-3xl mx-auto flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-muted-foreground">
                {items.length} item{items.length === 1 ? '' : 's'} · {taxesLabel}
                {repricing && <span className="ml-2 inline-flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> updating…</span>}
              </div>
              <div className="tabular-nums text-xl font-bold text-primary">
                {formatMoney(payerMode === 'slice' ? perPersonTotal : grandTotal, currency)}
                <span className="ml-1 text-[11px] font-medium text-muted-foreground">{currency}</span>
              </div>
            </div>
            <Button size="lg" onClick={handleContinue} disabled={submitting || repricing} className="shrink-0">
              {submitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Preparing…</>
              ) : (
                <>Continue to payment</>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
