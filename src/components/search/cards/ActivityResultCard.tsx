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
            name: activity.name,
            location: activity.location || activity.address,
            city: activity.city,
            rating: activity.rating,
            price: Math.ceil(activity.price || 0),
            images: activity.images || [],
            description: activity.description,
            category: activity.category,
            duration: activity.duration,
            bookingStatus: 'pending',
            savedAt: new Date().toISOString(),
            source: 'search_result',
          },
        });

      if (cartError) throw cartError;

      toast({
        title: 'Activity Saved',
        description: `Added to "${targetItinerary.itin_name || 'Untitled Itinerary'}" as pending booking.`,
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
    <div className="p-6 h-full flex flex-col">
      {/* Image */}
      <div className="relative h-48 bg-white/5 rounded-lg overflow-hidden">
        {activity.images?.[0] ? (
          <img 
            src={activity.images[0]} 
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
      <div className="flex-1 flex flex-col justify-between space-y-3 mt-4">
        <div>
          <h3 className="text-lg font-bold text-white line-clamp-2">{activity.name}</h3>
          <p className="text-white/50 flex items-center gap-1 text-sm mt-1">
            <MapPin className="h-3.5 w-3.5" />
            {activity.location || activity.address}
          </p>
        </div>

        {/* Price */}
        <div className="pt-3 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold" style={{ color: '#ff849c' }}>
                ${activity.price || activity.cost || '75'}
              </p>
            </div>
            <Button 
              onClick={handleAddToItinerary}
              disabled={saving}
              className="bg-gradient-to-r from-primary to-[#7E69AB] hover:opacity-90 text-white text-sm"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              {saving ? 'Saving...' : 'Add'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
