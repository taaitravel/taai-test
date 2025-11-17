import { useState } from 'react';
import { useBookingAPI } from './useBookingAPI';
import { useToast } from '@/hooks/use-toast';

export type SearchType = 'flights' | 'hotels' | 'cars' | 'activities' | 'packages';

export const useSearchOrchestrator = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [searchType, setSearchType] = useState<SearchType | null>(null);

  const { searchHotels, searchDestinations } = useBookingAPI();
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
          console.log('🏨 Searching real hotels via Booking.com API...');
          
          // First, get destination ID from destination name
          const { data: destData, error: destError } = await searchDestinations(params.destination);
          
          if (destError || !destData?.data?.[0]) {
            console.error('🏨 Destination search error:', destError);
            toast({
              title: 'Destination Not Found',
              description: 'Could not find the destination. Please try a different location.',
              variant: 'default',
            });
            searchResults = [];
            break;
          }
          
          const destId = destData.data[0].dest_id;
          const searchType = destData.data[0].dest_type;
          
          console.log('🏨 Found destination:', { destId, searchType });
          
          const { data, error } = await searchHotels({
            dest_id: destId,
            search_type: searchType,
            arrival_date: params.checkin,
            departure_date: params.checkout,
            adults: params.adults || 2,
            room_qty: params.rooms || 1,
          });

          if (error) {
            console.error('🏨 Hotel search API error:', error);
            throw new Error(`Hotel search failed: ${error}`);
          }

          if (!data?.data?.hotels || data.data.hotels.length === 0) {
            console.log('🏨 No hotels found for search criteria');
            toast({
              title: 'No Hotels Found',
              description: 'Try adjusting your dates or destination.',
              variant: 'default',
            });
            searchResults = [];
          } else {
            console.log('✅ Found', data.data.hotels.length, 'real hotels');
            
            // Transform Booking.com response to expected format
            searchResults = data.data.hotels.map((hotel: any) => ({
              id: hotel.hotel_id,
              name: hotel.property?.name || hotel.accessibilityLabel?.split('.')[0] || 'Unknown Hotel',
              images: hotel.property?.photoUrls || [],
              rating: hotel.property?.reviewScore || hotel.property?.accuratePropertyClass || 0,
              class: hotel.property?.propertyClass || 0,
              review_score: hotel.property?.reviewScore || 0,
              review_count: hotel.property?.reviewCount || 0,
              price: hotel.property?.priceBreakdown?.grossPrice?.value || 0,
              min_total_price: hotel.property?.priceBreakdown?.grossPrice?.value || 0,
              currency: hotel.property?.priceBreakdown?.grossPrice?.currency || 'USD',
              location: hotel.property?.ufi ? `${hotel.property.latitude}, ${hotel.property.longitude}` : 'Location not available',
              latitude: hotel.property?.latitude,
              longitude: hotel.property?.longitude,
              description: hotel.accessibilityLabel || '',
              amenities: [],
              hotel_facilities: [],
              checkin: hotel.property?.checkin,
              checkout: hotel.property?.checkout,
              _original: hotel
            }));
          }
          break;
        }

      case 'flights': {
          console.log('✈️ Flight search not yet implemented');
          toast({
            title: 'Coming Soon',
            description: 'Flight search will be available soon.',
            variant: 'default',
          });
          searchResults = [];
          break;
        }

      case 'activities': {
          console.log('🎯 Activity search not yet implemented');
          toast({
            title: 'Coming Soon',
            description: 'Activity search will be available soon.',
            variant: 'default',
          });
          searchResults = [];
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
          console.log('📦 Package search not yet implemented');
          toast({
            title: 'Coming Soon',
            description: 'Package search will be available soon.',
            variant: 'default',
          });
          searchResults = [];
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
