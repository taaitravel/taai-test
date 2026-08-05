import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Star, Plus, ExternalLink, BedDouble } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ItineraryMatcherModal } from './ItineraryMatcherModal';
import { buildHotelBookingSnapshot, canonicalHotelItemData } from '@/lib/booking/hotel-booking';
import { HotelRateSelectionDialog } from './HotelRateSelectionDialog';
import { buildBookingContext } from '@/lib/booking/booking-contract';
import { useAuth } from '@/contexts/AuthContext';

interface MapPopupCardProps {
  item: any;
  searchType?: 'hotels' | 'flights' | 'activities' | 'cars' | 'packages' | 'dining';
  onClose?: () => void;
}

export const MapPopupCard = ({ item, searchType, onClose }: MapPopupCardProps) => {
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showRates, setShowRates] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const { toast } = useToast();
  const { userProfile } = useAuth();

  if (!item) return null;

  const images = item.images || (item.image ? [item.image] : []);
  const hotelBooking = buildHotelBookingSnapshot(item);
  const totalPrice = searchType === 'hotels'
    ? hotelBooking.totalPrice
    : (item.totalPrice || item.min_total_price || item.pricePerNight || item.price || 0);
  const location = item.cityName 
    ? `${item.cityName}${item.distanceFromSearch ? `, ${item.distanceFromSearch} mi` : ''}` 
    : (item.location || item.city || '');

  const getItemTypeLabel = () => {
    switch (searchType) {
      case 'hotels': return 'Property';
      case 'activities': return 'Activity';
      case 'flights': return 'Flight';
      case 'cars': return 'Car';
      case 'packages': return 'Package';
      default: return 'Item';
    }
  };

  const getItemTypeEmoji = () => {
    switch (searchType) {
      case 'hotels': return '🏨';
      case 'activities': return '🎯';
      case 'flights': return '✈️';
      case 'cars': return '🚗';
      case 'packages': return '📦';
      default: return '📍';
    }
  };

  // Convert plural searchType to singular for database constraint
  const getDbItemType = (): string => {
    switch (searchType) {
      case 'hotels': return 'hotel';
      case 'flights': return 'flight';
      case 'activities': return 'activity';
      case 'cars': return 'hotel';
      case 'packages': return 'hotel';
      default: return 'hotel';
    }
  };

  const handleAddToItinerary = () => {
    if (searchType === 'hotels' && hotelBooking.issues.length > 0) {
      toast({ title: 'Property details incomplete', description: hotelBooking.issues[0], variant: 'destructive' });
      return;
    }
    setSelectedItem(null);
    setShowModal(true);
  };

  const handleSelectRate = (itemWithRate: Record<string, unknown>) => {
    setSelectedItem(itemWithRate);
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

      const itemToSave = selectedItem || item;
      const bookingToSave = searchType === 'hotels' ? buildHotelBookingSnapshot(itemToSave) : null;
      if (bookingToSave?.issues.length) throw new Error(bookingToSave.issues[0]);

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

      // Prepare location data
      const itemLocation = {
        city: itemToSave.cityName || itemToSave.location || itemToSave.city || 'Unknown',
        lat: itemToSave.latitude || 0,
        lng: itemToSave.longitude || 0
      };

      // Add location to itinerary map if not already present
      const currentMapLocations = Array.isArray(itinData.itin_map_locations) ? itinData.itin_map_locations : [];
      const locationExists = currentMapLocations.some(
        (loc: any) => loc.city === itemLocation.city
      );

      if (!locationExists) {
        await supabase
          .from('itinerary')
          .update({
            itin_map_locations: [...currentMapLocations, itemLocation]
          })
          .eq('id', parseInt(targetItineraryId));
      }

      const externalId = itemToSave.hotel_id || itemToSave.hotelId || itemToSave.id || `${searchType}-${Date.now()}`;
      const provider = itemToSave.source || 'Search';
      const itemData = searchType === 'hotels'
        ? canonicalHotelItemData(itemToSave, {}, {
            name: itemToSave.name,
            city: itemToSave.cityName || itemToSave.city,
            location: itemLocation,
            address: itemToSave.address || '',
            rating: itemToSave.rating,
            images: itemToSave.images || images,
            source: provider,
            bookingUrl: itemToSave.bookingUrl,
            bookingStatus: 'pending',
            booking_context: buildBookingContext({
              userId: user.id,
              userType: userProfile?.user_type || user.user_metadata?.user_type,
              companyName: userProfile?.comp_name,
            }),
            selected_product: itemToSave.selected_product,
            policies: itemToSave.policies,
            provider_quote: itemToSave.provider_quote,
            availability_status: itemToSave.availability_status || 'provider_search_result',
          })
        : {
            name: itemToSave.name,
            city: itemToSave.cityName || itemToSave.city,
            location: itemLocation,
            address: itemToSave.address || '',
            rating: itemToSave.rating,
            images: itemToSave.images || images,
            source: provider,
            bookingUrl: itemToSave.bookingUrl,
            bookingStatus: 'pending',
          };

      const providerRef = searchType === 'hotels'
        ? itemToSave.provider_ref || {
            external_id: externalId,
            booking_url: itemToSave.bookingUrl || null,
            bookable: false,
            availability_status: 'provider_search_result',
          }
        : {};
      const priceToSave = bookingToSave?.totalPrice || totalPrice;

      const { error } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          itinerary_id: itinData.itin_id,
          type: getDbItemType(),
          external_ref: externalId,
          external_id: externalId,
          provider,
          provider_ref: providerRef,
          rate_expires_at: itemToSave.rate_expires_at || null,
          price: priceToSave,
          last_price: priceToSave,
          item_data: itemData,
        });

      if (error) throw error;

      toast({
        title: `${getItemTypeLabel()} Saved`,
        description: 'Added to your itinerary as a pending booking',
      });

      setShowModal(false);
      setSelectedItem(null);
      onClose?.();
    } catch (error) {
      console.error('Error saving item:', error);
      toast({
        title: 'Error',
        description: `Failed to save ${getItemTypeLabel().toLowerCase()} to itinerary`,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-w-[240px] max-w-[280px] bg-[#1a1c2e] font-sans">
      {/* Image */}
      {images[0] && (
        <div 
          className="w-full h-[100px] bg-cover bg-center"
          style={{ backgroundImage: `url('${images[0]}')` }}
        />
      )}
      
      {/* Content */}
      <div className="p-3">
        {/* Category and Rating */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg opacity-60">{getItemTypeEmoji()}</span>
          <Badge variant="secondary" className="text-[10px] bg-white/10 text-white/60 border-white/10">
            {searchType || 'item'}
          </Badge>
          {item.rating && (
            <span className="text-[11px] text-amber-400 flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-current" />
              {parseFloat(item.rating).toFixed(1)}
            </span>
          )}
        </div>
        
        {/* Name */}
        <h3 className="text-[13px] font-bold text-white mb-1 line-clamp-1">
          {item.name || 'Unknown'}
        </h3>
        
        {/* Location */}
        <div className="flex items-center gap-1 text-[11px] text-white/60 mb-3">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{location}</span>
          {item.distanceFromSearch && (
            <span>• {parseFloat(item.distanceFromSearch).toFixed(1)} mi</span>
          )}
        </div>
        
        {/* Price */}
        <div className="flex items-baseline justify-between pt-2 border-t border-white/10 mb-3">
          <div>
            <div className="text-lg font-bold" style={{ color: '#ff849c' }}>
              ${Math.ceil(totalPrice).toLocaleString()}
            </div>
            <div className="text-[9px] text-white/50">
              total{searchType === 'hotels' && hotelBooking.nights > 0 ? ` · ${hotelBooking.nights} nights` : ''}
            </div>
          </div>
          {item.reviews && (
            <div className="text-right">
              <div className="text-[10px] text-white/50">
                {parseInt(item.reviews).toLocaleString()} reviews
              </div>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleAddToItinerary}
            disabled={saving}
            className="flex-1 h-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-xs text-white"
          >
            <Plus className="mr-1 h-3 w-3" />
            {saving ? 'Saving...' : getItemTypeLabel()}
          </Button>

          {searchType === 'hotels' && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 border-white/20 text-white/60 hover:text-white hover:bg-white/10"
              onClick={() => setShowRates(true)}
              disabled={hotelBooking.issues.length > 0}
              aria-label="Select a room and rate"
            >
              <BedDouble className="h-3 w-3" />
            </Button>
          )}
          
          {item.bookingUrl && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 border-white/20 text-white/60 hover:text-white hover:bg-white/10"
              onClick={() => window.open(item.bookingUrl, '_blank')}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      <ItineraryMatcherModal
        open={showModal}
        onOpenChange={setShowModal}
        searchDates={{
          checkin: hotelBooking.checkIn || '',
          checkout: hotelBooking.checkOut || ''
        }}
        item={selectedItem || item}
        onConfirm={handleModalConfirm}
      />
      {searchType === 'hotels' && (
        <HotelRateSelectionDialog
          open={showRates}
          onOpenChange={setShowRates}
          hotel={item}
          onSelect={handleSelectRate}
        />
      )}
    </div>
  );
};
