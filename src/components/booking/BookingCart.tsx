import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Trash2, Calendar, CreditCard, Plane, Hotel, MapPin, Loader2, Info, Briefcase, Users } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useBookingCheckout } from '@/hooks/useBookingCheckout';
import { useTaxesAndFeesRate } from '@/hooks/useTaxesAndFeesRate';
import { SplitCostDialog } from '@/components/booking/SplitCostDialog';
import { SplitChip } from '@/components/booking/SplitChip';
import type { CartItemSplit } from '@/hooks/useCartItemSplits';

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
  const { toast } = useToast();
  const { user } = useAuth();
  const { isLoading: isCheckingOut, startCheckout } = useBookingCheckout();
  const { label: taxesLabel, compute: computeTaxes } = useTaxesAndFeesRate();

  useEffect(() => { fetchCartItems(); }, [itineraryId]);

  const fetchCartItems = async () => {
    try {
      let query = supabase.from('cart_items').select('*').order('saved_at', { ascending: false });
      if (itineraryId) query = query.eq('itinerary_id', itineraryId);
      const { data, error } = await query;
      if (error) throw error;
      const items = (data || []).filter((d: any) => d.booking_status !== 'booked') as CartItem[];
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
          .select('*')
          .in('cart_item_id', itemIds);
        const grouped: Record<string, CartItemSplit[]> = {};
        ((splitRows as CartItemSplit[]) || []).forEach((s) => {
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
    const checkoutItems = items.map(item => ({
      cart_item_id: item.id,
      type: item.type,
      name: item.item_data?.name || item.external_ref || item.type,
      price: item.price,
      provider: item.item_data?.provider || item.item_data?.source || 'unknown',
      item_data: item.item_data || {},
      guest_details: item.item_data?.guest_details,
      service_dates: item.item_data?.service_dates,
    }));
    await startCheckout(checkoutItems, itineraryId ? parseInt(itineraryId) : undefined);
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
    const sd = item.item_data?.service_dates;
    if (!sd) return null;
    const start = sd.checkIn || sd.start || sd.startDate || sd.depart || sd.date;
    const end = sd.checkOut || sd.end || sd.endDate || sd.return;
    try {
      if (start && end) return `${format(new Date(start), 'MMM dd')} – ${format(new Date(end), 'MMM dd, yyyy')}`;
      if (start) return format(new Date(start), 'MMM dd, yyyy');
    } catch { /* ignore */ }
    return null;
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
        </CardTitle>
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
                        const itemSplits = splitsByItem[item.id] || [];
                        const tripBigintId = item.itinerary_id ? tripBigintIds[item.itinerary_id] : undefined;
                        return (
                          <div key={item.id} className="bg-background rounded-md p-4 border border-border space-y-1.5">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs gap-1">
                                {getItemIcon(item.type)}
                                <span>{item.type}</span>
                              </Badge>
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
