import { Star, MapPin, Wifi, Coffee, ParkingCircle, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ItineraryMatcherModal } from '../ItineraryMatcherModal';

interface HotelResultCardProps {
  hotel: any;
}

export const HotelResultCard = ({ hotel }: HotelResultCardProps) => {
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();

  const handleAddToItinerary = () => {
    setShowModal(true);
  };

  const handleModalConfirm = async (itineraryId: string | 'new', newItineraryName?: string, startDate?: string, endDate?: string) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Authentication Required',
          description: 'Please sign in to add items to your itinerary',
          variant: 'destructive',
        });
        return;
      }

      let targetItineraryId = itineraryId;

      // If 'new', create the itinerary first
      if (itineraryId === 'new') {
        const { data: newItin, error: createError } = await supabase
          .from('itinerary')
          .insert({
            userid: user.id,
            itin_name: newItineraryName,
            itin_date_start: startDate,
            itin_date_end: endDate,
          })
          .select()
          .single();

        if (createError) throw createError;
        targetItineraryId = newItin.id.toString();
      }

      const { error } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          itinerary_id: targetItineraryId,
          type: 'hotel',
          external_ref: hotel.hotel_id || hotel.hotelId || `hotel-${Date.now()}`,
          price: hotel.priceBreakdown?.grossPrice?.value || hotel.min_total_price || 0,
          item_data: {
            name: hotel.hotel_name || hotel.hotelName,
            location: hotel.city || hotel.location,
            checkIn: hotel.checkin || hotel.checkInDate,
            checkOut: hotel.checkout || hotel.checkOutDate,
            rating: hotel.review_score || hotel.reviewScore,
            reviewCount: hotel.review_nr || hotel.reviewCount,
            images: hotel.photos || hotel.images || [],
            priceBreakdown: hotel.priceBreakdown,
            amenities: hotel.amenities,
            url: hotel.url,
            bookingStatus: 'pending'
          }
        });

      if (error) throw error;

      toast({
        title: 'Property Saved',
        description: 'Added to your itinerary as a pending booking',
      });

      setShowModal(false);
    } catch (error) {
      console.error('Error saving hotel:', error);
      toast({
        title: 'Error',
        description: 'Failed to save property to itinerary',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 flex flex-col h-full">
      {/* Image carousel */}
      <div className="relative h-64 bg-white/5 rounded-lg mb-4 overflow-hidden">
        {hotel.images?.[0] ? (
          <img 
            src={hotel.images[0]} 
            alt={hotel.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/40">
            No image available
          </div>
        )}
        <div className="absolute top-4 right-4">
          <Badge className="bg-primary text-white">
            {hotel.rating || 4.5} <Star className="ml-1 h-3 w-3 fill-current" />
          </Badge>
        </div>
      </div>

      {/* Hotel info */}
      <div className="space-y-3">
        <div>
          <h3 className="text-2xl font-bold text-white">{hotel.name}</h3>
          <p className="text-white/60 flex items-center gap-1 mt-1">
            <MapPin className="h-4 w-4" />
            {hotel.location || hotel.address}
          </p>
        </div>

        {/* Amenities */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="bg-white/5 border-white/20 text-white">
            <Wifi className="mr-1 h-3 w-3" />
            Free WiFi
          </Badge>
          <Badge variant="outline" className="bg-white/5 border-white/20 text-white">
            <Coffee className="mr-1 h-3 w-3" />
            Breakfast
          </Badge>
          <Badge variant="outline" className="bg-white/5 border-white/20 text-white">
            <ParkingCircle className="mr-1 h-3 w-3" />
            Parking
          </Badge>
        </div>

        {/* Price */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-white/60 text-sm">Price per night</p>
              <p className="text-3xl font-bold text-white">
                ${hotel.price || hotel.cost || '199'}
              </p>
            </div>
            {hotel.duration && (
              <div className="text-right">
                <p className="text-white/60 text-sm">Total ({hotel.duration} nights)</p>
                <p className="text-xl font-semibold text-white">
                  ${(hotel.price || 199) * hotel.duration}
                </p>
              </div>
            )}
          </div>
        </div>

        {hotel.description && (
          <p className="text-white/70 text-sm line-clamp-2">{hotel.description}</p>
        )}

        {/* Add to Itinerary Button */}
        <Button
          onClick={handleAddToItinerary}
          disabled={saving}
          className="w-full mt-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
        >
          <Plus className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Property'}
        </Button>
      </div>

      <ItineraryMatcherModal
        open={showModal}
        onOpenChange={setShowModal}
        searchDates={{
          checkin: hotel.checkin || hotel.checkInDate || new Date().toISOString().split('T')[0],
          checkout: hotel.checkout || hotel.checkOutDate || new Date(Date.now() + 86400000).toISOString().split('T')[0]
        }}
        item={hotel}
        onConfirm={handleModalConfirm}
      />
    </div>
  );
};
