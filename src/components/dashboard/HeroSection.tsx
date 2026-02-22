import { Badge } from "@/components/ui/badge";
import { format, differenceInDays } from "date-fns";
import { TravelHub } from "./sections/TravelHub";
import { useDashboardSections } from "@/hooks/useDashboardSections";

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
    <div className="mb-6 space-y-3">
      <TravelHub activeItineraries={activeItineraries} onBrowseTrips={onBrowseTrips} />

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* Left: Next Travel Date */}
        <div className="p-2 sm:p-4">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs text-foreground/60 mb-0.5">Next Travel</p>
            {nextTrip ? (
              <>
                <p className="text-sm sm:text-lg font-bold text-foreground leading-tight">
                  {format(new Date(nextTrip.itin_date_start), 'MMM d')}
                </p>
                <p className="text-[10px] sm:text-xs text-foreground/60 truncate">{nextTrip.itin_name}</p>
                <Badge className="bg-accent text-foreground border-border text-[10px] mt-1 px-1.5 py-0 hidden sm:inline-flex">
                  {daysAway === 1 ? '1 day away' : `${daysAway} days away`}
                </Badge>
              </>
            ) : (
              <>
                <p className="text-sm sm:text-lg font-bold text-foreground leading-tight">Plan One!</p>
                <p className="text-[10px] sm:text-xs text-foreground/60">No upcoming trips</p>
              </>
            )}
          </div>
        </div>

        {/* Center: Lifetime Total Spent */}
        <div className="p-2 sm:p-4">
          <div className="flex flex-col items-center gap-0.5 sm:gap-1 text-center">
            <p className="text-sm sm:text-xl font-bold text-foreground leading-tight">
              ${fullUserStats.lifetimeTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
            <p className="text-[10px] sm:text-xs text-foreground/60">Lifetime Spent</p>
            <p className="text-[10px] sm:text-xs text-foreground/60">({fullUserStats.totalTrips} trips)</p>
          </div>
        </div>

        {/* Right: Traveler Level */}
        <div className="p-2 sm:p-4">
          <div className="flex flex-col items-center gap-0.5 sm:gap-1 text-center">
            <p className="text-sm sm:text-lg font-bold text-foreground leading-tight">{fullUserStats.travelerLevel}</p>
            <p className="text-[10px] sm:text-xs text-foreground/60">Traveler Level</p>
            <p className="text-[10px] sm:text-xs text-foreground/60">
              {fullUserStats.countriesVisited} countries · {fullUserStats.flightsThisYear} flights
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
