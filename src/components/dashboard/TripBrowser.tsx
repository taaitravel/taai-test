import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { X, ChevronLeft, ChevronRight, Map, Users, MessageCircle, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface TripBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  activeItineraries: any[];
  currentTripIndex: number;
  onTripIndexChange: (index: number) => void;
}

export const TripBrowser = ({ 
  isOpen, 
  onClose, 
  activeItineraries, 
  currentTripIndex, 
  onTripIndexChange 
}: TripBrowserProps) => {
  const navigate = useNavigate();

  if (!isOpen || activeItineraries.length === 0) return null;

  const trip = activeItineraries[currentTripIndex];
  if (!trip) return null;

  const isUpcoming = !trip.itin_date_start || new Date(trip.itin_date_start) >= new Date();
  const locations = trip.itin_locations || [];
  const people = trip.attendees?.length || 1;
  const formatDates = () => {
    if (!trip.itin_date_start) return 'No dates set';
    const s = format(new Date(trip.itin_date_start), 'MMM d');
    if (!trip.itin_date_end) return s;
    return `${s} - ${format(new Date(trip.itin_date_end), 'MMM d, yyyy')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        <Button
          variant="ghost"
          size="sm"
          className="absolute -top-12 right-0 text-white hover:bg-white/10 z-10"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>

        <div className="absolute -top-12 left-0 text-white/70 text-sm">
          {currentTripIndex + 1} of {activeItineraries.length}
        </div>

        <Card className={`w-full aspect-[3/4] animate-scale-in ${
          isUpcoming ? 'trip-browser-upcoming' : 'trip-browser-past'
        }`}>
          <CardContent className="p-6 h-full flex flex-col justify-between">
            <div>
              <div className="text-6xl mb-4 text-center">
                {isUpcoming ? '✈️' : '📸'}
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2 text-center">
                {trip.itin_name || 'Untitled Trip'}
              </h2>
              <p className="text-muted-foreground text-center mb-4">
                {formatDates()}
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-muted-foreground">
                  <Map className="h-4 w-4 mr-2" />
                  <span className="text-sm">
                    {locations.length > 0 ? locations.join(" → ") : "Destinations TBD"}
                  </span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Users className="h-4 w-4 mr-2" />
                  <span className="text-sm">
                    {people} {people === 1 ? 'person' : 'people'}
                  </span>
                </div>
              </div>
              
              {trip.budget > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Budget</span>
                    <span className="font-medium text-foreground">
                      ${(trip.spending || 0).toLocaleString()} / ${trip.budget.toLocaleString()}
                    </span>
                  </div>
                  <Progress 
                    value={trip.budget > 0 ? ((trip.spending || 0) / trip.budget) * 100 : 0} 
                    className="h-2" 
                  />
                </div>
              )}

              <Badge className={`${
                isUpcoming
                  ? 'bg-blue-500/20 text-blue-500 border-blue-500/30'
                  : 'bg-muted text-muted-foreground border-border'
              }`}>
                {isUpcoming ? 'Upcoming' : 'Past'}
              </Badge>
            </div>

            <div className="space-y-3">
              {isUpcoming ? (
                <>
                  <div className="flex space-x-2">
                    <Button 
                      className="flex-1 gold-gradient hover:opacity-90 text-background font-semibold"
                      onClick={() => navigate(`/itinerary?id=${trip.id}`)}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Edit Trip
                    </Button>
                    <Button 
                      className="flex-1 gold-gradient hover:opacity-90 text-background font-semibold"
                      onClick={() => navigate(`/itinerary?id=${trip.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                  <Button 
                    className="w-full gold-gradient hover:opacity-90 text-background font-semibold"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite
                  </Button>
                </>
              ) : (
                <Button 
                  className="w-full bg-muted hover:bg-accent text-muted-foreground border-border"
                  onClick={() => navigate(`/itinerary?id=${trip.id}`)}
                >
                  View Memories
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center space-x-4 mt-6">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 p-3 rounded-full"
            onClick={() => onTripIndexChange(currentTripIndex > 0 ? currentTripIndex - 1 : activeItineraries.length - 1)}
            disabled={activeItineraries.length <= 1}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 p-3 rounded-full"
            onClick={() => onTripIndexChange(currentTripIndex < activeItineraries.length - 1 ? currentTripIndex + 1 : 0)}
            disabled={activeItineraries.length <= 1}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex justify-center space-x-2 mt-4">
          {activeItineraries.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentTripIndex ? 'bg-white' : 'bg-white/30'
              }`}
              onClick={() => onTripIndexChange(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
