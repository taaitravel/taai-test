import { TravelMetrics } from "./sections/TravelMetrics";
import type { TravelAnalyticsState } from "@/hooks/useTravelAnalytics";

interface StatsSectionProps {
  visitedCountries: string[];
  analytics: TravelAnalyticsState;
}

export const StatsSection = ({ visitedCountries, analytics }: StatsSectionProps) => {
  return (
    <div className="mb-8">
      <TravelMetrics analytics={analytics} profileCountries={visitedCountries.length} />
    </div>
  );
};
