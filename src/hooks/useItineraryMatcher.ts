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

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const searchStart = searchDates.checkin ? new Date(searchDates.checkin) : null;
      const searchEnd = searchDates.checkout ? new Date(searchDates.checkout) : null;

      // Show ALL future itineraries, with match type indicators for date overlap
      const matchingItineraries = (itineraries || [])
        .map((itin: any) => {
          const itinEnd = itin.itin_date_end ? new Date(itin.itin_date_end) : null;
          const itinStart = itin.itin_date_start ? new Date(itin.itin_date_start) : null;

          // Skip past itineraries (where end date is before today)
          if (itinEnd && itinEnd < today) {
            return null;
          }

          let matchType = 'available'; // default: future but no date overlap

          if (searchStart && searchEnd && itinStart && itinEnd) {
            const isExactMatch =
              searchStart >= itinStart && searchEnd <= itinEnd;
            const hasPartialOverlap =
              (searchStart >= itinStart && searchStart <= itinEnd) ||
              (searchEnd >= itinStart && searchEnd <= itinEnd) ||
              (searchStart <= itinStart && searchEnd >= itinEnd);

            if (isExactMatch) matchType = 'exact';
            else if (hasPartialOverlap) matchType = 'partial';
          }

          return { ...itin, matchType };
        })
        .filter((itin: any) => itin !== null);

      // Sort: exact matches first, then partial, then available
      const order = { exact: 0, partial: 1, available: 2 };
      matchingItineraries.sort((a: any, b: any) => (order[a.matchType as keyof typeof order] ?? 2) - (order[b.matchType as keyof typeof order] ?? 2));

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
