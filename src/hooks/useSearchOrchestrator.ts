import { useState } from 'react';
import { useBookingAPI } from './useBookingAPI';
import { useExpediaAPI } from './useExpediaAPI';
import { useAmadeusActivities } from './useAmadeusActivities';
import { useFlightSearch } from './useFlightSearch';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FunctionsHttpError } from '@supabase/supabase-js';

type SearchNotice = { title: string; message: string; kind: 'info' | 'error' };

const readFunctionMessage = async (error: unknown, fallback: string): Promise<string> => {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.clone().json();
      return body?.error?.message || body?.error || fallback;
    } catch {
      return fallback;
    }
  }
  return error instanceof Error ? error.message : fallback;
};

export type SearchType = 'flights' | 'hotels' | 'cars' | 'activities' | 'packages' | 'dining';

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
  const [notice, setNotice] = useState<SearchNotice | null>(null);

  const { searchHotels, searchDestinations } = useBookingAPI();
  const { callExpediaAPI } = useExpediaAPI();
  const { searchActivities: searchAmadeusActivities } = useAmadeusActivities();
  const { searchFlights } = useFlightSearch();
  const { toast } = useToast();

  const executeSearch = async (type: SearchType, params: any) => {
    console.log('🔍 Starting real search:', type, params);
    setLoading(true);
    setResults([]);
    setNotice(null);
    setSearchType(type);

    try {
      let searchResults: any[] = [];

      switch (type) {
      case 'hotels': {
          console.log('🏨 Searching hotels via Booking.com API...');
          
          // Only use Booking.com for hotel searches (Expedia API endpoint not available)
          const bookingData = await (async () => {
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
          })();
          
          const checkinDate = new Date(params.checkin);
          const checkoutDate = new Date(params.checkout);
          const nights = Math.ceil((checkoutDate.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;
          
          // Rental-type keywords for categorization
          const rentalKeywords = ['apartment', 'vacation home', 'villa', 'holiday home', 'homestay', 'hostel', 'guest house', 'cottage', 'cabin', 'chalet', 'bungalow', 'condo', 'townhouse'];
          
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
              
              // Determine property category from accommodation type
              const accommType = (hotel.property?.propertyType || hotel.property?.accommodationTypeName || hotel.property?.type || '').toLowerCase();
              const isRental = rentalKeywords.some(kw => accommType.includes(kw));
              
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
                propertyCategory: isRental ? 'rental' : 'hotel',
                providerTag: 'Booking.com',
                check_in: params.checkin,
                check_out: params.checkout,
                rooms: params.rooms || 1,
                adults: params.adults || 2,
                children: params.children || 0,
                currency: hotel.property?.priceBreakdown?.grossPrice?.currency || 'USD',
              };
            })
          ) : [];
          
          // VRBO/Expedia search disabled - the expedia13 RapidAPI provider
          // does not have a working hotel search endpoint. Booking.com is the
          // primary and only active hotel provider.
          const vrboResults: any[] = [];
          
          // Merge and interleave results
          searchResults = [...bookingHotels, ...vrboResults];
          console.log(`✅ Found ${searchResults.length} total properties (${bookingHotels.length} Booking.com + ${vrboResults.length} VRBO)`);
          
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
          console.log('✈️ Searching flights (provider-neutral, reference-only)...');

          try {
            const outcome = await searchFlights({
              origin: params.origin,
              destination: params.destination,
              departureDate: params.departureDate,
              returnDate: params.returnDate,
              adults: params.adults || 1,
              children: params.children || 0,
              cabinClass: params.cabinClass || 'ECONOMY',
            });

            if (outcome.status === 'error') {
              const titles: Record<string, string> = {
                VALIDATION_ERROR: 'Check your search',
                AUTH_REQUIRED: 'Sign in required',
                PROVIDER_NOT_CONFIGURED: 'Flight search unavailable',
                PROVIDER_AUTH_FAILED: 'Flight search unavailable',
                PROVIDER_RATE_LIMITED: 'Too many searches',
                PROVIDER_UNAVAILABLE: 'Provider unavailable',
                RESPONSE_MAPPING_ERROR: 'Results unreadable',
              };
              const title = titles[outcome.error?.code ?? ''] || 'Flight search failed';
              const message = outcome.error?.message || 'Unable to search flights right now.';
              setNotice({ title, message, kind: 'error' });
              toast({
                title,
                description: message,
                variant: outcome.error?.code === 'PROVIDER_NOT_CONFIGURED' ? 'default' : 'destructive',
              });
              searchResults = [];
              break;
            }

            // Deduplicate by route + departure timestamp.
            const seen = new Set<string>();
            searchResults = outcome.offers.filter((offer) => {
              const key = `${offer.origin}-${offer.destination}-${offer.slices[0]?.departureAt}-${offer.observedPrice.amount}`;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });

            console.log(`✅ ${searchResults.length} flight references (request ${outcome.requestId})`);

            if (outcome.status === 'no_results' || searchResults.length === 0) {
              setNotice({
                title: 'No flights found',
                message: 'Try adjusting your dates, airports, or cabin class.',
                kind: 'info',
              });
              toast({
                title: 'No flights found',
                description: 'Try adjusting your dates, airports, or cabin class.',
                variant: 'default',
              });
            }
          } catch (err: any) {
            console.error('❌ Flight search failed:', err);
            const message = err.message || 'Unable to search flights.';
            setNotice({ title: 'Search failed', message, kind: 'error' });
            toast({
              title: 'Search failed',
              description: message,
              variant: 'destructive',
            });
            searchResults = [];
          }
          break;

        }

      case 'activities': {
          console.log('🎯 Searching activities via Amadeus...');
          
          try {
            let lat = Number(params.latitude);
            let lon = Number(params.longitude);
            if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
              console.log(`🗺️ Geocoding destination: "${params.destination}"`);
              const { data: geocodeData, error: geocodeError } = await supabase.functions.invoke(
                'search-cities',
                { body: { query: params.destination } }
              );
              if (geocodeError) {
                const message = await readFunctionMessage(
                  geocodeError,
                  'We could not locate that destination. Please choose it from the suggestions and try again.',
                );
                throw new Error(message);
              }
              const location = geocodeData?.locations?.[0];
              if (!location || !Number.isFinite(Number(location.lat)) || !Number.isFinite(Number(location.lng))) {
                throw new Error(`Could not find coordinates for "${params.destination}". Choose a more specific city or region.`);
              }
              lat = Number(location.lat);
              lon = Number(location.lng);
            }
            console.log(`📍 Geocoded "${params.destination}" to [${lat}, ${lon}]`);

            // Search activities using Amadeus
            const { data, error } = await searchAmadeusActivities({
              latitude: lat,
              longitude: lon,
              radius: 5, // 5km radius
            });

            if (error) {
              const activityTitles: Record<string, string> = {
                AUTH_REQUIRED: 'Sign in required',
                VALIDATION_ERROR: 'Check your destination',
                PROVIDER_NOT_CONFIGURED: 'Activities not configured',
                PROVIDER_AUTH_FAILED: 'Activity search unavailable',
                PROVIDER_RATE_LIMITED: 'Too many activity searches',
                PROVIDER_UNAVAILABLE: 'Activity provider unavailable',
              };
              const title = activityTitles[error.code] || 'Activity search unavailable';
              setNotice({ title, message: error.message, kind: 'error' });
              toast({ title, description: error.message, variant: 'destructive' });
              searchResults = [];
              break;
            }

            searchResults = (data?.activities || []).map((activity: any) => ({
              id: activity.id,
              name: activity.name,
              description: activity.description,
              location: activity.city || activity.location || params.destination,
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
              participants: params.participants,
            }));

            console.log(`✅ Found ${searchResults.length} activities`);

            if (searchResults.length === 0) {
              setNotice({
                title: 'No activities found',
                message: 'Try another nearby destination or broaden your search.',
                kind: 'info',
              });
              toast({
                title: 'No Activities Found',
                description: 'Try adjusting your location or search criteria.',
                variant: 'default',
              });
            }
          } catch (err: any) {
            console.error('❌ Activity search failed:', err);
            const message = err.message || 'Unable to search activities.';
            setNotice({ title: 'Activity search unavailable', message, kind: 'error' });
            toast({
              title: 'Activity search unavailable',
              description: message,
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

        case 'dining': {
          console.log('🍽️ Searching restaurants via Yelp...');
          try {
            // Geocode the location
            const { data: geocodeData, error: geocodeError } = await supabase.functions.invoke(
              'search-cities',
              { body: { query: params.location } }
            );

            if (geocodeError || !geocodeData?.features?.length) {
              throw new Error(`Could not find location "${params.location}"`);
            }

            const [lon, lat] = geocodeData.features[0].center;
            const cityName = geocodeData.features[0].text || params.location;

            // Search Yelp
            const searchTerm = params.cuisine && params.cuisine !== 'all'
              ? `${params.cuisine} restaurant`
              : 'restaurant';

            const { data: yelpData, error: yelpError } = await supabase.functions.invoke(
              'search-yelp-businesses',
              { body: { term: searchTerm, latitude: lat, longitude: lon, location: params.location } }
            );

            if (yelpError) throw new Error('Yelp search failed');

            // Graceful "Coming Soon" handling when Yelp key is not yet enabled
            if (yelpData?.disabled) {
              toast({
                title: 'Dining — Coming Soon',
                description: 'Restaurant search rolls out shortly after launch. Stay tuned!',
                variant: 'default',
              });
              searchResults = [];
              break;
            }

            const dateStr = params.date || '';
            const timeStr = params.time || '19:00';
            const covers = params.partySize || 2;

            searchResults = (yelpData?.businesses || []).map((biz: any) => {
              const name = biz.name || 'Unknown Restaurant';
              const address = biz.location?.display_address?.join(', ') || '';
              const encodedName = encodeURIComponent(name);
              const encodedAddress = encodeURIComponent(`${name} ${address}`);
              const city = biz.location?.city?.toLowerCase() || cityName.toLowerCase();

              return {
                id: biz.id,
                name,
                image: biz.image_url || '',
                rating: biz.rating,
                reviewCount: biz.review_count,
                priceLevel: biz.price || '',
                categories: (biz.categories || []).map((c: any) => c.title),
                address,
                phone: biz.phone,
                latitude: biz.coordinates?.latitude,
                longitude: biz.coordinates?.longitude,
                yelpUrl: biz.url,
                openTableUrl: `https://www.opentable.com/s?term=${encodedName}&covers=${covers}&dateTime=${dateStr}T${timeStr}`,
                resyUrl: `https://resy.com/cities/${encodeURIComponent(city)}?query=${encodedName}&date=${dateStr}&seats=${covers}`,
                googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
              };
            });

            console.log(`✅ Found ${searchResults.length} restaurants`);

            if (searchResults.length === 0) {
              toast({
                title: 'No Restaurants Found',
                description: 'Try adjusting your location or cuisine.',
                variant: 'default',
              });
            }
          } catch (err: any) {
            console.error('❌ Dining search failed:', err);
            toast({
              title: 'Search Failed',
              description: err.message || 'Unable to search restaurants.',
              variant: 'destructive',
            });
            searchResults = [];
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

  return { results, loading, searchType, notice, executeSearch };
};
