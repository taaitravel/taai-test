import { TravelMetrics } from "./sections/TravelMetrics";
import type { TravelAnalyticsState } from "@/hooks/useTravelAnalytics";

interface StatsSectionProps {
  userStats: {
    totalTrips: number;
    countriesVisited: number;
    citiesVisited: number;
    profileFlightFrequency: number;
    travelerLevel: string;
  };
  visitedCountries: string[];
  phaseCounts: {
    active: number;
    upcoming: number;
    planning: number;
    completed: number;
  };
  analytics: TravelAnalyticsState;
}

export const StatsSection = ({ userStats, visitedCountries, phaseCounts, analytics }: StatsSectionProps) => {
  return (
    <div className="mb-8">
      <TravelMetrics
        userStats={userStats}
        visitedCountries={visitedCountries}
        phaseCounts={phaseCounts}
        analytics={analytics}
      />
    </div>
  );
};
