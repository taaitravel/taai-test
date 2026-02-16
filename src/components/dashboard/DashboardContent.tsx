import { useNavigate } from "react-router-dom";
import { FolderOpen } from "lucide-react";
import { HeroSection } from "@/components/dashboard/HeroSection";
import { StatsSection } from "@/components/dashboard/StatsSection";
import { TripsSection } from "@/components/dashboard/TripsSection";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { TripBrowser } from "@/components/dashboard/TripBrowser";
import { TripsFilter } from "@/components/dashboard/TripsFilter";
import { PendingInvitationsCard } from "@/components/itinerary/PendingInvitationsCard";
import { useDashboard } from "@/hooks/useDashboard";
import { Button } from "@/components/ui/button";

export const DashboardContent = () => {
  const navigate = useNavigate();
  const {
    activeItineraries,
    loading,
    userProfile,
    fullUserStats,
    visitedCountries,
    showTripBrowser,
    currentTripIndex,
    setCurrentTripIndex,
    openTripBrowser,
    closeTripBrowser,
    sortBy,
    dateFrom,
    dateTo,
    handleClearFilters,
    handleSortChange,
    handleDateFromChange,
    handleDateToChange,
  } = useDashboard();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <HeroSection userProfile={userProfile} activeItineraries={activeItineraries} />

      {/* Pending Invitations */}
      <div className="mb-8">
        <PendingInvitationsCard />
      </div>

      {/* Enhanced Stats Cards with Charts */}
      <StatsSection userStats={fullUserStats} visitedCountries={visitedCountries} activeItineraries={activeItineraries} />

      {/* Trips Filter */}
      <TripsFilter
        sortBy={sortBy}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onSortChange={handleSortChange}
        onDateFromChange={handleDateFromChange}
        onDateToChange={handleDateToChange}
        onClearFilters={handleClearFilters}
      />

      {/* Trips Section - Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-4">
          <TripsSection 
            activeItineraries={activeItineraries} 
            loading={loading} 
            onTripClick={openTripBrowser}
          />
        </div>
        <div className="lg:col-span-4 mt-6 lg:mt-0">
          <QuickActions 
            activeItineraries={activeItineraries}
            onBrowseTrips={openTripBrowser}
          />
        </div>
      </div>

      {/* My Itineraries Button - below trips */}
      <div className="flex justify-center mt-8 mb-8">
        <Button
          onClick={() => navigate('/my-itineraries')}
          size="lg"
          className="gap-2 px-8"
        >
          <FolderOpen className="h-5 w-5" />
          My Itineraries
        </Button>
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
  );
};