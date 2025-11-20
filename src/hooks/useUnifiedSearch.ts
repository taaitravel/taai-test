import { useState } from 'react';
import { useExpediaAPI } from './useExpediaAPI';
import { useToast } from '@/components/ui/use-toast';

export const useUnifiedSearch = (searchType: 'hotel' | 'flight' | 'activity' | 'package') => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { searchHotels, searchFlights, searchActivities } = useExpediaAPI();
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
        const { data, error } = await searchActivities({
          destination: params.destination,
          date: params.checkin,
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
