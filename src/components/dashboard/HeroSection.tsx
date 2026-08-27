import { Badge } from "@/components/ui/badge";
import { differenceInDays } from "date-fns";
import { TravelHub } from "./sections/TravelHub";
import { useDashboardSections } from "@/hooks/useDashboardSections";
import { formatDateOnly } from '@/lib/date-time';

interface HeroSectionProps {
  userProfile: any;
  activeItineraries?: any[];
  fullUserStats: {
    totalTrips: number;
    countriesVisited: number;
    citiesVisited: number;
    totalSpent: number;
    projectedSpend: number;
    lifetimeTotal: number;
    flightsThisYear: number;
    travelerLevel: string;
  };
  onBrowseTrips: () => void;
}

export const HeroSection = ({ userProfile, activeItineraries = [], fullUserStats, onBrowseTrips }: HeroSectionProps) => {
  const { nextTrip } = useDashboardSections(activeItineraries);
  const daysAway = nextTrip ? differenceInDays(new Date(nextTrip.itin_date_start), new Date()) : null;

  return (
    <div className="mb-8 space-y-4">
      <TravelHub activeItineraries={activeItineraries} onBrowseTrips={onBrowseTrips} />

      <div className="bright-card grid grid-cols-3 divide-x divide-border overflow-hidden">
        {/* Left: Next Travel Date */}
        <div className="p-3 sm:p-5">
          <div className="min-w-0">
            <p className="font-mono-label mb-1.5">Next Travel</p>
            {nextTrip ? (
              <>
                <p className="font-display text-base sm:text-2xl font-semibold bright-grad-text leading-tight">
                  {formatDateOnly(nextTrip.itin_date_start, 'MMM d')}
                </p>
                <p className="text-[11px] sm:text-sm text-muted-foreground truncate mt-0.5">{nextTrip.itin_name}</p>
                <Badge className="bg-secondary text-foreground border-border text-[10px] mt-2 px-2 py-0 hidden sm:inline-flex">
                  {daysAway === 1 ? '1 day away' : `${daysAway} days away`}
                </Badge>
              </>
            ) : (
              <>
                <p className="font-display text-base sm:text-2xl font-semibold text-foreground leading-tight">Plan One!</p>
                <p className="text-[11px] sm:text-sm text-muted-foreground mt-0.5">No upcoming trips</p>
              </>
            )}
          </div>
        </div>

        {/* Center: Lifetime Total Spent */}
        <div className="p-3 sm:p-5">
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="font-mono-label">Lifetime Spent</p>
            <p className="font-display text-base sm:text-2xl font-semibold bright-grad-text leading-tight">
              ${fullUserStats.lifetimeTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
            <p className="text-[11px] sm:text-sm text-muted-foreground">{fullUserStats.totalTrips} trips</p>
          </div>
        </div>

        {/* Right: Traveler Level */}
        <div className="p-3 sm:p-5">
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="font-mono-label">Traveler Level</p>
            <p className="font-display text-base sm:text-2xl font-semibold text-foreground leading-tight">{fullUserStats.travelerLevel}</p>
            <p className="text-[11px] sm:text-sm text-muted-foreground">
              {fullUserStats.countriesVisited} countries · {fullUserStats.flightsThisYear} flights
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

