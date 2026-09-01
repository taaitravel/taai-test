import { Badge } from '@/components/ui/badge';
import { ImageGallery } from '@/components/ui/image-gallery';
import { Star, MapPin, Calendar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ItineraryMatcherModal } from '../ItineraryMatcherModal';
import { buildTimedServiceContract } from '@/lib/booking/booking-contract';
import { stripHtmlTags } from '@/lib/sanitize';

interface ActivitySearchCardProps {
  activity: any;
  searchParams?: any;
}

export const ActivitySearchCard = ({ activity, searchParams }: ActivitySearchCardProps) => {
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();

  // Guard clause: return null if activity is undefined or invalid
  if (!activity || typeof activity !== 'object') {
    return null;
  }

  const images = activity.images || (activity.image ? [activity.image] : []);
  const rawPrice = activity.price ?? activity.cost;
  const pricePerPerson = typeof rawPrice === 'number' && Number.isFinite(rawPrice) ? rawPrice : null;
  const participants = searchParams?.participants || activity.participants || 1;
  const totalGroupCost = pricePerPerson === null ? null : pricePerPerson * participants;
  
  const description = activity.description || activity.shortDescription || 'Explore this amazing activity';
  const plainDescription = typeof description === 'string' ? stripHtmlTags(description) : 'Explore this activity';

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
          price: totalGroupCost ?? 0,
          item_data: {
            ...buildTimedServiceContract({
              ...activity,
              local_start: activity.local_start || activity.start_at || activity.datetime
                || [searchParams?.checkin, activity.time].filter(Boolean).join('T') || searchParams?.checkin,
              service_location: activityLocation,
            }, 'venue'),
            name: activity.name,
            location: activityLocation,
            address: activity.address || '',
            date: searchParams?.checkin || activity.date,
            pricePerPerson,
            participants,
            totalCost: totalGroupCost,
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
    <div className="w-[270px] min-h-[385px] flex flex-col overflow-hidden rounded-lg border border-border bg-card pb-5 shadow-sm hover:shadow-md transition-shadow duration-300">
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
            <Badge variant="secondary" className="text-xs">
              Activity
            </Badge>
          </div>
          <h4 className="font-bold text-card-foreground text-sm mb-1 line-clamp-1">
            {activity.name}
          </h4>
          <p className="text-muted-foreground text-xs mb-2 line-clamp-2">
            {plainDescription}
          </p>
          <div className="flex items-center justify-between gap-2 mb-2">
            {activity.rating && (
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Star className="h-3 w-3 fill-current" />
                {activity.rating}
              </Badge>
            )}
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 mr-1" />
              {activity.duration || 'Flexible'}
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="space-y-1 mb-4">
            <p className="text-2xl font-bold text-center text-primary">
              {totalGroupCost === null
                ? 'Price unavailable'
                : new Intl.NumberFormat('en-US', { style: 'currency', currency: activity.currency || 'USD' }).format(totalGroupCost)}
            </p>
            <p className="text-muted-foreground text-xs text-center">
              {pricePerPerson === null
                ? 'Check provider for current pricing'
                : `${new Intl.NumberFormat('en-US', { style: 'currency', currency: activity.currency || 'USD' }).format(pricePerPerson)} per person × ${participants}`}
            </p>
          </div>
          <div className="pt-2 border-t border-border flex-shrink-0">
            <Button
              onClick={handleAddToItinerary}
              disabled={saving || totalGroupCost === null}
              className="w-full h-8 text-xs"
            >
              <Plus className="mr-1 h-3 w-3" />
              {saving ? 'Saving...' : totalGroupCost === null ? 'Pricing unavailable' : 'Add activity'}
            </Button>
          </div>
        </div>
      </div>

      <ItineraryMatcherModal
        open={showModal}
        onOpenChange={setShowModal}
        searchDates={{
          checkin: searchParams?.checkin || activity.date || new Date().toISOString().split('T')[0],
          checkout: searchParams?.checkin || activity.date || new Date().toISOString().split('T')[0]
        }}
        item={activity}
        onConfirm={handleModalConfirm}
      />
    </div>
  );
};
