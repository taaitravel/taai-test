import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface ExpediaAPIParams {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params?: Record<string, string>;
  body?: any;
}

interface ExpediaAPIResponse<T = any> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export const useExpediaAPI = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const callExpediaAPI = async <T = any>({
    endpoint,
    method = 'GET',
    params = {},
    body = null
  }: ExpediaAPIParams): Promise<ExpediaAPIResponse<T>> => {
    setLoading(true);
    
    try {
      console.log('🏨 Calling Expedia API:', { endpoint, method, params });
      
      const { data, error } = await supabase.functions.invoke('expedia-rapid-api', {
        body: {
          endpoint,
          method,
          params,
          body
        }
      });

      if (error) {
        console.error('🏨 Expedia API error:', error);
        toast({
          title: "API Error",
          description: error.message || "Failed to call Expedia API",
          variant: "destructive",
        });
        return { data: null, error: error.message, loading: false };
      }

      console.log('🏨 Expedia API success:', data);
      return { data, error: null, loading: false };

    } catch (err: any) {
      console.error('🏨 Expedia API hook error:', err);
      const errorMessage = err.message || 'Failed to call Expedia API';
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

  // Test endpoint to verify API connection
  const testConnection = async () => {
    return callExpediaAPI({
      endpoint: 'https://expedia13.p.rapidapi.com/api/v1/test'
    });
  };

  // Search for hotels
  const searchHotels = async (params: {
    destination: string;
    checkin: string;
    checkout: string;
    adults?: number;
    children?: number;
    rooms?: number;
  }) => {
    return callExpediaAPI({
      endpoint: 'https://expedia13.p.rapidapi.com/api/v1/hotels/search',
      params: {
        destination: params.destination,
        checkin: params.checkin,
        checkout: params.checkout,
        adults: (params.adults || 2).toString(),
        children: (params.children || 0).toString(),
        rooms: (params.rooms || 1).toString()
      }
    });
  };

  // Search for flights
  const searchFlights = async (params: {
    origin: string;
    destination: string;
    departure_date: string;
    return_date?: string;
    adults?: number;
    children?: number;
    class?: string;
  }) => {
    return callExpediaAPI({
      endpoint: 'https://expedia13.p.rapidapi.com/api/v1/flights/search',
      params: {
        origin: params.origin,
        destination: params.destination,
        departure_date: params.departure_date,
        return_date: params.return_date || '',
        adults: (params.adults || 1).toString(),
        children: (params.children || 0).toString(),
        class: params.class || 'economy'
      }
    });
  };

  // Search for activities/attractions
  const searchActivities = async (params: {
    destination: string;
    category?: string;
    date?: string;
  }) => {
    return callExpediaAPI({
      endpoint: 'https://expedia13.p.rapidapi.com/api/v1/activities/search',
      params: {
        destination: params.destination,
        category: params.category || 'all',
        date: params.date || ''
      }
    });
  };

  // Get destination details and suggestions
  const getDestinations = async (query: string) => {
    return callExpediaAPI({
      endpoint: 'https://expedia13.p.rapidapi.com/api/v1/destinations/search',
      params: {
        query
      }
    });
  };

  // Get detailed information about a specific hotel
  const getHotelDetails = async (hotelId: string) => {
    return callExpediaAPI({
      endpoint: 'https://expedia13.p.rapidapi.com/api/v1/hotels/details',
      params: {
        hotel_id: hotelId
      }
    });
  };

  // Get flight details
  const getFlightDetails = async (flightId: string) => {
    return callExpediaAPI({
      endpoint: 'https://expedia13.p.rapidapi.com/api/v1/flights/details',
      params: {
        flight_id: flightId
      }
    });
  };

  return {
    callExpediaAPI,
    testConnection,
    searchHotels,
    searchFlights,
    searchActivities,
    getDestinations,
    getHotelDetails,
    getFlightDetails,
    loading
  };
};