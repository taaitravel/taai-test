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

const getStatus = (startDate?: string, endDate?: string) => {
  if (!startDate || !endDate) return 'upcoming';
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (now < start) return 'upcoming';
  if (now >= start && now <= end) return 'active';
  return 'completed';
};

const getEmoji = (trip: any) => {
  const locations = trip.itin_locations || [];
  const locationStr = locations.join(' ').toLowerCase();
  if (locationStr.includes('japan') || locationStr.includes('tokyo') || locationStr.includes('kyoto')) return '🍜';
  if (locationStr.includes('paris') || locationStr.includes('france')) return '🗼';
  if (locationStr.includes('beach') || locationStr.includes('hawaii') || locationStr.includes('bali')) return '🌴';
  if (locationStr.includes('ski') || locationStr.includes('alps')) return '⛷️';
  if (locationStr.includes('london') || locationStr.includes('england')) return '🇬🇧';
  if (locationStr.includes('new york') || locationStr.includes('nyc')) return '🗽';
  if (locationStr.includes('singapore') || locationStr.includes('thailand') || locationStr.includes('bangkok')) return '🏯';
  if (locationStr.includes('europe') || locationStr.includes('amsterdam') || locationStr.includes('berlin')) return '❄️';
  const status = getStatus(trip.itin_date_start, trip.itin_date_end);
  if (status === 'completed') return '📸';
  return '✈️';
};

export const TripsSection = ({ activeItineraries, loading, onTripClick }: TripsSectionProps) => {
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

  const formatDates = (start?: string, end?: string) => {
    if (!start || !end) return 'Dates TBD';
    return `${format(new Date(start), 'MMM d')} - ${format(new Date(end), 'MMM d, yyyy')}`;
  };

  const renderTripCard = (trip: any, index: number) => {
    const status = getStatus(trip.itin_date_start, trip.itin_date_end);
    const locations = trip.itin_locations || [];

    return (
      <Card 
        key={trip.id}
        className="absolute w-full h-full trip-card-past cursor-pointer hover:shadow-lg hover:shadow-foreground/5 transition-all duration-300 group"
        style={{
          transform: `translateY(${index * 10}px) translateX(${index * 5}px)`,
          zIndex: 10 - index
        }}
        onClick={onTripClick}
      >
        <CardContent className="p-2 sm:p-3 lg:p-4 h-full flex flex-col justify-between">
          <div>
            <div className="text-base sm:text-xl lg:text-2xl mb-1 sm:mb-2 opacity-60">{getEmoji(trip)}</div>
            <h4 className="font-bold text-foreground dark:text-[#171820] text-sm sm:text-base mb-0.5 sm:mb-1 line-clamp-2 group-hover:text-white transition-colors">
              {trip.itin_name || 'Untitled Trip'}
            </h4>
            <p className="text-muted-foreground text-xs sm:text-sm mb-1 sm:mb-2">
              {formatDates(trip.itin_date_start, trip.itin_date_end)}
            </p>
            <div className="flex flex-wrap gap-0.5 sm:gap-1 mb-1 sm:mb-2">
              {locations.slice(0, 1).map((location: string, idx: number) => (
                <Badge 
                  key={idx} 
                  variant="secondary" 
                  className="text-[10px] sm:text-xs lg:text-sm bg-muted text-muted-foreground border-border px-1 sm:px-2"
                >
                  {location}
                </Badge>
              ))}
              {locations.length > 1 && (
                <Badge 
                  variant="secondary" 
                  className="text-[10px] sm:text-xs lg:text-sm bg-muted text-muted-foreground border-border px-1 sm:px-2"
                >
                  +{locations.length - 1}
                </Badge>
              )}
            </div>
          </div>
          <div className="space-y-1 sm:space-y-2">
            <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
              <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
              {trip.attendees?.length || 1}
            </div>
            <Badge className="text-[10px] sm:text-xs lg:text-sm bg-muted text-muted-foreground border-border px-1 sm:px-2">
              {status}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  };

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
            <div className="relative w-full max-w-[255px] h-[375px]">
              {upcomingTrips.slice(0, 3).map((trip, index) => renderTripCard(trip, index))}
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
            <div className="relative w-full max-w-[255px] h-[375px]">
              {pastTrips.slice(0, 3).map((trip, index) => renderTripCard(trip, index))}
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
