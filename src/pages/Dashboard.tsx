
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getTravelerLevel } from "@/lib/travelerLevel";
import { HeroSection } from "@/components/dashboard/HeroSection";
import { StatsSection } from "@/components/dashboard/StatsSection";
import { TripsSection } from "@/components/dashboard/TripsSection";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { TripBrowser } from "@/components/dashboard/TripBrowser";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useTripBrowser } from "@/hooks/useTripBrowser";
import { calculateUserStats } from "@/lib/dashboardUtils";

const Dashboard = () => {
  const navigate = useNavigate();
  const { activeItineraries, loading, userProfile } = useDashboardData();
  const { 
    showTripBrowser, 
    currentTripIndex, 
    setCurrentTripIndex, 
    openTripBrowser, 
    closeTripBrowser 
  } = useTripBrowser();

  const { visitedCountries, ...userStats } = calculateUserStats(activeItineraries, userProfile);
  const fullUserStats = {
    ...userStats,
    travelerLevel: getTravelerLevel(visitedCountries.length, userStats.flightsThisYear)
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
                {fullUserStats.travelerLevel}
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
        <HeroSection userProfile={userProfile} activeItineraries={activeItineraries} />

        {/* Enhanced Stats Cards with Charts */}
        <StatsSection userStats={fullUserStats} visitedCountries={visitedCountries} />

        {/* Trips Section - 25%, 25%, 50% Layout */}
        <div className="grid grid-cols-4 gap-6">
          <TripsSection 
            activeItineraries={activeItineraries} 
            loading={loading} 
            onTripClick={openTripBrowser}
          />
          <QuickActions 
            activeItineraries={activeItineraries}
            onBrowseTrips={openTripBrowser}
          />
        </div>

        {/* Trip Browser Modal */}
        <TripBrowser 
          isOpen={showTripBrowser}
          onClose={closeTripBrowser}
          activeItineraries={activeItineraries}
          currentTripIndex={currentTripIndex}
          onTripIndexChange={setCurrentTripIndex}
        />
      </div>
    </div>
  );
};

export default Dashboard;
