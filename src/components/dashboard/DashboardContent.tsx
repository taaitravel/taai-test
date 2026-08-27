import { HeroSection } from "@/components/dashboard/HeroSection";
import { StatsSection } from "@/components/dashboard/StatsSection";
import { TripsSection } from "@/components/dashboard/TripsSection";
import { TripsFilter } from "@/components/dashboard/TripsFilter";
import { PendingInvitationsCard } from "@/components/itinerary/PendingInvitationsCard";
import { useDashboard } from "@/hooks/useDashboard";

export const DashboardContent = () => {
  const {
    activeItineraries,
    loading,
    userProfile,
    fullUserStats,
    visitedCountries,
    openTripBrowser,
    sortBy,
    dateFrom,
    dateTo,
    handleClearFilters,
    handleSortChange,
    handleDateFromChange,
    handleDateToChange,
  } = useDashboard();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-24 md:pb-12 font-body">
      {/* Hero Section with TravelHub + Stats Row */}
      <HeroSection
        userProfile={userProfile}
        activeItineraries={activeItineraries}
        fullUserStats={fullUserStats}
        onBrowseTrips={openTripBrowser}
      />

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

      {/* Trips Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-4">
          <TripsSection 
            activeItineraries={activeItineraries} 
            loading={loading} 
          />
        </div>
      </div>
    </div>
  );
};
