import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { useToast } from '@/components/ui/use-toast';

/**
 * Reads the real failure text out of a non-2xx edge response so a provider
 * subscription/authorization problem is reported as such instead of being
 * flattened into a generic "no properties" message.
 */
const readProviderFailure = async (error: unknown, fallback: string): Promise<string> => {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.clone().json();
      const detail = body?.message || body?.error;
      if (typeof detail === 'string' && detail.trim()) {
        return /upstream request failed \(40[13]\)/i.test(detail)
          ? 'The property provider rejected our request (not authorized). The provider subscription needs review.'
          : detail;
      }
    } catch {
      // Fall through to the generic message.
    }
  }
  return error instanceof Error && error.message ? error.message : fallback;
};

interface BookingAPIParams {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params?: Record<string, string>;
  body?: any;
}

interface BookingAPIResponse<T = any> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export const useBookingAPI = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const callBookingAPI = async <T = any>({
    endpoint,
    method = 'GET',
    params = {},
    body = null
  }: BookingAPIParams): Promise<BookingAPIResponse<T>> => {
    setLoading(true);
    
    try {
      console.log('🏨 Calling Booking.com API:', { endpoint, method, params });
      
      const { data, error } = await supabase.functions.invoke('booking-com-api', {
        body: {
          endpoint,
          method,
          params,
          body
        }
      });

      if (error) {
        const detail = await readProviderFailure(error, 'Failed to call the property provider.');
        console.error('🏨 Booking.com API error:', detail);
        toast({
          title: 'Property provider error',
          description: detail,
          variant: 'destructive',
        });
        return { data: null, error: detail, loading: false };
      }

      // Handle API-level errors sent back with 2xx status (like QUOTA_EXCEEDED)
      if (data && (data as any).error) {
        const apiError = (data as any).error as string;
        const apiMessage = (data as any).message as string | undefined;

        if (apiError === 'QUOTA_EXCEEDED') {
          toast({
            title: 'API Quota Exceeded',
            description: apiMessage || 'The hotel search API has reached its limit. Please try again later or contact support.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'API Error',
            description: apiMessage || apiError || 'Failed to call Booking.com API',
            variant: 'destructive',
          });
        }

        return { data: null, error: apiError, loading: false };
      }

      console.log('🏨 Booking.com API success:', data);
      return { data, error: null, loading: false };

    } catch (err: any) {
      console.error('🏨 Booking.com API hook error:', err);
      const errorMessage = err.message || 'Failed to call Booking.com API';
      toast({
        title: "API Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { data: null, error: errorMessage, loading: false };
    } finally {
      setLoading(false);
    }
  };

  // Search for car rentals
  const searchCarRentals = async (params: {
    pick_up_latitude: number;
    pick_up_longitude: number;
    drop_off_latitude: number;
    drop_off_longitude: number;
    pick_up_time: string;
    drop_off_time: string;
    driver_age: number;
    currency_code?: string;
    location?: string;
  }) => {
    return callBookingAPI({
      endpoint: 'https://booking-com15.p.rapidapi.com/api/v1/cars/searchCarRentals',
      params: {
        pick_up_latitude: params.pick_up_latitude.toString(),
        pick_up_longitude: params.pick_up_longitude.toString(),
        drop_off_latitude: params.drop_off_latitude.toString(),
        drop_off_longitude: params.drop_off_longitude.toString(),
        pick_up_time: params.pick_up_time,
        drop_off_time: params.drop_off_time,
        driver_age: params.driver_age.toString(),
        currency_code: params.currency_code || 'USD',
        location: params.location || 'US'
      }
    });
  };

  // Search for hotels
  const searchHotels = async (params: {
    dest_id: string;
    search_type: string;
    arrival_date: string;
    departure_date: string;
    adults?: number;
    children?: number;
    room_qty?: number;
    currency_code?: string;
  }) => {
    return callBookingAPI({
      endpoint: 'https://booking-com15.p.rapidapi.com/api/v1/hotels/searchHotels',
      params: {
        dest_id: params.dest_id,
        search_type: params.search_type,
        arrival_date: params.arrival_date,
        departure_date: params.departure_date,
        adults: (params.adults || 2).toString(),
        // booking-com15 expects an explicit zero when no children are present.
        children_age: params.children && params.children > 0
          ? Array.from({ length: params.children }, () => '10').join(',')
          : '0',
        room_qty: (params.room_qty || 1).toString(),
        currency_code: params.currency_code || 'USD',
        languagecode: 'en-us',
        sort_by: 'popularity',
        page_number: '1',
      }
    });
  };

  // Get hotel details
  const getHotelDetails = async (hotelId: string, params: {
    arrival_date: string;
    departure_date: string;
    adults?: number;
    children_age?: string;
    room_qty?: number;
    currency_code?: string;
  }) => {
    return callBookingAPI({
      endpoint: 'https://booking-com15.p.rapidapi.com/api/v1/hotels/getRoomListWithAvailability',
      params: {
        hotel_id: hotelId,
        arrival_date: params.arrival_date,
        departure_date: params.departure_date,
        adults: String(params.adults || 2),
        ...(params.children_age ? { children_age: params.children_age } : {}),
        room_qty: String(params.room_qty || 1),
        currency_code: params.currency_code || 'USD',
      }
    });
  };

  // Search destinations (cached per session to conserve the provider quota:
  // repeating the same city lookup must not spend another provider request).
  const searchDestinations = async (query: string) => {
    const normalizedQuery = query.trim();
    const cacheKey = `taai:dest:v2:${normalizedQuery.toLowerCase()}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch {
      // Ignore unavailable/corrupt session storage and fall through to a live lookup.
    }
    const result = await callBookingAPI({
      endpoint: 'https://booking-com15.p.rapidapi.com/api/v1/hotels/searchDestination',
      params: {
        query: normalizedQuery
      }
    });
    try {
      // Never retain a provider failure or empty response as a successful city.
      if (!result.error && result.data) sessionStorage.setItem(cacheKey, JSON.stringify(result));
    } catch {
      // Caching is best-effort only.
    }
    return result;
  };


  return {
    callBookingAPI,
    searchCarRentals,
    searchHotels,
    getHotelDetails,
    searchDestinations,
    loading
  };
};
