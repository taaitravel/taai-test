import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ItineraryData } from '@/types/itinerary';

interface SharedItinerary extends ItineraryData {
  ownerName: string;
  myRole: string;
}

export const useSharedItineraries = () => {
  const { user } = useAuth();
  const [sharedItineraries, setSharedItineraries] = useState<SharedItinerary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSharedItineraries = async () => {
    if (!user) {
      setSharedItineraries([]);
      setLoading(false);
      return;
    }

    try {
      // Get attendee records where user is NOT the owner
      const { data: attendeeRecords, error: attendeeError } = await supabase
        .from('itinerary_attendees')
        .select('itinerary_id, role')
        .eq('user_id', user.id)
        .eq('status', 'accepted')
        .neq('role', 'owner');

      if (attendeeError) {
        console.error('Error fetching attendee records:', attendeeError);
        setLoading(false);
        return;
      }

      if (!attendeeRecords || attendeeRecords.length === 0) {
        setSharedItineraries([]);
        setLoading(false);
        return;
      }

      const itineraryIds = attendeeRecords.map(r => r.itinerary_id);
      const roleMap = new Map(attendeeRecords.map(r => [r.itinerary_id, r.role]));

      // Fetch the itineraries - RLS allows this because user is an attendee
      const { data: itineraries, error: itinError } = await supabase
        .from('itinerary')
        .select('*')
        .in('id', itineraryIds);

      if (itinError) {
        console.error('Error fetching shared itineraries:', itinError);
        setLoading(false);
        return;
      }

      // Fetch owner names
      const ownerIds = [...new Set((itineraries || []).map(i => i.userid).filter(Boolean))];
      let ownerMap = new Map<string, string>();

      if (ownerIds.length > 0) {
        // Use service role isn't available client-side, so we query attendees for owner info
        // Since we can't read other users' profiles directly, get owner names from itinerary_attendees
        const { data: ownerAttendees } = await supabase
          .from('itinerary_attendees')
          .select('itinerary_id, user_id')
          .in('itinerary_id', itineraryIds)
          .eq('role', 'owner');

        // We can't directly query other users' profiles due to RLS
        // So we'll show "Trip Owner" as fallback - the owner name will come from attendee data if available
        if (ownerAttendees) {
          ownerAttendees.forEach(a => {
            ownerMap.set(a.itinerary_id.toString(), 'Trip Owner');
          });
        }
      }

      const enriched: SharedItinerary[] = (itineraries || []).map(itin => ({
        ...itin,
        itin_locations: itin.itin_locations as string[] | null,
        itin_map_locations: itin.itin_map_locations as any,
        attendees: itin.attendees as any,
        flights: itin.flights as any,
        hotels: itin.hotels as any,
        activities: itin.activities as any,
        reservations: itin.reservations as any,
        images: itin.images as any,
        ownerName: ownerMap.get(itin.id.toString()) || 'Trip Owner',
        myRole: roleMap.get(itin.id) || 'collaborator',
      }));

      setSharedItineraries(enriched);
    } catch (error) {
      console.error('Error in useSharedItineraries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSharedItineraries();
  }, [user]);

  return { sharedItineraries, loading, refresh: fetchSharedItineraries };
};
