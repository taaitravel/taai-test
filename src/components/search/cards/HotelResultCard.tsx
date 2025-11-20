import { Star, MapPin, Wifi, Coffee, ParkingCircle, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface HotelResultCardProps {
  hotel: any;
}

export const HotelResultCard = ({ hotel }: HotelResultCardProps) => {
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleAddToItinerary = async () => {
    setSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to save properties to your itinerary.',
          variant: 'destructive',
        });
        return;
      }

      const { data: itineraries, error: itinError } = await supabase
        .from('itinerary')
        .select('id, itin_name')
        .eq('userid', user.id)
        .order('created_at', { ascending: false });

      if (itinError) throw itinError;

      if (!itineraries || itineraries.length === 0) {
        toast({
          title: 'No Itineraries Found',
          description: 'Please create an itinerary first before adding properties.',
          variant: 'default',
        });
        return;
      }

      const targetItinerary = itineraries[0];

      const { error: cartError } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          itinerary_id: targetItinerary.id.toString(),
          type: 'hotel',
          external_ref: hotel.hotel_id || hotel.id,
          price: Math.ceil(hotel.price || hotel.cost || 0),
          item_data: {
            name: hotel.name,
            location: hotel.location || hotel.address,
            city: hotel.city,
            rating: hotel.rating,
            price: Math.ceil(hotel.price || hotel.cost || 0),
            images: hotel.images || [],
            description: hotel.description,
            amenities: hotel.amenities,
            reviewScore: hotel.reviewScore,
            reviewCount: hotel.reviewCount,
            distance: hotel.distance,
            bookingStatus: 'pending',
            savedAt: new Date().toISOString(),
            source: 'search_result',
          },
        });

      if (cartError) throw cartError;

      toast({
        title: 'Property Saved',
        description: `Added to "${targetItinerary.itin_name || 'Untitled Itinerary'}" as pending booking.`,
      });

    } catch (error: any) {
      console.error('Error saving property:', error);
      toast({
        title: 'Save Failed',
        description: error.message || 'Unable to save property to itinerary.',
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
          {saving ? 'Saving...' : 'Add to Itinerary'}
        </Button>
      </div>
    </div>
  );
};
