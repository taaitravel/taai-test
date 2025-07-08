import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ItineraryData } from "@/types/itinerary";

export const useItineraryData = (itineraryId: string | null) => {
  const [itineraryData, setItineraryData] = useState<ItineraryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [budgetRefreshTrigger, setBudgetRefreshTrigger] = useState(0);
  const { toast } = useToast();

  const refreshBudgetData = () => {
    setBudgetRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    const fetchItinerary = async () => {
      try {
        let query = supabase.from('itinerary').select('*');
        
        if (itineraryId) {
          query = query.eq('id', parseInt(itineraryId));
        } else {
          query = query.limit(1);
        }
        
        const { data, error } = await query.single();

        if (error) throw error;

        const transformedData: ItineraryData = {
          ...data,
          itin_locations: data.itin_locations as string[],
          itin_map_locations: data.itin_map_locations as Array<{ city: string; lat: number; lng: number }>,
          attendees: data.attendees as Array<{ id: number; name: string; email: string; avatar: string; status: string }>,
          flights: data.flights as Array<{ airline: string; flight_number: string; departure: string; arrival: string; from: string; to: string; cost: number }>,
          hotels: data.hotels as Array<{ name: string; city: string; check_in: string; check_out: string; nights: number; cost: number; rating: number }>,
          activities: data.activities as Array<{ name: string; city: string; date: string; cost: number; duration: string }>,
          reservations: data.reservations as Array<{ type: string; name: string; city: string; date: string; time: string; party_size: number }>,
        };

        setItineraryData(transformedData);
        refreshBudgetData();
      } catch (error) {
        console.error('Error fetching itinerary:', error);
        toast({
          title: "Error",
          description: "Failed to load itinerary data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchItinerary();
  }, [itineraryId, toast]);

  return {
    itineraryData,
    loading,
    budgetRefreshTrigger,
    refreshBudgetData
  };
};