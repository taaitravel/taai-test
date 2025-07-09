import { TravelMetrics } from "./sections/TravelMetrics";

interface StatsSectionProps {
  userStats: {
    totalTrips: number;
    countriesVisited: number;
    citiesVisited: number;
    totalSpent: number;
    flightsThisYear: number;
    travelerLevel: string;
  };
  visitedCountries: string[];
}

export const StatsSection = ({ userStats, visitedCountries }: StatsSectionProps) => {
  return (
    <div className="mb-8">
      <TravelMetrics userStats={userStats} visitedCountries={visitedCountries} />
    </div>
  );
};