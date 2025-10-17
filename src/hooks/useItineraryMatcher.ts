import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useItineraryMatcher = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const findMatchingItineraries = async (searchDates: { checkin: string; checkout: string }) => {
    if (!user) return [];

    setLoading(true);
    try {
      const { data: itineraries, error } = await supabase
        .from('itinerary')
        .select('*')
        .eq('userid', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const searchStart = new Date(searchDates.checkin);
      const searchEnd = new Date(searchDates.checkout);

      // Find itineraries that overlap with search dates
      const matchingItineraries = (itineraries || []).map((itin: any) => {
        const itinStart = new Date(itin.itin_date_start);
        const itinEnd = new Date(itin.itin_date_end);

        // Check if dates overlap
        const isExactMatch =
          searchStart >= itinStart && searchEnd <= itinEnd;
        const hasPartialOverlap =
          (searchStart >= itinStart && searchStart <= itinEnd) ||
          (searchEnd >= itinStart && searchEnd <= itinEnd) ||
          (searchStart <= itinStart && searchEnd >= itinEnd);

        return {
          ...itin,
          matchType: isExactMatch ? 'exact' : hasPartialOverlap ? 'partial' : 'none',
        };
      }).filter((itin: any) => itin.matchType !== 'none');

      return matchingItineraries;
    } catch (error) {
      console.error('Error finding matching itineraries:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return { findMatchingItineraries, loading };
};
