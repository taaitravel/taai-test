import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, Plane } from "lucide-react";
import { format } from "date-fns";

interface TripsSectionProps {
  activeItineraries: any[];
  loading: boolean;
  onTripClick: () => void;
}

export const TripsSection = ({ activeItineraries, loading, onTripClick }: TripsSectionProps) => {
  const today = new Date();

  const upcomingTrips = useMemo(() => 
    activeItineraries.filter(trip => {
      if (!trip.itin_date_start) return true; // no date = treat as upcoming
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

  const formatDates = (start?: string, end?: string) => {
    if (!start) return 'No dates set';
    const s = format(new Date(start), 'MMM d');
    if (!end) return s;
    return `${s} - ${format(new Date(end), 'MMM d, yyyy')}`;
  };

  const renderTripCard = (trip: any, index: number, emoji: string) => (
    <Card 
      key={trip.id}
      className="absolute w-full h-full cursor-pointer hover:shadow-lg hover:shadow-foreground/5 transition-all duration-300 group bg-card border-border"
      style={{
        transform: `translateY(${index * 10}px) translateX(${index * 5}px)`,
        zIndex: 10 - index
      }}
      onClick={onTripClick}
    >
      <CardContent className="p-4 h-full flex flex-col justify-between">
        <div>
          <div className="text-2xl mb-2 opacity-60">{emoji}</div>
          <h4 className="font-bold text-foreground text-base mb-1 line-clamp-2">
            {trip.itin_name || 'Untitled Trip'}
          </h4>
          <p className="text-muted-foreground text-sm mb-2">
            {formatDates(trip.itin_date_start, trip.itin_date_end)}
          </p>
          <div className="flex flex-wrap gap-1 mb-2">
            {(trip.itin_locations || []).slice(0, 2).map((location: string, idx: number) => (
              <Badge key={idx} variant="secondary" className="text-sm bg-muted text-muted-foreground border-border">
                {location}
              </Badge>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="h-3 w-3 mr-1" />
            {(trip.attendees?.length || 1)} people
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="col-span-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming Trips */}
        <div className="flex flex-col items-center md:items-start">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center justify-center md:justify-start">
            <Calendar className="h-5 w-5 mr-2" />
            Upcoming
          </h3>
          {loading ? (
            <div className="text-center py-8">
              <Plane className="h-8 w-8 text-foreground mx-auto mb-2 animate-pulse" />
              <p className="text-muted-foreground text-sm">Loading...</p>
            </div>
          ) : upcomingTrips.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No upcoming trips</p>
            </div>
          ) : (
            <div className="relative w-[255px] h-[375px]">
              {upcomingTrips.slice(0, 3).map((trip, index) => renderTripCard(trip, index, '✈️'))}
              {upcomingTrips.length > 3 && (
                <div className="absolute bottom-0 right-0 bg-muted backdrop-blur-md rounded-full px-3 py-1 text-xs text-muted-foreground border border-border">
                  +{upcomingTrips.length - 3} more
                </div>
              )}
            </div>
          )}
        </div>

        {/* Past Trips */}
        <div className="flex flex-col items-center md:items-start">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center justify-center md:justify-start">
            <Clock className="h-5 w-5 mr-2" />
            Past Trips
          </h3>
          {loading ? (
            <div className="text-center py-8">
              <Plane className="h-8 w-8 text-foreground mx-auto mb-2 animate-pulse" />
              <p className="text-muted-foreground text-sm">Loading...</p>
            </div>
          ) : pastTrips.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No past trips yet</p>
            </div>
          ) : (
            <div className="relative w-[255px] h-[375px]">
              {pastTrips.slice(0, 3).map((trip, index) => renderTripCard(trip, index, '📸'))}
              {pastTrips.length > 3 && (
                <div className="absolute bottom-0 right-0 bg-muted backdrop-blur-md rounded-full px-3 py-1 text-xs text-muted-foreground border border-border">
                  +{pastTrips.length - 3} more
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
