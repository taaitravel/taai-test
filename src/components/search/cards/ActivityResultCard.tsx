import { MapPin, Clock, Star, Users, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ActivityResultCardProps {
  activity: any;
}

export const ActivityResultCard = ({ activity }: ActivityResultCardProps) => {
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleAddToItinerary = async () => {
    setSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to save activities to your itinerary.',
          variant: 'destructive',
        });
        return;
      }

      // Get user's itineraries
      const { data: itineraries, error: itinError } = await supabase
        .from('itinerary')
        .select('id, itin_name')
        .eq('userid', user.id)
        .order('created_at', { ascending: false });

      if (itinError) throw itinError;

      if (!itineraries || itineraries.length === 0) {
        toast({
          title: 'No Itineraries Found',
          description: 'Please create an itinerary first before adding activities.',
          variant: 'default',
        });
        return;
      }

      // For now, add to the most recent itinerary
      const targetItinerary = itineraries[0];

      // Save as cart item with reference to search
      const { error: cartError } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          itinerary_id: targetItinerary.id.toString(),
          type: 'activity',
          external_ref: activity.id,
          price: activity.price || 0,
          item_data: {
            ...activity,
            status: 'inactive',
            savedAt: new Date().toISOString(),
            source: 'search_result',
          },
        });

      if (cartError) throw cartError;

      toast({
        title: 'Activity Saved',
        description: `Added to "${targetItinerary.itin_name || 'Untitled Itinerary'}" as inactive booking.`,
      });

    } catch (error: any) {
      console.error('Error saving activity:', error);
      toast({
        title: 'Save Failed',
        description: error.message || 'Unable to save activity to itinerary.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      {/* Image */}
      <div className="relative h-64 bg-white/5 rounded-lg mb-4 overflow-hidden">
        {activity.images?.[0] ? (
          <img 
            src={activity.images[0]} 
            alt={activity.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/40">
            No image available
          </div>
        )}
        <div className="absolute top-4 right-4">
          <Badge className="bg-primary text-white">
            {activity.rating || 4.7} <Star className="ml-1 h-3 w-3 fill-current" />
          </Badge>
        </div>
      </div>

      {/* Activity info */}
      <div className="space-y-3">
        <div>
          <h3 className="text-2xl font-bold text-white">{activity.name}</h3>
          <p className="text-white/60 flex items-center gap-1 mt-1">
            <MapPin className="h-4 w-4" />
            {activity.location || activity.address}
          </p>
        </div>

        {/* Details */}
        <div className="flex flex-wrap gap-3 text-sm">
          {activity.duration && (
            <div className="flex items-center gap-1 text-white/70">
              <Clock className="h-4 w-4" />
              {activity.duration}
            </div>
          )}
          {activity.groupSize && (
            <div className="flex items-center gap-1 text-white/70">
              <Users className="h-4 w-4" />
              Max {activity.groupSize} people
            </div>
          )}
        </div>

        {/* Category badges */}
        <div className="flex flex-wrap gap-2">
          {activity.category && (
            <Badge variant="outline" className="bg-white/5 border-white/20 text-white">
              {activity.category}
            </Badge>
          )}
          {activity.type && (
            <Badge variant="outline" className="bg-white/5 border-white/20 text-white">
              {activity.type}
            </Badge>
          )}
        </div>

        {/* Description */}
        {activity.description && (
          <p className="text-white/70 text-sm line-clamp-3">{activity.description}</p>
        )}

        {/* Price and Actions */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">From</p>
              <p className="text-3xl font-bold text-[#ff849c]">
                ${activity.price || activity.cost || '75'}
              </p>
              <p className="text-white/60 text-xs">per person</p>
            </div>
            <Button
              onClick={handleAddToItinerary}
              disabled={saving}
              className="bg-gradient-to-r from-[#9b87f5] to-[#7E69AB] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Add to Itinerary'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
