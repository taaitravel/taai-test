import { useState } from 'react';
import { useBookingAPI } from './useBookingAPI';
import { useExpediaAPI } from './useExpediaAPI';
import { useAmadeusActivities } from './useAmadeusActivities';
import { useAmadeusFlights } from './useAmadeusFlights';
import { useToast } from '@/components/ui/use-toast';
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
  const { searchHotels: searchExpediaHotels } = useExpediaAPI();
  const { searchActivities: searchAmadeusActivities } = useAmadeusActivities();
  const { searchFlights: searchAmadeusFlights } = useAmadeusFlights();
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
          console.log('🏨 Searching hotels via Booking.com and Expedia APIs...');
          
          // Make parallel API calls to both providers
          const [bookingData, expediaData] = await Promise.all([
            // Booking.com search
            (async () => {
              try {
                const { data: destData, error: destError } = await searchDestinations(params.destination);
                if (destError || !destData) return null;
                
                let destinations = destData?.data || destData?.destinations || destData;
                if (!Array.isArray(destinations)) destinations = [destinations];
                if (!destinations || destinations.length === 0) return null;
                
                const destination = destinations[0];
                const destId = destination.dest_id || destination.id;
                const destType = destination.dest_type || destination.type || 'city';
                const searchLat = destination.latitude || destination.lat;
                const searchLon = destination.longitude || destination.lon || destination.lng;
                
                const { data, error } = await searchHotels({
                  dest_id: destId,
                  search_type: destType,
                  arrival_date: params.checkin,
                  departure_date: params.checkout,
                  adults: params.adults || 2,
                  room_qty: params.rooms || 1,
                });
                
                if (error || !data?.data?.hotels) return null;
                
                return { hotels: data.data.hotels, searchLat, searchLon };
              } catch (err) {
                console.error('🏨 Booking.com error:', err);
                return null;
              }
            })(),
            
            // Expedia search
            (async () => {
              try {
                const { data, error } = await searchExpediaHotels({
                  destination: params.destination,
                  checkin: params.checkin,
                  checkout: params.checkout,
                  adults: params.adults || 2,
                  children: params.children || 0,
                  rooms: params.rooms || 1,
                });
                
                if (error || !data) return null;
                return data;
              } catch (err) {
                console.error('🏨 Expedia error:', err);
                return null;
              }
            })()
          ]);
          
          const checkinDate = new Date(params.checkin);
          const checkoutDate = new Date(params.checkout);
          const nights = Math.ceil((checkoutDate.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;
          
          // Process Booking.com results
          const bookingHotels = bookingData ? await Promise.all(
            bookingData.hotels.map(async (hotel: any) => {
              const totalPrice = Math.round((hotel.property?.priceBreakdown?.grossPrice?.value || 0) * 100) / 100;
              const pricePerNight = Math.round((totalPrice / nights) * 100) / 100;
              
              const hotelLat = hotel.property?.latitude;
              const hotelLon = hotel.property?.longitude;
              
              let cityName = 'Location';
              let distanceFromSearch = 0;
              
              if (hotelLat && hotelLon) {
                cityName = await getCityName(hotelLat, hotelLon);
                if (bookingData.searchLat && bookingData.searchLon) {
                  distanceFromSearch = calculateDistance(bookingData.searchLat, bookingData.searchLon, hotelLat, hotelLon);
                }
              }
              
              return {
                id: `booking-${hotel.hotel_id}`,
                name: hotel.property?.name || hotel.accessibilityLabel?.split('.')[0] || 'Unknown Hotel',
                images: hotel.property?.photoUrls || [],
                rating: hotel.property?.reviewScore || hotel.property?.accuratePropertyClass || 0,
                review_count: hotel.property?.reviewCount || 0,
                pricePerNight,
                totalPrice,
                nights,
                cityName,
                distanceFromSearch,
                latitude: hotelLat,
                longitude: hotelLon,
                bookingUrl: hotel.property?.url || `https://www.booking.com/hotel/us/${hotel.hotel_id}.html`,
                source: 'Booking.com',
              };
            })
          ) : [];
          
          // Process Expedia results
          const expediaHotels = expediaData ? (expediaData.properties || expediaData.hotels || []).map((hotel: any) => {
            const priceData = hotel.price || hotel.ratePlan?.price || {};
            const totalPrice = priceData.total || priceData.lead?.amount || 0;
            const pricePerNight = Math.round((totalPrice / nights) * 100) / 100;
            
            return {
              id: `expedia-${hotel.id || hotel.propertyId}`,
              name: hotel.name || 'Unknown Hotel',
              images: hotel.images ? hotel.images.map((img: any) => img.url) : [],
              rating: hotel.starRating || hotel.guestReviews?.rating || 0,
              review_count: hotel.guestReviews?.total || 0,
              pricePerNight,
              totalPrice,
              nights,
              cityName: hotel.address?.city || hotel.location?.city || '',
              distanceFromSearch: null,
              latitude: hotel.latitude || hotel.lat || hotel.location?.latitude,
              longitude: hotel.longitude || hotel.lon || hotel.lng || hotel.location?.longitude,
              bookingUrl: hotel.url || `https://www.expedia.com/h${hotel.id}.Hotel-Information`,
              source: 'Expedia',
            };
          }) : [];
          
          searchResults = [...bookingHotels, ...expediaHotels];
          console.log(`✅ Combined ${searchResults.length} hotels (${bookingHotels.length} Booking.com, ${expediaHotels.length} Expedia)`);
          
          if (searchResults.length === 0) {
            toast({
              title: 'No Hotels Found',
              description: 'Try adjusting your dates or destination.',
              variant: 'default',
            });
          }
          break;
        }

      case 'flights': {
          console.log('✈️ Searching flights via Amadeus...');
          
          try {
            const { data, error } = await searchAmadeusFlights({
              origin: params.origin,
              destination: params.destination,
              departureDate: params.departureDate,
              returnDate: params.returnDate,
              adults: params.adults || 1,
              children: params.children || 0,
              cabinClass: params.cabinClass || 'ECONOMY',
            });

            if (error || !data?.flights) {
              console.error('Flight search error:', error);
              toast({
                title: 'Flight Search Failed',
                description: 'Unable to find flights. Please check your airport codes and try again.',
                variant: 'destructive',
              });
              searchResults = [];
              break;
            }

            // Deduplicate flights by unique departure time, origin, and destination
            const uniqueFlights = data.flights.reduce((acc: any[], flight: any) => {
              const key = `${flight.from}-${flight.to}-${flight.departure}`;
              const exists = acc.some((f: any) => `${f.from}-${f.to}-${f.departure}` === key);
              if (!exists) {
                acc.push(flight);
              }
              return acc;
            }, []);
            
            searchResults = uniqueFlights;
            console.log(`✅ Found ${searchResults.length} unique flights from Amadeus (${data.flights.length} total offers)`);

            if (searchResults.length === 0) {
              toast({
                title: 'No Flights Found',
                description: 'Try adjusting your dates or airports.',
                variant: 'default',
              });
            }
          } catch (err: any) {
            console.error('❌ Flight search failed:', err);
            toast({
              title: 'Search Failed',
              description: err.message || 'Unable to search flights.',
              variant: 'destructive',
            });
            searchResults = [];
          }
          break;
        }

      case 'activities': {
          console.log('🎯 Searching activities via Amadeus...');
          
          try {
            // First, geocode the destination to get coordinates
            console.log(`🗺️ Geocoding destination: "${params.destination}"`);
            
            const { data: geocodeData, error: geocodeError } = await supabase.functions.invoke(
              'search-cities',
              { body: { query: params.destination } }
            );

            console.log('Geocode response:', { geocodeData, geocodeError });

            if (geocodeError) {
              console.error('Geocode error:', geocodeError);
              throw new Error(`Geocoding failed: ${geocodeError.message}`);
            }

            if (!geocodeData?.features || geocodeData.features.length === 0) {
              console.error('No geocode results for:', params.destination);
              throw new Error(`Could not find coordinates for "${params.destination}". Try a more specific location like "Miami, Florida" or "Miami Beach"`);
            }

            // Mapbox returns [longitude, latitude] format
            const [lon, lat] = geocodeData.features[0].center;
            console.log(`📍 Geocoded "${params.destination}" to [${lat}, ${lon}]`);

            // Search activities using Amadeus
            const { data, error } = await searchAmadeusActivities({
              latitude: lat,
              longitude: lon,
              radius: 5, // 5km radius
            });

            if (error) throw new Error(error);

            searchResults = (data?.activities || []).map((activity: any) => ({
              id: activity.id,
              name: activity.name,
              description: activity.description,
              location: activity.city,
              latitude: activity.latitude,
              longitude: activity.longitude,
              category: activity.category,
              rating: activity.rating,
              price: activity.price,
              currency: activity.currency,
              images: activity.images,
              duration: activity.duration,
              groupSize: activity.groupSize,
              bookingLink: activity.bookingLink,
              date: params.checkin,
            }));

            console.log(`✅ Found ${searchResults.length} activities`);

            if (searchResults.length === 0) {
              toast({
                title: 'No Activities Found',
                description: 'Try adjusting your location or search criteria.',
                variant: 'default',
              });
            }
          } catch (err: any) {
            console.error('❌ Activity search failed:', err);
            toast({
              title: 'Search Failed',
              description: err.message || 'Unable to search activities.',
              variant: 'destructive',
            });
            searchResults = [];
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
