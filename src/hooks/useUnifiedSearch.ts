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
        const { data, error } = await searchFlights({
          origin: params.origin,
          destination: params.destination,
          departure_date: params.checkin,
          return_date: params.checkout,
          adults: params.adults,
        });

        if (error) throw new Error(error);
        setResults(data?.flights || []);
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
        // Search both hotels and flights in parallel
        const [hotelResponse, flightResponse] = await Promise.all([
          searchHotels({
            destination: params.destination,
            checkin: params.checkin,
            checkout: params.checkout,
            adults: params.adults,
            rooms: params.rooms,
          }),
          searchFlights({
            origin: params.origin,
            destination: params.destination,
            departure_date: params.checkin,
            return_date: params.checkout,
            adults: params.adults,
          }),
        ]);

        if (hotelResponse.error || flightResponse.error) {
          throw new Error(hotelResponse.error || flightResponse.error);
        }

        // Combine results as packages
        const hotels = hotelResponse.data?.hotels || [];
        const flights = flightResponse.data?.flights || [];
        
        const packages = hotels.slice(0, 5).map((hotel: any, idx: number) => ({
          id: `package-${idx}`,
          hotel,
          flight: flights[idx % flights.length],
          totalPrice: (hotel.price || 0) + (flights[idx % flights.length]?.price || 0),
        }));

        setResults(packages);
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
