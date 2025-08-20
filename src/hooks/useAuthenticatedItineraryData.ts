import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ItineraryData } from "@/types/itinerary";
import { useMapLocationSync } from "./useMapLocationSync";

export const useAuthenticatedItineraryData = (itineraryId: string | null) => {
  const [itineraryData, setItineraryData] = useState<ItineraryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [budgetRefreshTrigger, setBudgetRefreshTrigger] = useState(0);
  const [mapRefreshTrigger, setMapRefreshTrigger] = useState(0);
  const { toast } = useToast();
  const { syncMapLocations, isUpdating } = useMapLocationSync(itineraryId);

  const refreshBudgetData = () => {
    setBudgetRefreshTrigger(prev => prev + 1);
  };

  const refreshMapData = () => {
    setMapRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    const fetchAuthenticatedItinerary = async () => {
      try {
        // Check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          throw new Error('User not authenticated');
        }

        let query = supabase
          .from('itinerary')
          .select('*')
          .eq('userid', user.id); // Ensure user can only access their own itineraries
        
        if (itineraryId) {
          query = query.eq('id', parseInt(itineraryId));
        } else {
          query = query.limit(1);
        }
        
        const { data, error } = await query.single();

        if (error) throw error;

        // Transform and enhance data with Expedia integration
        const transformedData: ItineraryData = {
          ...data,
          itin_locations: data.itin_locations as string[],
          itin_map_locations: data.itin_map_locations as Array<{ city: string; lat: number; lng: number }>,
          attendees: data.attendees as Array<{ id: number; name: string; email: string; avatar: string; status: string }>,
          flights: (data.flights as Array<any>)?.map(flight => ({
            ...flight,
            images: flight.images || [],
            booking_status: flight.booking_status || 'pending',
            expedia_property_id: flight.expedia_property_id,
            location: flight.location || flight.to,
            rating: flight.rating || 4.0
          })) || [],
          hotels: (data.hotels as Array<any>)?.map(hotel => ({
            ...hotel,
            images: hotel.images || [],
            booking_status: hotel.booking_status || 'pending',
            expedia_property_id: hotel.expedia_property_id,
            location: hotel.location || hotel.city,
            rating: hotel.rating || 4.0,
            price: hotel.price || hotel.cost
          })) || [],
          activities: (data.activities as Array<any>)?.map(activity => ({
            ...activity,
            images: activity.images || [],
            booking_status: activity.booking_status || 'pending',
            location: activity.location || activity.city,
            rating: activity.rating || 4.0,
            price: activity.price || activity.cost
          })) || [],
          reservations: (data.reservations as Array<any>)?.map(reservation => ({
            ...reservation,
            images: reservation.images || [],
            booking_status: reservation.booking_status || 'pending',
            location: reservation.location || reservation.city,
            cuisine: reservation.cuisine || 'International'
          })) || [],
          expedia_data: data.expedia_data || {}
        };

        console.log('🔐 useAuthenticatedItineraryData - User authenticated:', user.id);
        console.log('📊 useAuthenticatedItineraryData - Enhanced data:', transformedData);
        console.log('🏨 useAuthenticatedItineraryData - Hotels with images:', transformedData.hotels);
        console.log('🎯 useAuthenticatedItineraryData - Activities with images:', transformedData.activities);

        setItineraryData(transformedData);
        refreshBudgetData();
      } catch (error) {
        console.error('Error fetching authenticated itinerary:', error);
        toast({
          title: "Authentication Error",
          description: "Please log in to access your itinerary data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAuthenticatedItinerary();
  }, [itineraryId, toast, mapRefreshTrigger]);

  return {
    itineraryData,
    loading,
    budgetRefreshTrigger,
    refreshBudgetData,
    refreshMapData,
    syncMapLocations,
    isUpdating
  };
};