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
    console.log('🔍 Starting real search:', type, params);
    setLoading(true);
    setResults([]);
    setSearchType(type);

    try {
      let searchResults: any[] = [];

      switch (type) {
        case 'hotels': {
          console.log('🏨 Searching real hotels via Expedia API...');
          const { data, error } = await searchHotels({
            destination: params.destination,
            checkin: params.checkin,
            checkout: params.checkout,
            adults: params.adults || 2,
            rooms: params.rooms || 1,
          });

          if (error) {
            console.error('🏨 Hotel search API error:', error);
            throw new Error(`Hotel search failed: ${error}`);
          }

          if (!data?.hotels || data.hotels.length === 0) {
            console.log('🏨 No hotels found for search criteria');
            toast({
              title: 'No Hotels Found',
              description: 'Try adjusting your dates or destination.',
              variant: 'default',
            });
            searchResults = [];
          } else {
            console.log('✅ Found', data.hotels.length, 'real hotels');
            searchResults = data.hotels;
          }
          break;
        }

        case 'flights': {
          console.log('✈️ Searching real flights via Expedia API...');
          const { data, error } = await searchFlights({
            origin: params.origin,
            destination: params.destination,
            departure_date: params.checkin,
            return_date: params.checkout,
            adults: params.adults || 1,
          });

          if (error) {
            console.error('✈️ Flight search API error:', error);
            throw new Error(`Flight search failed: ${error}`);
          }

          if (!data?.flights || data.flights.length === 0) {
            console.log('✈️ No flights found for search criteria');
            toast({
              title: 'No Flights Found',
              description: 'Try adjusting your dates or airports.',
              variant: 'default',
            });
            searchResults = [];
          } else {
            console.log('✅ Found', data.flights.length, 'real flights');
            searchResults = data.flights;
          }
          break;
        }

        case 'activities': {
          console.log('🎯 Searching real activities via Expedia API...');
          const { data, error } = await searchActivities({
            destination: params.destination,
            date: params.checkin,
          });

          if (error) {
            console.error('🎯 Activity search API error:', error);
            throw new Error(`Activity search failed: ${error}`);
          }

          if (!data?.activities || data.activities.length === 0) {
            console.log('🎯 No activities found for search criteria');
            toast({
              title: 'No Activities Found',
              description: 'Try a different location.',
              variant: 'default',
            });
            searchResults = [];
          } else {
            console.log('✅ Found', data.activities.length, 'real activities');
            searchResults = data.activities;
          }
          break;
        }

        case 'cars': {
          console.log('🚗 Car rentals - coming soon');
          toast({
            title: 'Coming Soon',
            description: 'Car rental search will be available soon.',
            variant: 'default',
          });
          searchResults = [];
          break;
        }

        case 'packages': {
          console.log('📦 Searching real packages (hotels + flights)...');
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

          if (hotelResponse.error || flightResponse.error) {
            console.error('📦 Package search error');
            throw new Error('Package search failed: ' + (hotelResponse.error || flightResponse.error));
          }

          const hotels = hotelResponse.data?.hotels || [];
          const flights = flightResponse.data?.flights || [];

          if (hotels.length === 0 || flights.length === 0) {
            console.log('📦 Incomplete package data');
            toast({
              title: 'Limited Availability',
              description: hotels.length === 0 ? 'No hotels available' : 'No flights available',
              variant: 'default',
            });
            searchResults = [];
          } else {
            searchResults = hotels.slice(0, 5).map((hotel: any, idx: number) => ({
              id: `package-${idx}`,
              hotel,
              flight: flights[idx % flights.length],
              totalPrice: (hotel.price || 0) + (flights[idx % flights.length]?.price || 0),
            }));
            console.log('✅ Created', searchResults.length, 'real packages');
          }
          break;
        }
      }

      setResults(searchResults);
    } catch (err: any) {
      console.error('❌ Search failed:', err);
      toast({
        title: 'Search Failed',
        description: err.message || 'Unable to complete search. Please check your connection and try again.',
        variant: 'destructive',
      });
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return { results, loading, searchType, executeSearch };
};
