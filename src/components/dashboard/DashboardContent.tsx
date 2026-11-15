import { useMemo } from "react";
import { HeroSection } from "@/components/dashboard/HeroSection";
import { StatsSection } from "@/components/dashboard/StatsSection";
import { TripsSection } from "@/components/dashboard/TripsSection";
import { TripsFilter } from "@/components/dashboard/TripsFilter";
import { TravelHub } from "@/components/dashboard/sections/TravelHub";
import { SocialCta } from "@/components/dashboard/sections/SocialCta";
import { PendingInvitationsCard } from "@/components/itinerary/PendingInvitationsCard";
import { useDashboard } from "@/hooks/useDashboard";
import { useTravelAnalytics } from "@/hooks/useTravelAnalytics";
import { localDateOnlyFromDate } from "@/lib/date-time";
import { partitionTrips } from "@/lib/dashboard/trip-phase";

export const DashboardContent = () => {
  const {
    activeItineraries,
    loading,
    fullUserStats,
    visitedCountries,
    sortBy,
    dateFrom,
    dateTo,
    handleClearFilters,
    handleSortChange,
    handleDateFromChange,
    handleDateToChange,
  } = useDashboard();
  const analytics = useTravelAnalytics(activeItineraries);
  const today = localDateOnlyFromDate();
  const phases = useMemo(() => partitionTrips(activeItineraries, today), [activeItineraries, today]);

  return (
    <div className="chrome-inset mx-auto max-w-7xl px-4 py-8 font-body sm:px-6 sm:py-12 lg:px-8 md:pb-12">
      <div className="mb-8 space-y-4">
        <SocialCta />
        <TravelHub counts={{ active: phases.active.length, upcoming: phases.upcoming.length, completed: phases.completed.length }} />
        <HeroSection activeItineraries={activeItineraries} fullUserStats={fullUserStats} />
      </div>

      <div className="mb-8">
        <PendingInvitationsCard />
      </div>

      <StatsSection
        userStats={fullUserStats}
        visitedCountries={visitedCountries}
        phaseCounts={{
          active: phases.active.length,
          upcoming: phases.upcoming.length,
          planning: phases.planning.length,
          completed: phases.completed.length,
        }}
        analytics={analytics}
      />

      <TripsFilter
        sortBy={sortBy}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onSortChange={handleSortChange}
        onDateFromChange={handleDateFromChange}
        onDateToChange={handleDateToChange}
        onClearFilters={handleClearFilters}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-4">
          <TripsSection activeItineraries={activeItineraries} loading={loading} />
        </div>
      </div>
    </div>
  );
};
