import { Badge } from "@/components/ui/badge";
import { format, differenceInDays } from "date-fns";
import { TravelHub } from "./sections/TravelHub";
import { useDashboardSections } from "@/hooks/useDashboardSections";
import { Award, Calendar } from "lucide-react";

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
      {/* Quick Actions Bar */}
      <TravelHub activeItineraries={activeItineraries} onBrowseTrips={onBrowseTrips} />

      {/* Compact 3-Column Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Left: Next Travel Date */}
        <div className="p-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-foreground/60 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-foreground/60 mb-0.5">Next Travel</p>
              {nextTrip ? (
                <>
                  <p className="text-lg font-bold text-foreground leading-tight">
                    {format(new Date(nextTrip.itin_date_start), 'MMM d')}
                  </p>
                  <p className="text-xs text-foreground/60 truncate">{nextTrip.itin_name}</p>
                  <Badge className="bg-accent text-foreground border-border text-[10px] mt-1 px-1.5 py-0">
                    {daysAway === 1 ? '1 day away' : `${daysAway} days away`}
                  </Badge>
                </>
              ) : (
                <>
                  <p className="text-lg font-bold text-foreground leading-tight">Plan One!</p>
                  <p className="text-xs text-foreground/60">No upcoming trips</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Center: Lifetime Total Spent */}
        <div className="p-4">
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-xl font-bold text-foreground leading-tight">
              ${fullUserStats.lifetimeTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-foreground/60">
              Lifetime Total Spent ({fullUserStats.totalTrips} trips)
            </p>
          </div>
        </div>

        {/* Right: Traveler Badge */}
        <div className="p-4">
          <div className="flex flex-col items-center gap-1 text-center">
            <Award className="h-5 w-5 text-foreground/60 shrink-0" />
            <div>
              <p className="text-xs text-foreground/60 mb-0.5">Traveler Level</p>
              <p className="text-lg font-bold text-foreground leading-tight">{fullUserStats.travelerLevel}</p>
              <p className="text-xs text-foreground/60">
                {fullUserStats.countriesVisited} countries · {fullUserStats.flightsThisYear} flights
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
