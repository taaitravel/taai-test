import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { buildHotelBookingSnapshot, canonicalHotelItemData } from '@/lib/booking/hotel-booking';
import { buildBookingContext, buildFlightServiceContract, buildTimedServiceContract } from '@/lib/booking/booking-contract';

export const useSearchActions = () => {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showItineraryModal, setShowItineraryModal] = useState(false);
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const trackIntent = async (eventType: string, item: any, itemType: string) => {
    if (!user) return;
    try {
      await supabase.functions.invoke('track-booking-event', {
        body: {
          event_type: eventType,
          provider: item.source || item.provider || 'unknown',
          item_type: itemType || 'hotel',
          item_data: item,
          price_snapshot: item.min_total_price || item.price || item.cost || 0,
        },
      });
    } catch (e) {
      console.error('Failed to track intent:', e);
    }
  };

  const handleAddToItinerary = (item: any) => {
    trackIntent('add_to_itinerary', item, item.type || 'hotel');
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

      trackIntent('view', item, itemType);

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
      const isHotel = !itemType || itemType === 'hotel' || itemType === 'hotels';
      const hotelBooking = isHotel ? buildHotelBookingSnapshot(item) : null;
      if (hotelBooking?.issues.length) {
        toast({
          title: 'Property details incomplete',
          description: hotelBooking.issues[0],
          variant: 'destructive',
        });
        return;
      }
      const externalId = item.hotel_id || item.hotelId || item.id || '';
      const provider = item.source || item.provider || 'unknown';
      const totalPrice = hotelBooking?.totalPrice || item.min_total_price || item.totalPrice || item.price || 0;
      const itemData = isHotel
        ? canonicalHotelItemData(item, {}, {
            ...item,
            provider,
            booking_context: buildBookingContext({
              userId: user.id,
              userType: userProfile?.user_type || user.user_metadata?.user_type,
              companyName: userProfile?.comp_name,
            }),
            selected_product: item.selected_product,
            policies: item.policies,
            provider_quote: item.provider_quote,
            availability_status: item.availability_status || 'provider_search_result',
          })
        : {
            ...item,
            ...(itemType === 'flight'
              ? buildFlightServiceContract(item)
              : buildTimedServiceContract(item, itemType === 'restaurant' ? 'restaurant' : 'venue')),
            provider,
          };
      const { data, error } = await supabase.from('cart_items').insert({
        user_id: user.id,
        external_ref: externalId,
        external_id: externalId || null,
        type: isHotel ? 'hotel' : itemType,
        price: totalPrice,
        last_price: totalPrice,
        provider,
        provider_ref: isHotel ? item.provider_ref || {
          external_id: externalId || null,
          booking_url: item.bookingUrl || item.url || null,
          bookable: false,
          availability_status: 'provider_search_result',
        } : {},
        rate_expires_at: isHotel ? item.rate_expires_at || null : null,
        item_data: itemData,
        booking_status: 'interested',
      }).select('id').single();

      if (error) throw error;

      // Track add_to_cart intent
      trackIntent('add_to_cart', item, itemType);

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
    trackIntent('view', item, 'hotel');
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
