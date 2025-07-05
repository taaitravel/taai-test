
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getTravelerLevel } from "@/lib/travelerLevel";
import { toast } from "sonner";
import { HeroSection } from "@/components/dashboard/HeroSection";
import { StatsSection } from "@/components/dashboard/StatsSection";
import { TripsSection } from "@/components/dashboard/TripsSection";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { TripBrowser } from "@/components/dashboard/TripBrowser";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeItineraries, setActiveItineraries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showTripBrowser, setShowTripBrowser] = useState(false);
  const [currentTripIndex, setCurrentTripIndex] = useState(0);

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

  const formatDateRange = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 'Dates TBD';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const formatOptions: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    };
    
    return `${start.toLocaleDateString('en-US', formatOptions)} - ${end.toLocaleDateString('en-US', formatOptions)}`;
  };

  const getItineraryStatus = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 'planning';
    
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (today < start) return 'upcoming';
    if (today >= start && today <= end) return 'active';
    return 'completed';
  };

  // Get visited countries from user profile
  const visitedCountries = Array.isArray(userProfile?.countries_visited) 
    ? userProfile.countries_visited as string[] 
    : [];

  // Calculate flights this year from user profile
  const flightsThisYear = userProfile?.flight_freq && typeof userProfile.flight_freq === 'object' 
    ? Object.values(userProfile.flight_freq).reduce((sum: number, flights: any) => sum + (Number(flights) || 0), 0)
    : 0;

  // Count unique cities from all itineraries
  const uniqueCities = new Set();
  activeItineraries.forEach(itinerary => {
    if (Array.isArray(itinerary.locations)) {
      itinerary.locations.forEach((location: string) => uniqueCities.add(location));
    }
  });

  const userStats = {
    totalTrips: activeItineraries.length,
    countriesVisited: visitedCountries.length,
    citiesVisited: uniqueCities.size,
    totalSpent: 45000,
    flightsThisYear: Number(flightsThisYear),
    travelerLevel: getTravelerLevel(visitedCountries.length, Number(flightsThisYear))
  };


  return (
    <div className="min-h-screen bg-[#171821]">
      {/* Navigation */}
      <nav className="bg-[#171821]/95 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
            </div>
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <img src="/lovable-uploads/1c94ff06-05c4-46fe-b015-481744bc6ce1.png" alt="TAAI Travel" className="h-[70px]" />
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-white/20 text-white border-white/30">
                {userStats.travelerLevel}
              </Badge>
              <Button 
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10 p-2 rounded-full"
                onClick={() => navigate('/profile-setup')}
              >
                <User className="h-5 w-5" />
              </Button>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={() => navigate('/create-itinerary')}
                  className="gold-gradient hover:opacity-90 text-[#171821] font-semibold"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  AI Trip
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/create-manual-itinerary')}
                  className="border-white/50 text-white hover:bg-white/10"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Manual
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <HeroSection userProfile={userProfile} />

        {/* Enhanced Stats Cards with Charts */}
        <StatsSection userStats={userStats} visitedCountries={visitedCountries} />

        {/* Trips Section - 25%, 25%, 50% Layout */}
        <div className="grid grid-cols-4 gap-6">
          <TripsSection 
            activeItineraries={activeItineraries} 
            loading={loading} 
            onTripClick={() => setShowTripBrowser(true)}
          />
          <QuickActions 
            activeItineraries={activeItineraries}
            onBrowseTrips={() => setShowTripBrowser(true)}
          />
        </div>

        {/* Trip Browser Modal */}
        <TripBrowser 
          isOpen={showTripBrowser}
          onClose={() => setShowTripBrowser(false)}
          activeItineraries={activeItineraries}
          currentTripIndex={currentTripIndex}
          onTripIndexChange={setCurrentTripIndex}
        />
      </div>
    </div>
  );
};

export default Dashboard;
