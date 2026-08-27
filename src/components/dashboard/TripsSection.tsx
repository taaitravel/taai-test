import { useMemo } from "react";
import { Calendar, Clock } from "lucide-react";
import { StackSection } from "@/components/itinerary-stacks/StackSection";

interface TripsSectionProps {
  activeItineraries: any[];
  loading: boolean;
  onTripClick?: () => void;
}

export const TripsSection = ({ activeItineraries, loading }: TripsSectionProps) => {
  const today = new Date();

  const upcomingTrips = useMemo(() => 
    activeItineraries.filter(trip => {
      if (!trip.itin_date_start) return true;
      return new Date(trip.itin_date_start) >= today;
    }),
    [activeItineraries]
  );

  const pastTrips = useMemo(() => 
    activeItineraries.filter(trip => {
      if (!trip.itin_date_start) return false;
      return new Date(trip.itin_date_start) < today;
    }),
    [activeItineraries]
  );

  return (
    <div className="col-span-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bright-card p-4 sm:p-6">
        <StackSection
          title="Upcoming"
          icon={<Calendar className="h-5 w-5" />}
          items={upcomingTrips}
          loading={loading}
          emptyIcon={<Calendar className="h-8 w-8 mx-auto opacity-50" />}
          emptyMessage="No upcoming trips"
        />
        </div>
        <div className="bright-card p-4 sm:p-6">
        <StackSection
          title="Past Trips"
          icon={<Clock className="h-5 w-5" />}
          items={pastTrips}
          loading={loading}
          emptyIcon={<Clock className="h-8 w-8 mx-auto opacity-50" />}
          emptyMessage="No past trips yet"
        />
        </div>
      </div>
    </div>
  );
};
