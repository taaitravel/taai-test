import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Trash2, Calendar, CreditCard, Plane, Hotel, MapPin, Loader2, Info, Briefcase, Users, CheckCircle2, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { CART_DETAIL_FIELDS, CART_SPLIT_FIELDS, PAGE_SIZES } from '@/lib/data/projections';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useBookingCheckout, type ValidationItem, type ValidationResult } from '@/hooks/useBookingCheckout';
import { useTaxesAndFeesRate } from '@/hooks/useTaxesAndFeesRate';
import { SplitCostDialog } from '@/components/booking/SplitCostDialog';
import { SplitChip } from '@/components/booking/SplitChip';
import type { CartItemSplit } from '@/hooks/useCartItemSplits';
import { formatDateOnlyRange, formatDualTime } from '@/lib/date-time';

interface CartItem {
  id: string;
  type: 'flight' | 'hotel' | 'activity';
  external_ref: string;
  price: number;
  item_data: any;
  saved_at: string;
  booking_status?: string;
  itinerary_id?: string | null;
  [key: string]: any;
}

interface BookingCartProps {
  itineraryId?: string;
  onCartUpdate?: (items: CartItem[]) => void;
}

const UNASSIGNED_KEY = '__unassigned__';

export const BookingCart: React.FC<BookingCartProps> = ({ itineraryId, onCartUpdate }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [tripNames, setTripNames] = useState<Record<string, string>>({});
  const [tripBigintIds, setTripBigintIds] = useState<Record<string, number>>({});
  const [splitsByItem, setSplitsByItem] = useState<Record<string, CartItemSplit[]>>({});
  const [splitDialog, setSplitDialog] = useState<{
    open: boolean;
    cartItemId: string | null;
    itineraryId: number | null;
    itemName: string;
    itemPrice: number;
  }>({ open: false, cartItemId: null, itineraryId: null, itemName: '', itemPrice: 0 });
  const [quoteName, setQuoteName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { isLoading: isCheckingOut, validateCart } = useBookingCheckout();
  const { label: taxesLabel, compute: computeTaxes } = useTaxesAndFeesRate();
  const navigate = useNavigate();

  useEffect(() => { fetchCartItems(); }, [itineraryId]);

  // Re-verify availability whenever the cart contents change.
  useEffect(() => {
    if (cartItems.length === 0) {
      setValidation(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setIsValidating(true);
      const ids = cartItems.map((c) => c.id);
      const itinNum = itineraryId ? tripBigintIds[itineraryId] : undefined;
      const result = await validateCart(ids, itinNum);
      if (!cancelled) setValidation(result);
      setIsValidating(false);
    })();
    return () => { cancelled = true; };
    // Intentionally key on item ids + count so adding/removing re-runs validation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems.map((c) => c.id).join(','), itineraryId, tripBigintIds]);

  const statusByItem = useMemo(() => {
    const m = new Map<string, ValidationItem>();
    validation?.items.forEach((v) => m.set(v.cart_item_id, v));
    return m;
  }, [validation]);

  const renderStatusBadge = (item: CartItem) => {
    const v = statusByItem.get(item.id);
    if (isValidating && !v) {
      return (
        <Badge variant="outline" className="text-xs gap-1">
          <Loader2 className="h-3 w-3 animate-spin" /> Checking availability…
        </Badge>
      );
    }
    if (!v) return null;
    switch (v.status) {
      case 'available':
        return (
          <Badge variant="outline" className="text-xs gap-1 border-emerald-500/40 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" /> Available
          </Badge>
        );
      case 'price_changed':
        return (
          <Badge variant="outline" className="text-xs gap-1 border-amber-500/40 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-3 w-3" />
            Price moved {formatPrice(v.old_price)} → {formatPrice(v.new_price)}
          </Badge>
        );
      case 'expired_date':
        return (
          <Badge variant="outline" className="text-xs gap-1 border-destructive/40 text-destructive">
            <XCircle className="h-3 w-3" /> Date is in the past
          </Badge>
        );
      case 'sold_out':
        return (
          <Badge variant="outline" className="text-xs gap-1 border-destructive/40 text-destructive">
            <XCircle className="h-3 w-3" /> Sold out
          </Badge>
        );
      case 'needs_review':
        return (
          <Badge variant="outline" className="text-xs gap-1 border-amber-500/40 text-amber-700 dark:text-amber-400">
            <Info className="h-3 w-3" /> Needs manual confirmation
          </Badge>
        );
    }
  };

  const fetchCartItems = async () => {
    try {
      let query = supabase
        .from('cart_items')
        .select(CART_DETAIL_FIELDS)
        .order('saved_at', { ascending: false })
        .limit(PAGE_SIZES.cartItems);
      if (itineraryId) query = query.eq('itinerary_id', itineraryId);
      const { data, error } = await query;
      if (error) throw error;
      const items = ((data || []) as unknown as CartItem[]).filter((d) => d.booking_status !== 'booked');
      setCartItems(items);
      onCartUpdate?.(items);

      const ids = Array.from(new Set(items.map(i => i.itinerary_id).filter(Boolean))) as string[];
      if (ids.length > 0) {
        const { data: trips } = await supabase
          .from('itinerary')
          .select('id, itin_id, itin_name')
          .in('itin_id', ids);
        const map: Record<string, string> = {};
        const bigintMap: Record<string, number> = {};
        (trips || []).forEach((t: any) => {
          if (t.itin_id) {
            map[t.itin_id] = t.itin_name || 'Untitled trip';
            if (typeof t.id === 'number') bigintMap[t.itin_id] = t.id;
          }
        });
        setTripNames(map);
        setTripBigintIds(bigintMap);
      } else {
        setTripNames({});
        setTripBigintIds({});
      }

      // Fetch splits for the current cart items.
      const itemIds = items.map((i) => i.id);
      if (itemIds.length > 0) {
        const { data: splitRows } = await supabase
          .from('cart_item_splits')
          .select(CART_SPLIT_FIELDS)
          .in('cart_item_id', itemIds);
        const grouped: Record<string, CartItemSplit[]> = {};
        ((splitRows as unknown as CartItemSplit[]) || []).forEach((s) => {
          if (!grouped[s.cart_item_id]) grouped[s.cart_item_id] = [];
          grouped[s.cart_item_id].push(s);
        });
        setSplitsByItem(grouped);
      } else {
        setSplitsByItem({});
      }
    } catch (error) {
      console.error('Error fetching cart items:', error);
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const { error } = await supabase.from('cart_items').delete().eq('id', itemId);
      if (error) throw error;
      toast({ title: 'Item removed', description: 'Item has been removed from your cart.' });
      fetchCartItems();
    } catch {
      toast({ title: 'Error', description: 'Failed to remove item.', variant: 'destructive' });
    }
  };

  const saveQuote = async () => {
    if (!quoteName.trim() || !user?.id) return;
    setIsSaving(true);
    try {
      const totalPrice = cartItems.reduce((s, i) => s + i.price, 0);
      const expiresAt = new Date(); expiresAt.setDate(expiresAt.getDate() + 7);
      const { error } = await supabase.from('quotes').insert([{
        user_id: user.id, quote_name: quoteName, total_price: totalPrice,
        items: cartItems as any, expires_at: expiresAt.toISOString(),
      }]);
      if (error) throw error;
      toast({ title: 'Price snapshot saved', description: `Quote "${quoteName}" saved (expires in 7 days).` });
      setQuoteName('');
    } catch {
      toast({ title: 'Error', description: 'Failed to save quote.', variant: 'destructive' });
    } finally { setIsSaving(false); }
  };

  const handleCheckout = async (items: CartItem[]) => {
    // Always validate immediately before charging so we use a fresh quote.
    const ids = items.map((i) => i.id);
    const itinNum = itineraryId ? tripBigintIds[itineraryId] : undefined;
    const fresh = await validateCart(ids, itinNum);
    if (!fresh) return;
    setValidation(fresh);

    const blocking = fresh.items.filter(
      (v) => v.status === 'expired_date' || v.status === 'sold_out' || v.status === 'needs_review'
    );
    if (blocking.length > 0) {
      toast({
        title: 'Cannot proceed yet',
        description: `${blocking.length} item(s) need your attention before checkout.`,
        variant: 'destructive',
      });
      return;
    }

    navigate(`/checkout?quote_id=${fresh.quote_id}`);
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'flight': return <Plane className="h-4 w-4" />;
      case 'hotel': return <Hotel className="h-4 w-4" />;
      case 'activity': return <MapPin className="h-4 w-4" />;
      default: return <ShoppingCart className="h-4 w-4" />;
    }
  };

  const formatPrice = (n: number) =>
    `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getServiceDateRange = (item: CartItem): string | null => {
    const sd = item.item_data?.service_dates || {};
    const start = sd.check_in || sd.checkIn || sd.start || sd.startDate || sd.depart || sd.date
      || item.item_data?.check_in || item.item_data?.checkIn;
    const end = sd.check_out || sd.checkOut || sd.end || sd.endDate || sd.return
      || item.item_data?.check_out || item.item_data?.checkOut;
    return formatDateOnlyRange(start, end, 'MMM dd', 'MMM dd, yyyy');
  };

  const getServiceTime = (item: CartItem) => {
    const timing = item.item_data?.service_timing;
    if (timing?.kind !== 'scheduled') return null;
    const dual = formatDualTime(timing.starts_at_utc, timing.service_timezone || item.item_data?.service_timezone);
    if (!dual.service && !timing.local_start) return null;
    return {
      primary: dual.service || `${timing.local_start}${timing.service_timezone ? ` (${timing.service_timezone})` : ''}`,
      secondary: dual.viewer ? `${dual.viewer} in your time` : null,
    };
  };

  const groups = useMemo(() => {
    const map = new Map<string, CartItem[]>();
    cartItems.forEach(item => {
      const key = item.itinerary_id || UNASSIGNED_KEY;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    });
    return Array.from(map.entries());
  }, [cartItems]);

  const computeTotals = (items: CartItem[]) => {
    const subtotal = items.reduce((s, i) => s + i.price, 0);
    const t = computeTaxes(subtotal);
    return { provider: t.subtotal, taxesAndFees: t.taxesAndFees, total: t.total };
  };

  const grand = computeTotals(cartItems);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <ShoppingCart className="h-5 w-5" />
          Booking Cart ({cartItems.length} items)
          {isValidating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </CardTitle>
        {validation && (
          <p className="text-xs text-muted-foreground">
            {validation.all_available
              ? 'All items verified & ready to book.'
              : `${validation.diffs.length} item(s) need attention.`}
            {' '}Quote expires {format(new Date(validation.expires_at), 'h:mm a')}.
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {cartItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Your cart is empty</p>
            <p className="text-sm">Add flights, hotels, or activities to get started</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {groups.map(([key, items]) => {
                const totals = computeTotals(items);
                const isUnassigned = key === UNASSIGNED_KEY;
                const tripName = isUnassigned ? 'Unassigned' : (tripNames[key] || 'Trip');
                return (
                  <div key={key} className="rounded-lg border border-rental/60 bg-rental/30 p-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-rental" />
                        <span className="font-semibold text-foreground">{tripName}</span>
                        <Badge variant="outline" className="text-xs">{items.length} item{items.length > 1 ? 's' : ''}</Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {items.map(item => {
                        const dateRange = getServiceDateRange(item);
                        const serviceTime = getServiceTime(item);
                        const itemSplits = splitsByItem[item.id] || [];
                        const tripBigintId = item.itinerary_id ? tripBigintIds[item.itinerary_id] : undefined;
                        return (
                          <div key={item.id} className="bg-background rounded-md p-4 border border-border space-y-1.5">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs gap-1">
                                {getItemIcon(item.type)}
                                <span>{item.type}</span>
                              </Badge>
                              {renderStatusBadge(item)}
                              <SplitChip splits={itemSplits} />
                            </div>
                            <div className="text-sm font-medium text-foreground break-words">
                              {item.item_data?.name || item.external_ref}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {item.item_data?.provider || 'Provider TBD'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Saved {format(new Date(item.saved_at), 'MMM dd, yyyy')}
                            </div>
                            {dateRange && (
                              <div className="text-xs text-muted-foreground">
                                Dates: {dateRange}
                              </div>
                            )}
                            {serviceTime && (
                              <div className="text-xs text-muted-foreground">
                                Time: {serviceTime.primary}
                                {serviceTime.secondary && <span className="block">{serviceTime.secondary}</span>}
                              </div>
                            )}
                            <div className="flex items-center justify-end gap-2 pt-1">
                              {tripBigintId && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setSplitDialog({
                                      open: true,
                                      cartItemId: item.id,
                                      itineraryId: tripBigintId,
                                      itemName: item.item_data?.name || item.external_ref || item.type,
                                      itemPrice: item.price,
                                    })
                                  }
                                  className="h-8 text-xs gap-1"
                                >
                                  <Users className="h-3 w-3" /> Split
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.id)} className="text-destructive hover:text-destructive h-8 w-8 p-0">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleCheckout([item])} disabled={isCheckingOut} className="text-xs h-8">
                                {isCheckingOut ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Book'}
                              </Button>
                              <span className="text-sm font-medium text-rental tabular-nums">{formatPrice(item.price)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-3 pt-3 border-t border-rental/40 space-y-1 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span><span>{formatPrice(totals.provider)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>{taxesLabel}</span><span>{formatPrice(totals.taxesAndFees)}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Trip total</span><span className="text-rental">{formatPrice(totals.total)}</span>
                      </div>
                      <Button onClick={() => handleCheckout(items)} disabled={isCheckingOut} className="w-full mt-2 bg-rental text-rental-foreground hover:bg-rental/90" size="sm">
                        {isCheckingOut ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
                        Checkout this trip — {formatPrice(totals.total)}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Grand subtotal ({cartItems.length} items)</span>
                <span>{formatPrice(grand.provider)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1">
                  {taxesLabel} <Info className="h-3 w-3" />
                </span>
                <span>{formatPrice(grand.taxesAndFees)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Grand total</span><span className="text-primary">{formatPrice(grand.total)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <Input placeholder="Save as price snapshot..." value={quoteName} onChange={(e) => setQuoteName(e.target.value)} className="text-sm" />
                <Button onClick={saveQuote} disabled={isSaving || !quoteName.trim()} variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-1" /> Save
                </Button>
              </div>

              <Button onClick={() => handleCheckout(cartItems)} disabled={isCheckingOut} className="w-full" size="lg">
                {isCheckingOut ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
                Checkout everything — {formatPrice(grand.total)}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Payments processed securely by Stripe. TAAI never sees your card details.
              </p>
            </div>
          </>
        )}
      </CardContent>
      <SplitCostDialog
        open={splitDialog.open}
        onOpenChange={(o) => setSplitDialog((s) => ({ ...s, open: o }))}
        cartItemId={splitDialog.cartItemId}
        itineraryId={splitDialog.itineraryId}
        itemName={splitDialog.itemName}
        itemPrice={splitDialog.itemPrice}
        onSaved={() => fetchCartItems()}
      />
    </Card>
  );
};
