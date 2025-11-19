import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

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
        console.error('🏨 Booking.com API error:', error);
        toast({
          title: "API Error",
          description: error.message || "Failed to call Booking.com API",
          variant: "destructive",
        });
        return { data: null, error: error.message, loading: false };
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
        children: (params.children || 0).toString(),
        room_qty: (params.room_qty || 1).toString(),
        currency_code: params.currency_code || 'USD'
      }
    });
  };

  // Get hotel details
  const getHotelDetails = async (hotelId: string, arrival_date: string, departure_date: string) => {
    return callBookingAPI({
      endpoint: 'https://booking-com15.p.rapidapi.com/api/v1/hotels/getHotelDetails',
      params: {
        hotel_id: hotelId,
        arrival_date,
        departure_date
      }
    });
  };

  // Search destinations
  const searchDestinations = async (query: string) => {
    return callBookingAPI({
      endpoint: 'https://booking-com15.p.rapidapi.com/api/v1/hotels/searchDestination',
      params: {
        query
      }
    });
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