import { useState } from 'react';
import { useBookingAPI } from './useBookingAPI';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export type SearchType = 'flights' | 'hotels' | 'cars' | 'activities' | 'packages';

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
};

// Reverse geocode coordinates to city name using Mapbox
const getCityName = async (lat: number, lon: number): Promise<string> => {
  try {
    // Get Mapbox token
    const { data: tokenData, error: tokenError } = await supabase.functions.invoke('get-mapbox-token');
    
    if (tokenError || !tokenData?.token) {
      console.warn('Failed to get Mapbox token');
      return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    }
    
    // Reverse geocode: coordinates to place name
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${tokenData.token}&types=place,region&limit=1`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn('Mapbox reverse geocoding failed');
      return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    }
    
    const data = await response.json();
    const feature = data.features?.[0];
    
    if (!feature) {
      return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    }
    
    const city = feature.text || '';
    const context = feature.context || [];
    const countryContext = context.find((c: any) => c.id?.startsWith('country.'));
    const country = countryContext?.text || '';
    
    return country ? `${city}, ${country}` : city;
  } catch (err) {
    console.error('Error getting city name:', err);
    return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
  }
};

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
          const destType = destData.data[0].dest_type;
          const searchLat = destData.data[0].latitude;
          const searchLon = destData.data[0].longitude;
          
          console.log('🏨 Found destination:', { destId, destType, searchLat, searchLon });
          
          const { data, error } = await searchHotels({
            dest_id: destId,
            search_type: destType,
            arrival_date: params.checkin,
            departure_date: params.checkout,
            adults: params.adults || 2,
            room_qty: params.rooms || 1,
          });

          if (error) {
            console.error('🏨 Hotel search API error:', error);
            
            // Check for quota exceeded error
            if (error.includes('QUOTA_EXCEEDED') || error.includes('429') || error.includes('exceeded the MONTHLY quota')) {
              toast({
                title: 'API Quota Exceeded',
                description: 'The hotel search API has reached its limit. Please try again later or contact support.',
                variant: 'destructive',
              });
              searchResults = [];
              break;
            }
            
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
            
            // Calculate nights from checkin/checkout dates
            const checkinDate = new Date(params.checkin);
            const checkoutDate = new Date(params.checkout);
            const nights = Math.ceil((checkoutDate.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24));
            
            // Transform Booking.com response to expected format with geocoding
            const hotelsWithLocation = await Promise.all(
              data.data.hotels.map(async (hotel: any) => {
                const totalPrice = Math.round((hotel.property?.priceBreakdown?.grossPrice?.value || 0) * 100) / 100;
                const pricePerNight = Math.round((totalPrice / nights) * 100) / 100;
                
                const hotelLat = hotel.property?.latitude;
                const hotelLon = hotel.property?.longitude;
                
                // Get city name and distance
                let cityName = 'Location';
                let distanceFromSearch = 0;
                
                if (hotelLat && hotelLon) {
                  cityName = await getCityName(hotelLat, hotelLon);
                  if (searchLat && searchLon) {
                    distanceFromSearch = calculateDistance(searchLat, searchLon, hotelLat, hotelLon);
                  }
                }
                
                return {
                  id: hotel.hotel_id,
                  name: hotel.property?.name || hotel.accessibilityLabel?.split('.')[0] || 'Unknown Hotel',
                  images: hotel.property?.photoUrls || [],
                  rating: hotel.property?.reviewScore || hotel.property?.accuratePropertyClass || 0,
                  class: hotel.property?.propertyClass || 0,
                  review_score: hotel.property?.reviewScore || 0,
                  review_count: hotel.property?.reviewCount || 0,
                  pricePerNight: pricePerNight,
                  totalPrice: totalPrice,
                  price: pricePerNight,
                  min_total_price: totalPrice,
                  nights: nights,
                  currency: hotel.property?.priceBreakdown?.grossPrice?.currency || 'USD',
                  location: `${cityName}, ${distanceFromSearch} mi`,
                  cityName: cityName,
                  distanceFromSearch: distanceFromSearch,
                  latitude: hotelLat,
                  longitude: hotelLon,
                  description: hotel.accessibilityLabel || '',
                  amenities: [],
                  hotel_facilities: [],
                  checkin: hotel.property?.checkin,
                  checkout: hotel.property?.checkout,
                  bookingUrl: hotel.property?.url || `https://www.booking.com/hotel/us/${hotel.hotel_id}.html`,
                  _original: hotel
                };
              })
            );
            
            searchResults = hotelsWithLocation;
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
