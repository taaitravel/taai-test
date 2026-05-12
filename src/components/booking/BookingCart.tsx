import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Trash2, Calendar, CreditCard, Plane, Hotel, MapPin, Loader2, Info, Briefcase } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useBookingCheckout } from '@/hooks/useBookingCheckout';

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

const ADMIN_FEE_RATE = 0.01;
const TAX_RATE = 0.07;
const UNASSIGNED_KEY = '__unassigned__';

export const BookingCart: React.FC<BookingCartProps> = ({ itineraryId, onCartUpdate }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [tripNames, setTripNames] = useState<Record<string, string>>({});
  const [quoteName, setQuoteName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { isLoading: isCheckingOut, startCheckout } = useBookingCheckout();

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
          .select('itin_id, itin_name')
          .in('itin_id', ids);
        const map: Record<string, string> = {};
        (trips || []).forEach((t: any) => { if (t.itin_id) map[t.itin_id] = t.itin_name || 'Untitled trip'; });
        setTripNames(map);
      } else {
        setTripNames({});
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
    const provider = items.reduce((s, i) => s + i.price, 0);
    const adminFee = Math.round(provider * ADMIN_FEE_RATE * 100) / 100;
    const tax = Math.round(provider * TAX_RATE * 100) / 100;
    return { provider, adminFee, tax, total: provider + adminFee + tax };
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
                  <div key={key} className="rounded-lg border border-rental/30 bg-rental/10 p-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-rental" />
                        <span className="font-semibold text-foreground">{tripName}</span>
                        <Badge variant="outline" className="text-xs">{items.length} item{items.length > 1 ? 's' : ''}</Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {items.map(item => (
                        <div key={item.id} className="bg-background/60 rounded-md p-3 border border-border">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3 min-w-0">
                              {getItemIcon(item.type)}
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">{item.type}</Badge>
                                  <span className="text-sm truncate">{item.item_data?.name || item.external_ref}</span>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {item.item_data?.provider || 'Provider TBD'} · Saved {new Date(item.saved_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-semibold text-rental">${item.price.toFixed(2)}</span>
                              <Button variant="outline" size="sm" onClick={() => handleCheckout([item])} disabled={isCheckingOut} className="text-xs">
                                {isCheckingOut ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Book'}
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.id)} className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 pt-3 border-t border-border space-y-1 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span><span>${totals.provider.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>TAAI Travel Admin Fee (1%)</span><span>${totals.adminFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Taxes (7%)</span><span>${totals.tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Trip total</span><span className="text-rental">${totals.total.toFixed(2)}</span>
                      </div>
                      <Button onClick={() => handleCheckout(items)} disabled={isCheckingOut} className="w-full mt-2 bg-rental text-rental-foreground hover:bg-rental/90" size="sm">
                        {isCheckingOut ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
                        Checkout this trip — ${totals.total.toFixed(2)}
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
                <span>${grand.provider.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1">TAAI Travel Admin Fee (1%) <Info className="h-3 w-3" /></span>
                <span>${grand.adminFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Taxes (7%)</span>
                <span>${grand.tax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Grand total</span><span className="text-primary">${grand.total.toFixed(2)}</span>
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
                Checkout everything — ${grand.total.toFixed(2)}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Payments processed securely by Stripe. TAAI never sees your card details.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
