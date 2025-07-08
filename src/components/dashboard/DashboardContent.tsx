import { HeroSection } from "@/components/dashboard/HeroSection";
import { StatsSection } from "@/components/dashboard/StatsSection";
import { TripsSection } from "@/components/dashboard/TripsSection";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { TripBrowser } from "@/components/dashboard/TripBrowser";
import { TripsFilter } from "@/components/dashboard/TripsFilter";
import { useDashboard } from "@/hooks/useDashboard";

export const DashboardContent = () => {
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

      {/* Enhanced Stats Cards with Charts */}
      <StatsSection userStats={fullUserStats} visitedCountries={visitedCountries} />

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