import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Plane, Hotel, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QuickAddToCartProps {
  itineraryId?: string;
  onItemAdded?: () => void;
}

export const QuickAddToCart: React.FC<QuickAddToCartProps> = ({ itineraryId, onItemAdded }) => {
  const [type, setType] = useState<'flight' | 'hotel' | 'activity'>('flight');
  const [externalRef, setExternalRef] = useState('');
  const [price, setPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const addToCart = async () => {
    if (!externalRef.trim() || !price.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    const priceNumber = parseFloat(price);
    if (isNaN(priceNumber) || priceNumber <= 0) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid price.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('cart_items')
        .insert({
          itinerary_id: itineraryId,
          type,
          external_ref: externalRef,
          price: priceNumber,
          item_data: {
            type,
            name: externalRef,
            price: priceNumber,
            added_via: 'manual',
          },
        });

      if (error) throw error;

      toast({
        title: "Added to cart",
        description: `${type} "${externalRef}" has been added to your cart.`,
      });

      // Reset form
      setExternalRef('');
      setPrice('');
      onItemAdded?.();
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'flight':
        return <Plane className="h-4 w-4" />;
      case 'hotel':
        return <Hotel className="h-4 w-4" />;
      case 'activity':
        return <MapPin className="h-4 w-4" />;
    }
  };

  return (
    <Card className="bg-black/20 border-white/20 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-400">
          <Plus className="h-5 w-5" />
          Quick Add to Cart
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Type</label>
          <Select value={type} onValueChange={(value) => setType(value as 'flight' | 'hotel' | 'activity')}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="flight">
                <div className="flex items-center gap-2">
                  <Plane className="h-4 w-4" />
                  Flight
                </div>
              </SelectItem>
              <SelectItem value="hotel">
                <div className="flex items-center gap-2">
                  <Hotel className="h-4 w-4" />
                  Hotel
                </div>
              </SelectItem>
              <SelectItem value="activity">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Activity
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Reference/Name</label>
          <Input
            placeholder={`Enter ${type} reference or name...`}
            value={externalRef}
            onChange={(e) => setExternalRef(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Price ($)</label>
          <Input
            type="number"
            placeholder="0.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
          />
        </div>

        <Button
          onClick={addToCart}
          disabled={isLoading || !externalRef.trim() || !price.trim()}
          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
        >
          {getTypeIcon()}
          <span className="ml-2">Add to Cart</span>
        </Button>
      </CardContent>
    </Card>
  );
};