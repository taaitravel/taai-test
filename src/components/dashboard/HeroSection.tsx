import { Badge } from "@/components/ui/badge";
import { differenceInDateOnlyDays, formatDateOnly, formatDateOnlyRange, localDateOnlyFromDate } from '@/lib/date-time';
import { partitionTrips } from '@/lib/dashboard/trip-phase';

interface HeroSectionProps {
  activeItineraries?: Array<{ itin_name?: string | null; itin_date_start?: string | null; itin_date_end?: string | null }>;
  fullUserStats: {
    countriesVisited: number;
    travelerLevel: string;
  };
}

export const HeroSection = ({ activeItineraries = [], fullUserStats }: HeroSectionProps) => {
  const today = localDateOnlyFromDate();
  const phases = partitionTrips(activeItineraries, today);
  const current = phases.active[0] ?? null;
  const nextTrip = phases.upcoming[0] ?? null;
  const daysAway = nextTrip ? differenceInDateOnlyDays(today, nextTrip.itin_date_start) : null;

  return (
    <div className="bright-card grid min-w-0 grid-cols-1 divide-y divide-border overflow-hidden sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      <div className="min-w-0 p-3 sm:p-5">
        <p className="font-mono-label mb-1.5">{current ? 'In progress' : 'Next travel'}</p>
        {current ? (
          <>
            <p className="font-display text-base font-semibold leading-tight text-foreground sm:text-2xl">
              {formatDateOnlyRange(current.itin_date_start, current.itin_date_end, 'MMM d', 'MMM d') ?? 'In progress'}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground sm:text-sm">{current.itin_name}</p>
            <Badge className="mt-2 hidden border-border bg-secondary px-2 py-0 text-[10px] text-foreground sm:inline-flex">
              In progress
            </Badge>
          </>
        ) : nextTrip ? (
          <>
            <p className="font-display text-base font-semibold leading-tight bright-grad-text sm:text-2xl">
              {formatDateOnly(nextTrip.itin_date_start, 'MMM d')}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground sm:text-sm">{nextTrip.itin_name}</p>
            <Badge className="mt-2 hidden border-border bg-secondary px-2 py-0 text-[10px] text-foreground sm:inline-flex">
              {daysAway === 1 ? '1 day away' : `${daysAway} days away`}
            </Badge>
          </>
        ) : (
          <>
            <p className="font-display text-base font-semibold leading-tight text-foreground sm:text-2xl">Plan one</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground sm:text-sm">No upcoming trips</p>
          </>
        )}
      </div>

      <div className="min-w-0 p-3 sm:p-5">
        <div className="flex min-w-0 flex-col items-start gap-1 sm:items-center sm:text-center">
          <p className="font-mono-label">Trip timing</p>
          <p className="font-display text-base font-semibold leading-tight text-foreground sm:text-2xl">
            {phases.active.length} now · {phases.upcoming.length} upcoming
          </p>
          <p className="text-[11px] text-muted-foreground sm:text-sm">{phases.completed.length} past · {phases.planning.length} undated</p>
        </div>
      </div>

      <div className="min-w-0 p-3 sm:p-5">
        <div className="flex min-w-0 flex-col items-start gap-1 sm:items-center sm:text-center">
          <p className="font-mono-label">Traveler level</p>
          <p className="max-w-full truncate font-display text-base font-semibold leading-tight text-foreground sm:text-2xl">{fullUserStats.travelerLevel}</p>
          <p className="text-[11px] text-muted-foreground sm:text-sm">
            {fullUserStats.countriesVisited} profile countries · rank is not a verified flight count
          </p>
        </div>
      </div>
    </div>
  );
};
