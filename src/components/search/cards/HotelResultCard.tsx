import { Star, MapPin, Wifi, Coffee, ParkingCircle, Plus, BedDouble } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ItineraryMatcherModal } from '../ItineraryMatcherModal';
import type { PlanningDraftCardAction } from '@/types/planning-draft';
import { buildHotelBookingSnapshot, canonicalHotelItemData } from '@/lib/booking/hotel-booking';
import { HotelRateSelectionDialog } from '../HotelRateSelectionDialog';
import { buildBookingContext } from '@/lib/booking/booking-contract';
import { useAuth } from '@/contexts/AuthContext';

interface HotelResultCardProps {
  hotel: any;
  searchParams?: any;
  planningAction?: PlanningDraftCardAction;
}

export const HotelResultCard = ({ hotel, searchParams, planningAction }: HotelResultCardProps) => {
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showRates, setShowRates] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<any>(null);
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const booking = buildHotelBookingSnapshot(hotel, searchParams);

  const handleAddToItinerary = () => {
    if (booking.issues.length > 0) {
      toast({ title: 'Property details incomplete', description: booking.issues[0], variant: 'destructive' });
      return;
    }
    setSelectedHotel(null);
    setShowModal(true);
  };

  const handleSelectRate = (hotelWithRate: Record<string, unknown>) => {
    setSelectedHotel(hotelWithRate);
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

      const hotelToSave = selectedHotel || hotel;
      const bookingToSave = buildHotelBookingSnapshot(hotelToSave, searchParams);
      if (bookingToSave.issues.length > 0) throw new Error(bookingToSave.issues[0]);

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

      // Fetch the itinerary to get its itin_id (UUID) and add location to map
      const { data: itinData, error: itinError } = await supabase
        .from('itinerary')
        .select('itin_id, itin_map_locations')
        .eq('id', parseInt(targetItineraryId))
        .single();

      if (itinError) throw itinError;

      // Prepare hotel location data
      const hotelLocation = {
        city: hotelToSave.city || hotelToSave.location || 'Unknown',
        lat: hotelToSave.latitude || 0,
        lng: hotelToSave.longitude || 0
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

      const externalId = hotelToSave.hotel_id || hotelToSave.hotelId || hotelToSave.id || `hotel-${Date.now()}`;
      const provider = hotelToSave.source || hotelToSave.provider || 'Booking.com';
      const itemData = canonicalHotelItemData(hotelToSave, searchParams, {
        name: hotelToSave.name || hotelToSave.hotel_name || hotelToSave.hotelName,
        city: hotelToSave.city || hotelToSave.location,
        rating: hotelToSave.rating || hotelToSave.review_score || hotelToSave.reviewScore,
        reviewCount: hotelToSave.review_nr || hotelToSave.reviewCount,
        images: hotelToSave.photos || hotelToSave.images || [],
        address: hotelToSave.address || '',
        location: hotelLocation,
        priceBreakdown: hotelToSave.priceBreakdown,
        amenities: hotelToSave.amenities,
        url: hotelToSave.url,
        bookingStatus: 'pending',
        booking_context: buildBookingContext({
          userId: user.id,
          userType: userProfile?.user_type || user.user_metadata?.user_type,
          companyName: userProfile?.comp_name,
        }),
        selected_product: hotelToSave.selected_product,
        policies: hotelToSave.policies,
        provider_quote: hotelToSave.provider_quote,
        availability_status: hotelToSave.availability_status || 'provider_search_result',
      });

      const providerRef = hotelToSave.provider_ref || {
        external_id: externalId,
        booking_url: hotelToSave.url || hotelToSave.bookingUrl || null,
        bookable: false,
        availability_status: 'provider_search_result',
      };

      const { error } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          itinerary_id: itinData.itin_id,
          type: 'hotel',
          external_ref: externalId,
          external_id: externalId,
          provider,
          provider_ref: providerRef,
          rate_expires_at: hotelToSave.rate_expires_at || null,
          price: bookingToSave.totalPrice,
          last_price: bookingToSave.totalPrice,
          item_data: itemData,
        });

      if (error) throw error;

      toast({
        title: 'Property Saved',
        description: 'Added to your itinerary as a pending booking',
      });

      setShowModal(false);
      setSelectedHotel(null);
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
    <div className="w-[255px] h-[375px] p-6 flex flex-col">
      {/* Image carousel */}
      <div className="relative h-32 bg-white/5 rounded-lg mb-4 overflow-hidden flex-shrink-0">
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
                ${booking.pricePerNight.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            {booking.nights > 0 && (
              <div className="text-right">
                <p className="text-white/60 text-sm">Total ({booking.nights} nights)</p>
                <p className="text-xl font-semibold text-white">
                  ${booking.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            )}
          </div>
        </div>

        {hotel.description && (
          <p className="text-white/70 text-sm line-clamp-2">{hotel.description}</p>
        )}

        {/* Add to Itinerary Button */}
        {planningAction === undefined ? (
          <div className="grid grid-cols-2 gap-2 mt-4">
            <Button
              onClick={handleAddToItinerary}
              disabled={saving}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              <Plus className="mr-1 h-4 w-4" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="outline" onClick={() => setShowRates(true)} disabled={booking.issues.length > 0}>
              <BedDouble className="mr-1 h-4 w-4" /> Rooms
            </Button>
          </div>
        ) : planningAction.mode === 'enabled' ? (
          <Button
            onClick={planningAction.onToggle}
            variant={planningAction.selected ? 'secondary' : 'default'}
            className="w-full mt-4"
          >
            <Plus className="mr-2 h-4 w-4" />
            {planningAction.selected ? 'Added to draft' : 'Add to draft'}
          </Button>
        ) : (
          <Button disabled className="w-full mt-4" title={planningAction.reason}>
            Cannot add
          </Button>
        )}
      </div>

      {planningAction === undefined && (
        <ItineraryMatcherModal
          open={showModal}
          onOpenChange={setShowModal}
          searchDates={{
            checkin: booking.checkIn || '',
            checkout: booking.checkOut || ''
          }}
          item={selectedHotel || hotel}
          onConfirm={handleModalConfirm}
        />
      )}
      {planningAction === undefined && (
        <HotelRateSelectionDialog
          open={showRates}
          onOpenChange={setShowRates}
          hotel={hotel}
          searchParams={searchParams || {}}
          onSelect={handleSelectRate}
        />
      )}
    </div>
  );
};
