import { useMemo } from "react";
import { Calendar, Clock } from "lucide-react";
import { StackSection } from "@/components/itinerary-stacks/StackSection";
import { localDateOnlyFromDate } from "@/lib/date-time";
import { partitionTrips, type DatedTrip } from "@/lib/dashboard/trip-phase";
import type { ItineraryData } from "@/types/itinerary";

interface TripsSectionProps {
  activeItineraries: Array<DatedTrip & { id: number; itin_name?: string | null; itin_locations?: string[] }>;
  loading: boolean;
}

export const TripsSection = ({ activeItineraries, loading }: TripsSectionProps) => {
  const today = localDateOnlyFromDate();
  const phases = useMemo(
    () => partitionTrips(activeItineraries, today),
    [activeItineraries, today],
  );
  const nowAndUpcoming = [...phases.active, ...phases.upcoming, ...phases.planning];

  return (
    <div className="col-span-2">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="bright-card p-4 sm:p-6">
          <StackSection
            title="Now & upcoming"
            icon={<Calendar className="h-5 w-5" />}
            items={nowAndUpcoming as ItineraryData[]}
            loading={loading}
            emptyIcon={<Calendar className="h-8 w-8 mx-auto opacity-50" />}
            emptyMessage="No trips in progress or ahead"
          />
        </div>
        <div className="bright-card p-4 sm:p-6">
          <StackSection
            title="Past trips"
            icon={<Clock className="h-5 w-5" />}
            items={phases.completed as ItineraryData[]}
            loading={loading}
            emptyIcon={<Clock className="h-8 w-8 mx-auto opacity-50" />}
            emptyMessage="No past trips yet"
          />
        </div>
      </div>
    </div>
  );
};
