import { useState } from 'react';
import { useExpediaAPI } from './useExpediaAPI';
import { useToast } from '@/hooks/use-toast';

export type SearchType = 'flights' | 'hotels' | 'cars' | 'activities' | 'packages';

export const useSearchOrchestrator = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [searchType, setSearchType] = useState<SearchType | null>(null);

  const { searchHotels, searchFlights, searchActivities } = useExpediaAPI();
  const { toast } = useToast();

  const executeSearch = async (type: SearchType, params: any) => {
    setLoading(true);
    setResults([]);
    setSearchType(type);

    try {
      let searchResults: any[] = [];

      switch (type) {
        case 'hotels': {
          const { data, error } = await searchHotels({
            destination: params.destination,
            checkin: params.checkin,
            checkout: params.checkout,
            adults: params.adults || 2,
            rooms: params.rooms || 1,
          });

          if (error) {
            toast({
              title: 'Hotel Search Failed',
              description: error,
              variant: 'destructive',
            });
          }

          searchResults = data?.hotels || [];
          break;
        }

        case 'flights': {
          const { data, error } = await searchFlights({
            origin: params.origin,
            destination: params.destination,
            departure_date: params.checkin,
            return_date: params.checkout,
            adults: params.adults || 1,
          });

          if (error) {
            toast({
              title: 'Flight Search Failed',
              description: error,
              variant: 'destructive',
            });
          }

          searchResults = data?.flights || [];
          break;
        }

        case 'activities': {
          const { data, error } = await searchActivities({
            destination: params.destination,
            date: params.checkin,
          });

          if (error) {
            toast({
              title: 'Activity Search Failed',
              description: error,
              variant: 'destructive',
            });
          }

          searchResults = data?.activities || [];
          break;
        }

        case 'cars': {
          // Mock car results for now
          searchResults = [
            {
              id: 'car-1',
              name: 'Economy Car',
              company: 'Enterprise',
              type: 'Economy',
              price: 45,
              image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400',
            },
            {
              id: 'car-2',
              name: 'SUV',
              company: 'Hertz',
              type: 'SUV',
              price: 85,
              image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400',
            },
          ];
          break;
        }

        case 'packages': {
          // Search hotels and flights in parallel for packages
          const [hotelResponse, flightResponse] = await Promise.all([
            searchHotels({
              destination: params.destination,
              checkin: params.checkin,
              checkout: params.checkout,
              adults: params.adults || 2,
              rooms: params.rooms || 1,
            }),
            searchFlights({
              origin: params.origin,
              destination: params.destination,
              departure_date: params.checkin,
              return_date: params.checkout,
              adults: params.adults || 1,
            }),
          ]);

          const hotels = hotelResponse.data?.hotels || [];
          const flights = flightResponse.data?.flights || [];

          searchResults = hotels.slice(0, 5).map((hotel: any, idx: number) => ({
            id: `package-${idx}`,
            hotel,
            flight: flights[idx % flights.length],
            car: params.includeCar ? {
              type: 'Economy',
              price: Math.floor(Math.random() * 100) + 50,
              company: 'Enterprise',
            } : null,
            totalPrice:
              (hotel.price || 0) +
              (flights[idx % flights.length]?.price || 0) +
              (params.includeCar ? Math.floor(Math.random() * 100) + 50 : 0),
          }));

          if (hotelResponse.error || flightResponse.error) {
            toast({
              title: 'Package Search Failed',
              description: hotelResponse.error || flightResponse.error,
              variant: 'destructive',
            });
          }
          break;
        }
      }

      setResults(searchResults);

      if (searchResults.length === 0) {
        toast({
          title: 'No results found',
          description: 'Try adjusting your search criteria.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Search Failed',
        description: 'An error occurred while searching. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return { results, loading, searchType, executeSearch };
};
