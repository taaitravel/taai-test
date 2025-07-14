import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Trash2, Calendar, DollarSign, Plane, Hotel, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  id: string;
  type: 'flight' | 'hotel' | 'activity';
  external_ref: string;
  price: number;
  item_data: any;
  saved_at: string;
  [key: string]: any; // Index signature for JSON compatibility
}

interface BookingCartProps {
  itineraryId?: string;
  onCartUpdate?: (items: CartItem[]) => void;
}

export const BookingCart: React.FC<BookingCartProps> = ({ itineraryId, onCartUpdate }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [quoteName, setQuoteName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCartItems();
  }, [itineraryId]);

  const fetchCartItems = async () => {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select('*')
        .eq('itinerary_id', itineraryId || '')
        .order('saved_at', { ascending: false });

      if (error) throw error;
      const typedData = (data || []) as CartItem[];
      setCartItems(typedData);
      onCartUpdate?.(typedData);
    } catch (error) {
      console.error('Error fetching cart items:', error);
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart.",
      });
      
      fetchCartItems();
    } catch (error) {
      console.error('Error removing item:', error);
      toast({
        title: "Error",
        description: "Failed to remove item from cart.",
        variant: "destructive",
      });
    }
  };

  const saveQuote = async () => {
    if (!quoteName.trim()) {
      toast({
        title: "Quote name required",
        description: "Please enter a name for your price snapshot.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Quote expires in 7 days

      const { error } = await supabase
        .from('quotes')
        .insert({
          itinerary_id: itineraryId,
          quote_name: quoteName,
          total_price: totalPrice,
          items: cartItems,
          expires_at: expiresAt.toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Price snapshot saved",
        description: `Quote "${quoteName}" has been saved and will expire in 7 days.`,
      });

      setQuoteName('');
    } catch (error) {
      console.error('Error saving quote:', error);
      toast({
        title: "Error",
        description: "Failed to save price snapshot.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const bookFullTrip = async () => {
    setIsLoading(true);
    try {
      const totalAmount = cartItems.reduce((sum, item) => sum + item.price, 0);
      const bookingRef = `TAAI-${Date.now()}`;

      const { error } = await supabase
        .from('bookings')
        .insert({
          itinerary_id: itineraryId,
          booking_ref: bookingRef,
          total_amount: totalAmount,
          booking_details: {
            items: cartItems,
            booking_type: 'full_trip',
            booking_date: new Date().toISOString(),
          },
        });

      if (error) throw error;

      toast({
        title: "Booking initiated",
        description: `Your booking ${bookingRef} has been created. You'll receive confirmation shortly.`,
      });

      // Clear cart after booking
      setCartItems([]);
      onCartUpdate?.([]);
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: "Error",
        description: "Failed to create booking.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const bookIndividualItem = async (item: CartItem) => {
    setIsLoading(true);
    try {
      const bookingRef = `TAAI-${Date.now()}-${item.type}`;

      const { error } = await supabase
        .from('bookings')
        .insert({
          itinerary_id: itineraryId,
          booking_ref: bookingRef,
          total_amount: item.price,
          booking_details: {
            items: [item],
            booking_type: 'individual_item',
            booking_date: new Date().toISOString(),
          },
        });

      if (error) throw error;

      toast({
        title: "Item booked",
        description: `${item.type} booking ${bookingRef} has been created.`,
      });

      // Remove item from cart after booking
      await removeFromCart(item.id);
    } catch (error) {
      console.error('Error booking item:', error);
      toast({
        title: "Error",
        description: "Failed to book item.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'flight':
        return <Plane className="h-4 w-4" />;
      case 'hotel':
        return <Hotel className="h-4 w-4" />;
      case 'activity':
        return <MapPin className="h-4 w-4" />;
      default:
        return <ShoppingCart className="h-4 w-4" />;
    }
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <Card className="bg-black/20 border-white/20 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-400">
          <ShoppingCart className="h-5 w-5" />
          Booking Cart ({cartItems.length} items)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {cartItems.length === 0 ? (
          <div className="text-center py-8 text-white/60">
            <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Your cart is empty</p>
            <p className="text-sm">Add flights, hotels, or activities to get started</p>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getItemIcon(item.type)}
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs text-orange-400 border-orange-400">
                            {item.type}
                          </Badge>
                          <span className="text-sm text-white/80">{item.external_ref}</span>
                        </div>
                        <div className="text-sm text-white/60 mt-1">
                          Saved {new Date(item.saved_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-orange-400">${item.price.toFixed(2)}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => bookIndividualItem(item)}
                        disabled={isLoading}
                        className="bg-orange-500/20 border-orange-500 text-orange-400 hover:bg-orange-500/30"
                      >
                        Book
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="bg-white/20" />

            {/* Total and Actions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Total:</span>
                <span className="text-orange-400">${totalPrice.toFixed(2)}</span>
              </div>

              {/* Save Quote Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-400" />
                  <span className="text-sm font-medium">Save Price Snapshot</span>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Quote name (e.g., 'Paris Trip 2024')"
                    value={quoteName}
                    onChange={(e) => setQuoteName(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                  />
                  <Button
                    onClick={saveQuote}
                    disabled={isLoading || !quoteName.trim()}
                    variant="outline"
                    className="bg-blue-500/20 border-blue-500 text-blue-400 hover:bg-blue-500/30"
                  >
                    Save
                  </Button>
                </div>
              </div>

              {/* Book Full Trip */}
              <Button
                onClick={bookFullTrip}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Book Full Trip - ${totalPrice.toFixed(2)}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};