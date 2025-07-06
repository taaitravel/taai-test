import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getTravelerLevel } from "@/lib/travelerLevel";
import { toast } from "sonner";
import { formatDateRange, getItineraryStatus } from "@/lib/dashboardUtils";

export const useDashboardData = () => {
  const { user } = useAuth();
  const [activeItineraries, setActiveItineraries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchUserItineraries();
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserItineraries = async () => {
    try {
      const { data, error } = await supabase
        .from('itinerary')
        .select('*')
        .eq('userid', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match the expected format
      const transformedItineraries = data.map(item => ({
        id: item.id,
        name: item.itin_name || 'Untitled Trip',
        dates: formatDateRange(item.itin_date_start, item.itin_date_end),
        locations: Array.isArray(item.itin_locations) ? item.itin_locations : [],
        budget: item.budget || 0,
        spent: item.spending || 0,
        people: Array.isArray(item.attendees) ? item.attendees.length : 1,
        status: getItineraryStatus(item.itin_date_start, item.itin_date_end)
      }));

      // Add sample trips if no data exists
      const sampleTrips = [
        {
          id: 'sample-singapore',
          name: 'Southeast Asia Adventure',
          dates: 'Dec 15, 2024 - Dec 28, 2024',
          locations: ['Singapore', 'Bangkok', 'Phuket'],
          budget: 4500,
          spent: 1200,
          people: 2,
          status: 'upcoming',
          image: '🌴'
        },
        {
          id: 'sample-singapore-thailand',
          name: 'Singapore & Thailand Explorer',
          dates: 'Feb 8, 2025 - Feb 18, 2025',
          locations: ['Singapore', 'Bangkok', 'Chiang Mai'],
          budget: 3800,
          spent: 950,
          people: 2,
          status: 'upcoming',
          image: '🏯'
        },
        {
          id: 'sample-europe',
          name: 'European Winter Escape',
          dates: 'Jan 10, 2025 - Jan 20, 2025',
          locations: ['Paris', 'Amsterdam', 'Berlin'],
          budget: 3200,
          spent: 800,
          people: 1,
          status: 'planning',
          image: '❄️'
        },
        {
          id: 'sample-completed',
          name: 'Tokyo Summer Trip',
          dates: 'Jun 5, 2024 - Jun 15, 2024',
          locations: ['Tokyo', 'Kyoto', 'Osaka'],
          budget: 2800,
          spent: 3200,
          people: 2,
          status: 'completed',
          image: '🍜'
        }
      ];

      const allTrips = transformedItineraries.length > 0 ? transformedItineraries : sampleTrips;
      setActiveItineraries(allTrips);
    } catch (error) {
      console.error('Error fetching itineraries:', error);
      toast.error('Failed to load your trips');
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