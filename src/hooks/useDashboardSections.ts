import { useMemo } from "react";
import { localDateOnlyFromDate } from "@/lib/date-time";
import { partitionTrips, type DatedTrip } from "@/lib/dashboard/trip-phase";

export const useDashboardSections = (activeItineraries: DatedTrip[]) => {
  const today = localDateOnlyFromDate();
  return useMemo(() => {
    const phases = partitionTrips(activeItineraries, today);
    return {
      nextTrip: phases.upcoming[0] ?? null,
      currentTrip: phases.active[0] ?? null,
      tripStats: {
        active: phases.active.length,
        upcoming: phases.upcoming.length,
        planning: phases.planning.length,
        completed: phases.completed.length,
      },
    };
  }, [activeItineraries, today]);
};
