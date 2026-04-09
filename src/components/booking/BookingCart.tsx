import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Trash2, Calendar, CreditCard, Plane, Hotel, MapPin, Loader2, Info } from 'lucide-react';
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
  [key: string]: any;
}

interface BookingCartProps {
  itineraryId?: string;
  onCartUpdate?: (items: CartItem[]) => void;
}

const TAAI_FEE_RATE = 0.08;

export const BookingCart: React.FC<BookingCartProps> = ({ itineraryId, onCartUpdate }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [quoteName, setQuoteName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { isLoading: isCheckingOut, startCheckout, trackIntent } = useBookingCheckout();

  useEffect(() => {
    fetchCartItems();
  }, [itineraryId]);

  const fetchCartItems = async () => {
    try {
      let query = supabase.from('cart_items').select('*').order('saved_at', { ascending: false });
      if (itineraryId) {
        query = query.eq('itinerary_id', itineraryId);
      }
      const { data, error } = await query;
      if (error) throw error;
      const typedData = (data || []).filter((d: any) => d.booking_status !== 'booked') as CartItem[];
      setCartItems(typedData);
      onCartUpdate?.(typedData);
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
    } catch (error) {
      console.error('Error removing item:', error);
      toast({ title: 'Error', description: 'Failed to remove item.', variant: 'destructive' });
    }
  };

  const saveQuote = async () => {
    if (!quoteName.trim() || !user?.id) return;
    setIsSaving(true);
    try {
      const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      const { error } = await supabase.from('quotes').insert([{
        user_id: user.id,
        quote_name: quoteName,
        total_price: totalPrice,
        items: cartItems as any,
        expires_at: expiresAt.toISOString(),
      }]);
      if (error) throw error;
      toast({ title: 'Price snapshot saved', description: `Quote "${quoteName}" saved (expires in 7 days).` });
      setQuoteName('');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save quote.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
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

  const providerTotal = cartItems.reduce((sum, item) => sum + item.price, 0);
  const serviceFee = Math.round(providerTotal * TAAI_FEE_RATE * 100) / 100;
  const grandTotal = providerTotal + serviceFee;

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
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-muted/50 rounded-lg p-3 border border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getItemIcon(item.type)}
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {item.type}
                          </Badge>
                          <span className="text-sm">{item.item_data?.name || item.external_ref}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {item.item_data?.provider || 'Provider TBD'} · Saved {new Date(item.saved_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-primary">${item.price.toFixed(2)}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCheckout([item])}
                        disabled={isCheckingOut}
                        className="text-xs"
                      >
                        {isCheckingOut ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Book'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Price Breakdown */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal ({cartItems.length} items)</span>
                <span>${providerTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1">
                  TAAI Management Fee (8%)
                  <Info className="h-3 w-3" />
                </span>
                <span>${serviceFee.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3">
              {/* Save Quote */}
              <div className="flex gap-2">
                <Input
                  placeholder="Save as price snapshot..."
                  value={quoteName}
                  onChange={(e) => setQuoteName(e.target.value)}
                  className="text-sm"
                />
                <Button
                  onClick={saveQuote}
                  disabled={isSaving || !quoteName.trim()}
                  variant="outline"
                  size="sm"
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Save
                </Button>
              </div>

              {/* Checkout All */}
              <Button
                onClick={() => handleCheckout(cartItems)}
                disabled={isCheckingOut}
                className="w-full"
                size="lg"
              >
                {isCheckingOut ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                Secure Checkout — ${grandTotal.toFixed(2)}
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
