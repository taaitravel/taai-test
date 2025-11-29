import { Badge } from '@/components/ui/badge';
import { ImageGallery } from '@/components/ui/image-gallery';
import { Star, MapPin, Calendar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ItineraryMatcherModal } from '../ItineraryMatcherModal';

interface HotelSearchCardProps {
  hotel: any;
}

export const HotelSearchCard = ({ hotel }: HotelSearchCardProps) => {
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();

  const images = hotel.images || (hotel.image ? [hotel.image] : []);
  const pricePerNight = hotel.pricePerNight || hotel.price || 0;
  const totalPrice = hotel.totalPrice || hotel.min_total_price || 0;
  const nights = hotel.nights || 1;
  const location = hotel.cityName 
    ? `${hotel.cityName}${hotel.distanceFromSearch ? `, ${hotel.distanceFromSearch} mi` : ''}` 
    : (hotel.location || hotel.city || '');
  const source = hotel.source || 'Booking.com';

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

      // Fetch the itinerary to get its itin_id (UUID) and add location to map
      const { data: itinData, error: itinError } = await supabase
        .from('itinerary')
        .select('itin_id, itin_map_locations')
        .eq('id', parseInt(targetItineraryId))
        .single();

      if (itinError) throw itinError;

      // Prepare hotel location data
      const hotelLocation = {
        city: hotel.cityName || hotel.location || hotel.city || 'Unknown',
        lat: hotel.latitude || 0,
        lng: hotel.longitude || 0
      };

      // Add location to itinerary map if not already present
      const currentMapLocations = Array.isArray(itinData.itin_map_locations) ? itinData.itin_map_locations : [];
      const locationExists = currentMapLocations.some(
        (loc: any) => loc.city === hotelLocation.city
      );

      if (!locationExists) {
        await supabase
          .from('itinerary')
          .update({
            itin_map_locations: [...currentMapLocations, hotelLocation]
          })
          .eq('id', parseInt(targetItineraryId));
      }

      const { error } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          itinerary_id: itinData.itin_id,
          type: 'hotel',
          external_ref: hotel.hotel_id || hotel.hotelId || `hotel-${Date.now()}`,
          price: totalPrice,
          item_data: {
            name: hotel.name,
            city: hotel.cityName || hotel.city,
            location: hotelLocation,
            address: hotel.address || '',
            checkIn: hotel.checkin || hotel.checkInDate,
            checkOut: hotel.checkout || hotel.checkOutDate,
            pricePerNight: pricePerNight,
            totalPrice: totalPrice,
            nights: nights,
            rating: hotel.rating,
            images: images,
            source: source,
            bookingUrl: hotel.bookingUrl,
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
    <div className="w-[270px] h-[385px] flex flex-col overflow-hidden rounded-lg border border-white/20 bg-gradient-to-br from-white/10 to-white/5 pt-[5px] pb-[20px] hover:shadow-lg hover:shadow-gray-500/10 transition-all duration-300">
      {/* Image Gallery */}
      {images.length > 0 && (
        <ImageGallery
          images={images}
          alt={hotel.name}
          aspectRatio="wide"
          className="rounded-t-lg overflow-hidden h-28 flex-shrink-0"
        />
      )}

      {/* Card Content - Matching Itinerary Card Style */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xl opacity-60">🏨</div>
            <Badge variant="secondary" className="text-xs bg-white/5 text-white/40 border-white/10">
              {source}
            </Badge>
          </div>
          <h4 className="font-bold text-white text-sm mb-1 line-clamp-1">
            {hotel.name}
          </h4>
          <p className="text-white/60 text-xs mb-2 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {location}
          </p>
          <div className="flex flex-wrap gap-1 mb-2">
            <Badge className="text-xs bg-white/10 text-white/60 border-white/20">
              ${pricePerNight.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/night
            </Badge>
            {hotel.rating && (
              <Badge className="text-xs bg-white/10 text-white/60 border-white/20 flex items-center gap-1">
                <Star className="h-3 w-3 fill-current" />
                {hotel.rating}
              </Badge>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <div className="space-y-1 mb-4">
            <div className="flex items-center text-xs text-white/50">
              <Calendar className="h-3 w-3 mr-1" />
              {nights} nights
            </div>
            <p className="text-2xl font-bold" style={{ color: '#ff849c' }}>
              ${Math.ceil(totalPrice).toLocaleString('en-US')}
            </p>
            <p className="text-white/40 text-xs">including taxes and fees</p>
          </div>
          <div className="pt-2 border-t border-white/10 flex-shrink-0">
            <Button
              onClick={handleAddToItinerary}
              disabled={saving}
              className="w-full h-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-xs"
            >
              <Plus className="mr-1 h-3 w-3" />
              {saving ? 'Saving...' : 'Property'}
            </Button>
          </div>
        </div>
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
