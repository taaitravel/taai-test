import { TravelMetrics } from "./sections/TravelMetrics";

interface StatsSectionProps {
  userStats: {
    totalTrips: number;
    countriesVisited: number;
    citiesVisited: number;
    totalSpent: number;
    projectedSpend: number;
    flightsThisYear: number;
    travelerLevel: string;
  };
  visitedCountries: string[];
  activeItineraries: any[];
}

export const StatsSection = ({ userStats, visitedCountries, activeItineraries }: StatsSectionProps) => {
  return (
    <div className="mb-8">
      <TravelMetrics userStats={userStats} visitedCountries={visitedCountries} activeItineraries={activeItineraries} />
    </div>
  );
};