import { Badge } from '@/components/ui/badge';
import { ImageGallery } from '@/components/ui/image-gallery';
import { Star, MapPin, Clock, Users, Calendar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ItineraryMatcherModal } from '../ItineraryMatcherModal';

interface ActivitySearchCardProps {
  activity: any;
}

export const ActivitySearchCard = ({ activity }: ActivitySearchCardProps) => {
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();

  const images = activity.images || (activity.image ? [activity.image] : []);
  const pricePerPerson = activity.price || activity.cost || 75;

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

      // Prepare activity location data
      const activityLocation = {
        city: activity.location || activity.city || 'Unknown',
        lat: activity.latitude || 0,
        lng: activity.longitude || 0
      };

      // Add location to itinerary map if not already present
      const currentMapLocations = Array.isArray(itinData.itin_map_locations) ? itinData.itin_map_locations : [];
      const locationExists = currentMapLocations.some(
        (loc: any) => loc.city === activityLocation.city
      );

      if (!locationExists) {
        await supabase
          .from('itinerary')
          .update({
            itin_map_locations: [...currentMapLocations, activityLocation]
          })
          .eq('id', parseInt(targetItineraryId));
      }

      const { error } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          itinerary_id: itinData.itin_id,
          type: 'activity',
          external_ref: activity.id || `activity-${Date.now()}`,
          price: pricePerPerson,
          item_data: {
            name: activity.name,
            location: activityLocation,
            address: activity.address || '',
            price: pricePerPerson,
            rating: activity.rating,
            images: images,
            bookingStatus: 'pending'
          }
        });

      if (error) throw error;

      toast({
        title: 'Activity Saved',
        description: 'Added to your itinerary as a pending booking',
      });

      setShowModal(false);
    } catch (error) {
      console.error('Error saving activity:', error);
      toast({
        title: 'Error',
        description: 'Failed to save activity to itinerary',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-[270px] h-[385px] space-y-4 bg-[#1a1c2e] p-6 rounded-lg shadow-[0_4px_12px_rgba(192,192,192,0.15)] flex flex-col overflow-hidden pt-[5px] pb-[20px]">
      {/* Image */}
      <div className="relative h-28 bg-white/5 rounded-lg overflow-hidden flex-shrink-0">
        {images[0] ? (
          <img 
            src={images[0]} 
            alt={activity.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/40 text-sm">
            No image
          </div>
        )}
        {activity.rating && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-primary text-white text-xs">
              {activity.rating} <Star className="ml-1 h-3 w-3 fill-current" />
            </Badge>
          </div>
        )}
      </div>

      {/* Activity info */}
      <div className="flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h3 className="text-base font-bold text-white line-clamp-2">{activity.name}</h3>
          <p className="text-white/50 flex items-center gap-1 text-xs mt-1">
            <MapPin className="h-3.5 w-3.5" />
            {activity.location || activity.city}
          </p>
        </div>

        {/* Price Section */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <p className="text-white/60 text-xs">Price</p>
              <p className="text-2xl font-bold" style={{ color: '#ff849c' }}>
                ${Math.ceil(pricePerPerson).toLocaleString('en-US')}
              </p>
              <p className="text-white/40 text-xs mt-1">including taxes and fees</p>
            </div>
          </div>
        </div>

        {/* Add to Itinerary Button */}
        <div className="pt-2 border-t border-white/10 flex-shrink-0">
          <Button
            onClick={handleAddToItinerary}
            disabled={saving}
            className="w-full h-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-xs"
          >
            <Plus className="mr-1 h-3 w-3" />
            {saving ? 'Saving...' : 'Activity'}
          </Button>
        </div>
      </div>

      <ItineraryMatcherModal
        open={showModal}
        onOpenChange={setShowModal}
        searchDates={{
          checkin: new Date().toISOString().split('T')[0],
          checkout: new Date().toISOString().split('T')[0]
        }}
        item={activity}
        onConfirm={handleModalConfirm}
      />
    </div>
  );
};
