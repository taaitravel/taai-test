import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export const useSearchActions = () => {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showItineraryModal, setShowItineraryModal] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAddToItinerary = (item: any) => {
    setSelectedItem(item);
    setShowItineraryModal(true);
  };

  const handleAddToWishlist = async (item: any, itemType: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('wishlist').insert({
        user_id: user.id,
        item_type: itemType || 'hotel',
        item_data: item,
      });

      if (error) throw error;

      toast({
        title: 'Added to Wishlist!',
        description: 'Item has been saved to your wishlist',
      });
    } catch (error: any) {
      console.error('Error adding to wishlist:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add to wishlist',
        variant: 'destructive',
      });
    }
  };

  const handleAddToCart = async (item: any, itemType: string) => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please log in to add items to cart',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase.from('cart_items').insert({
        user_id: user.id,
        external_ref: item.hotel_id || item.id || '',
        type: itemType || 'hotel',
        price: item.min_total_price || item.price || 0,
        item_data: item,
      });

      if (error) throw error;

      toast({
        title: 'Added to Cart!',
        description: 'Item has been added to your cart',
      });
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add to cart',
        variant: 'destructive',
      });
    }
  };

  const handleViewDetails = (item: any) => {
    navigate(`/hotel/${item.hotel_id}`, { state: { hotel: item } });
  };

  return {
    selectedItem,
    showItineraryModal,
    setShowItineraryModal,
    handleAddToItinerary,
    handleAddToWishlist,
    handleAddToCart,
    handleViewDetails,
  };
};
