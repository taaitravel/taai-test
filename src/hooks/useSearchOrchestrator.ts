import { useState } from 'react';
import { useExpediaAPI } from './useExpediaAPI';
import { useToast } from '@/hooks/use-toast';

export const useSearchOrchestrator = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>({
    hotels: [],
    flights: [],
    activities: [],
    cars: [],
    packages: [],
  });
  const { searchHotels, searchFlights, searchActivities } = useExpediaAPI();
  const { toast } = useToast();

  const executeSearch = async (params: any) => {
    setLoading(true);
    setResults({ hotels: [], flights: [], activities: [], cars: [], packages: [] });

    const searchPromises = [];

    try {
      // Search based on selected types
      if (params.searchTypes.hotels) {
        searchPromises.push(
          searchHotels({
            destination: params.destination,
            checkin: params.checkin,
            checkout: params.checkout,
            adults: params.adults,
            rooms: params.rooms,
          }).then(({ data, error }) => ({
            type: 'hotels',
            data: error ? [] : data?.hotels || [],
            error,
          }))
        );
      }

      if (params.searchTypes.flights) {
        searchPromises.push(
          searchFlights({
            origin: params.origin,
            destination: params.destination,
            departure_date: params.checkin,
            return_date: params.checkout,
            adults: params.adults,
          }).then(({ data, error }) => ({
            type: 'flights',
            data: error ? [] : data?.flights || [],
            error,
          }))
        );
      }

      if (params.searchTypes.activities) {
        searchPromises.push(
          searchActivities({
            destination: params.destination,
            date: params.checkin,
          }).then(({ data, error }) => ({
            type: 'activities',
            data: error ? [] : data?.activities || [],
            error,
          }))
        );
      }

      // Wait for all searches to complete
      const responses = await Promise.all(searchPromises);

      // Process results
      const newResults: any = { hotels: [], flights: [], activities: [], cars: [], packages: [] };
      responses.forEach(response => {
        if (!response.error && response.data) {
          newResults[response.type] = response.data;
        }
      });

      // Create packages if both flights and hotels exist
      if (newResults.hotels.length > 0 && newResults.flights.length > 0) {
        newResults.packages = newResults.hotels.slice(0, 5).map((hotel: any, idx: number) => ({
          id: `package-${idx}`,
          hotel,
          flight: newResults.flights[idx % newResults.flights.length],
          car: {
            name: 'Toyota Camry',
            price: 45,
            type: 'Sedan',
          },
        }));
      }

      setResults(newResults);

      const totalResults =
        newResults.hotels.length +
        newResults.flights.length +
        newResults.activities.length +
        newResults.packages.length;

      if (totalResults === 0) {
        toast({
          title: 'No results found',
          description: 'Try adjusting your search criteria.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      console.error('Search orchestration error:', err);
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
