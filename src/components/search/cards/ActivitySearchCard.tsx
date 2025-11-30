import { Badge } from '@/components/ui/badge';
import { ImageGallery } from '@/components/ui/image-gallery';
import { Star, MapPin, Calendar, Plus } from 'lucide-react';
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
    <div className="w-[270px] h-[385px] flex flex-col overflow-hidden rounded-lg border border-white/20 bg-[#1a1c2e] pb-[20px] hover:shadow-lg hover:shadow-gray-500/10 transition-all duration-300">
      {/* Image Gallery */}
      {images.length > 0 && (
        <ImageGallery
          images={images}
          alt={activity.name}
          aspectRatio="wide"
          className="h-28 flex-shrink-0"
        />
      )}

      {/* Card Content - Matching Hotel Card Style */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xl opacity-60">🎯</div>
            <Badge variant="secondary" className="text-xs bg-white/5 text-white/40 border-white/10">
              Activity
            </Badge>
          </div>
          <h4 className="font-bold text-white text-sm mb-1 line-clamp-1">
            {activity.name}
          </h4>
          <p className="text-white/60 text-xs mb-2 line-clamp-2">
            {activity.description || activity.shortDescription || 'Explore this amazing activity'}
          </p>
          <div className="flex items-center justify-between gap-2 mb-2">
            {activity.rating && (
              <Badge className="text-xs bg-white/10 text-white/60 border-white/20 flex items-center gap-1">
                <Star className="h-3 w-3 fill-current" />
                {activity.rating}
              </Badge>
            )}
            <div className="flex items-center text-xs text-white/50">
              <Calendar className="h-3 w-3 mr-1" />
              {activity.duration || 'Flexible'}
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="space-y-1 mb-4">
            <p className="text-2xl font-bold text-center flex items-baseline justify-center gap-1" style={{ color: '#ff849c' }}>
              ${Math.ceil(pricePerPerson).toLocaleString('en-US')}
              <span className="text-xs text-white/50">/p</span>
            </p>
            <p className="text-white/40 text-xs text-center">including taxes and fees</p>
          </div>
          <div className="pt-2 border-t border-white/10 flex-shrink-0">
            <Button
              onClick={handleAddToItinerary}
              disabled={saving}
              className="w-full h-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-xs text-white"
            >
              <Plus className="mr-1 h-3 w-3" />
              {saving ? 'Saving...' : 'Activity'}
            </Button>
          </div>
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