import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, Plane } from "lucide-react";

interface TripsSectionProps {
  activeItineraries: any[];
  loading: boolean;
  onTripClick: () => void;
}

export const TripsSection = ({ activeItineraries, loading, onTripClick }: TripsSectionProps) => {
  return (
    <div className="col-span-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column - Upcoming Trips Stack (50%) */}
        <div className="flex flex-col items-center md:items-start">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-center md:justify-start">
            <Calendar className="h-5 w-5 mr-2" />
            Upcoming
          </h3>
          {loading ? (
            <div className="text-center py-8">
              <Plane className="h-8 w-8 text-white mx-auto mb-2 animate-pulse" />
              <p className="text-white/70 text-sm">Loading...</p>
            </div>
          ) : (
            <div className="relative w-[255px] h-[375px]">
              {activeItineraries
                .filter(trip => ['planning', 'upcoming', 'active'].includes(trip.status))
                .slice(0, 3)
                .map((trip, index) => (
                  <Card 
                    key={trip.id}
                    className="absolute w-full h-full trip-card-past cursor-pointer hover:shadow-lg hover:shadow-gray-500/10 transition-all duration-300 group"
                    style={{
                      transform: `translateY(${index * 10}px) translateX(${index * 5}px)`,
                      zIndex: 10 - index
                    }}
                    onClick={onTripClick}
                  >
                    <CardContent className="p-4 h-full flex flex-col justify-between">
                      <div>
                        <div className="text-2xl mb-2 opacity-60">{trip.image || '✈️'}</div>
                        <h4 className="font-bold text-[#171822] text-base mb-1 line-clamp-2">{trip.name}</h4>
                        <p className="text-white/50 text-sm mb-2">{trip.dates}</p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {trip.locations.slice(0, 2).map((location: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-sm bg-white/10 text-white/60 border-white/20">
                              {location}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-white/50">
                          <Users className="h-3 w-3 mr-1" />
                          {trip.people} people
                        </div>
                        <Badge className="text-sm bg-white/10 text-white/60 border-white/20">
                          {trip.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              
              {activeItineraries.filter(trip => ['planning', 'upcoming', 'active'].includes(trip.status)).length > 3 && (
                <div className="absolute bottom-0 right-0 bg-white/10 backdrop-blur-md rounded-full px-3 py-1 text-xs text-white/60 border border-white/20">
                  +{activeItineraries.filter(trip => ['planning', 'upcoming', 'active'].includes(trip.status)).length - 3} more
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Past Trips Stack (50%) */}
        <div className="flex flex-col items-center md:items-start">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-center md:justify-start">
            <Clock className="h-5 w-5 mr-2" />
            Past Trips
          </h3>
          <div className="relative w-[255px] h-[375px]">
            {activeItineraries
              .filter(trip => trip.status === 'completed')
              .slice(0, 3)
              .map((trip, index) => (
                <Card 
                  key={trip.id}
                  className="absolute w-full h-full trip-card-past cursor-pointer hover:shadow-lg hover:shadow-gray-500/10 transition-all duration-300 group"
                  style={{
                    transform: `translateY(${index * 10}px) translateX(${index * 5}px)`,
                    zIndex: 10 - index
                  }}
                  onClick={onTripClick}
                >
                  <CardContent className="p-4 h-full flex flex-col justify-between">
                    <div>
                      <div className="text-2xl mb-2 opacity-60">{trip.image || '📸'}</div>
                      <h4 className="font-bold text-[#171822] text-base mb-1 line-clamp-2">{trip.name}</h4>
                      <p className="text-white/50 text-sm mb-2">{trip.dates}</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {trip.locations.slice(0, 2).map((location: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-sm bg-white/10 text-white/60 border-white/20">
                            {location}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-white/50">
                        <Users className="h-3 w-3 mr-1" />
                        {trip.people} people
                      </div>
                      <Badge className="text-sm bg-white/10 text-white/60 border-white/20">
                        completed
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            
            {activeItineraries.filter(trip => trip.status === 'completed').length > 3 && (
              <div className="absolute bottom-0 right-0 bg-white/10 backdrop-blur-md rounded-full px-3 py-1 text-xs text-white/60 border border-white/20">
                +{activeItineraries.filter(trip => trip.status === 'completed').length - 3} more
              </div>
            )}
            
            {activeItineraries.filter(trip => trip.status === 'completed').length === 0 && (
              <div className="text-center py-8 text-white/50">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No past trips yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};