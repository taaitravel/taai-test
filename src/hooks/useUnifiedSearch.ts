import { useState } from 'react';
import { useExpediaAPI } from './useExpediaAPI';
import { useAmadeusActivities } from './useAmadeusActivities';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useUnifiedSearch = (searchType: 'hotel' | 'flight' | 'activity' | 'package') => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { searchHotels } = useExpediaAPI();
  const { searchActivities: searchAmadeusActivities } = useAmadeusActivities();
  const { toast } = useToast();

  const executeSearch = async (params: any) => {
    setLoading(true);
    setResults([]);

    try {
      if (searchType === 'hotel') {
        const { data, error } = await searchHotels({
          destination: params.destination,
          checkin: params.checkin,
          checkout: params.checkout,
          adults: params.adults,
          rooms: params.rooms,
        });

        if (error) throw new Error(error);
        setResults(data?.hotels || []);
      } 
      else if (searchType === 'flight') {
        // Flight search APIs are not currently available
        // Booking.com RapidAPI doesn't support flights
        // Expedia Rapid Flight API is in early access (2026 release)
        toast({
          title: "Coming Soon",
          description: "Flight search will be available once provider APIs are publicly released.",
        });
        setResults([]);
      }
      else if (searchType === 'activity') {
        // First, geocode the destination to get coordinates
        const { data: geocodeData, error: geocodeError } = await supabase.functions.invoke(
          'search-cities',
          { body: { query: params.destination } }
        );

        if (geocodeError || !geocodeData?.features?.[0]) {
          throw new Error('Could not find location coordinates');
        }

        const [longitude, latitude] = geocodeData.features[0].center;

        // Search activities using Amadeus
        const { data, error } = await searchAmadeusActivities({
          latitude,
          longitude,
          radius: 5, // 5km radius
        });

        if (error) throw new Error(error);
        setResults(data?.activities || []);
      }
      else if (searchType === 'package') {
        // Package search requires flight API which is not available yet
        toast({
          title: "Coming Soon",
          description: "Package search will be available once flight search APIs are publicly released.",
        });
        setResults([]);
      }
    } catch (err: any) {
      console.error('Search error:', err);
      toast({
        title: 'Search Failed',
        description: err.message || 'Failed to search. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return { results, loading, executeSearch };
};
