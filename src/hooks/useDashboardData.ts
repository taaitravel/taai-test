import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type SortOption = 'start_date' | 'created_at' | 'end_date';

interface FilterOptions {
  sortBy: SortOption;
  dateFrom?: string;
  dateTo?: string;
}

export const useDashboardData = (filterOptions?: FilterOptions) => {
  const { user } = useAuth();
  const [activeItineraries, setActiveItineraries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const lastNotificationTime = useRef<number>(0);

  useEffect(() => {
    if (user) {
      fetchUserItineraries();
      fetchUserProfile();
    }
  }, [user, filterOptions]);

  const fetchUserItineraries = async () => {
    try {
      let query = supabase
        .from('itinerary')
        .select('*')
        .eq('userid', user?.id);

      // Apply date filtering if specified
      if (filterOptions?.dateFrom) {
        query = query.gte('itin_date_start', filterOptions.dateFrom);
      }
      if (filterOptions?.dateTo) {
        query = query.lte('itin_date_end', filterOptions.dateTo);
      }

      // Apply sorting - default to start_date
      const sortBy = filterOptions?.sortBy || 'start_date';
      switch (sortBy) {
        case 'start_date':
          query = query.order('itin_date_start', { ascending: false, nullsFirst: false });
          break;
        case 'end_date':
          query = query.order('itin_date_end', { ascending: false, nullsFirst: false });
          break;
        case 'created_at':
          query = query.order('created_at', { ascending: false });
          break;
      }

      const { data, error } = await query;

      if (error) throw error;

      // Return full itinerary data with original field names
      const transformedItineraries = data.map(item => ({
        id: item.id,
        itin_id: item.itin_id,
        itin_name: item.itin_name || 'Untitled Trip',
        itin_desc: item.itin_desc,
        itin_date_start: item.itin_date_start,
        itin_date_end: item.itin_date_end,
        itin_locations: Array.isArray(item.itin_locations) ? item.itin_locations : [],
        itin_map_locations: Array.isArray(item.itin_map_locations) ? item.itin_map_locations : [],
        budget: item.budget || 0,
        spending: item.spending || 0,
        budget_rate: item.budget_rate,
        b_efficiency_rate: item.b_efficiency_rate,
        user_type: item.user_type,
        attendees: Array.isArray(item.attendees) ? item.attendees : [],
        flights: Array.isArray(item.flights) ? item.flights : [],
        hotels: Array.isArray(item.hotels) ? item.hotels : [],
        activities: Array.isArray(item.activities) ? item.activities : [],
        reservations: Array.isArray(item.reservations) ? item.reservations : [],
        expedia_data: item.expedia_data,
        images: item.images,
        created_at: item.created_at,
        userid: item.userid
      }));

      setActiveItineraries(transformedItineraries);
    } catch (error) {
      console.error('Error fetching itineraries:', error);
      const now = Date.now();
      if (now - lastNotificationTime.current > 120000) {
        toast.error('Failed to load your trips');
        lastNotificationTime.current = now;
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('userid', user?.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  return {
    activeItineraries,
    loading,
    userProfile,
    refetchData: () => {
      fetchUserItineraries();
      fetchUserProfile();
    }
  };
};