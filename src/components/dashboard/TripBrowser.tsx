import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { X, ChevronLeft, ChevronRight, Map, Users, MessageCircle, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute -top-12 right-0 text-white hover:bg-white/10 z-10"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Trip Counter */}
        <div className="absolute -top-12 left-0 text-white/70 text-sm">
          {currentTripIndex + 1} of {activeItineraries.length}
        </div>

        {/* Main Trip Card */}
        {activeItineraries.length > 0 && (
          <Card className={`w-full aspect-[3/4] animate-scale-in ${
            activeItineraries[currentTripIndex]?.status === 'completed' 
              ? 'trip-browser-past' 
              : 'trip-browser-upcoming'
          }`}>
            <CardContent className="p-6 h-full flex flex-col justify-between">
              <div>
                <div className="text-6xl mb-4 text-center">
                  {activeItineraries[currentTripIndex]?.image || '✈️'}
                </div>
                <h2 className="text-2xl font-bold text-white mb-2 text-center">
                  {activeItineraries[currentTripIndex]?.name}
                </h2>
                <p className="text-white/70 text-center mb-4">
                  {activeItineraries[currentTripIndex]?.dates}
                </p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-white/70">
                    <Map className="h-4 w-4 mr-2" />
                    <span className="text-sm">
                      {activeItineraries[currentTripIndex]?.locations.join(" → ") || "Destinations TBD"}
                    </span>
                  </div>
                  <div className="flex items-center text-white/70">
                    <Users className="h-4 w-4 mr-2" />
                    <span className="text-sm">
                      {activeItineraries[currentTripIndex]?.people} {activeItineraries[currentTripIndex]?.people === 1 ? 'person' : 'people'}
                    </span>
                  </div>
                </div>
                
                {activeItineraries[currentTripIndex]?.budget > 0 && (
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white/70">Budget</span>
                      <span className="font-medium text-white">
                        ${activeItineraries[currentTripIndex]?.spent.toLocaleString()} / ${activeItineraries[currentTripIndex]?.budget.toLocaleString()}
                      </span>
                    </div>
                    <Progress 
                      value={activeItineraries[currentTripIndex]?.budget > 0 ? (activeItineraries[currentTripIndex]?.spent / activeItineraries[currentTripIndex]?.budget) * 100 : 0} 
                      className="h-2" 
                    />
                  </div>
                )}

                <Badge 
                  className={`${
                    activeItineraries[currentTripIndex]?.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                    activeItineraries[currentTripIndex]?.status === 'upcoming' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                    activeItineraries[currentTripIndex]?.status === 'planning' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                    'bg-white/20 text-white/60 border-white/30'
                  }`}
                >
                  {activeItineraries[currentTripIndex]?.status}
                </Badge>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {activeItineraries[currentTripIndex]?.status !== 'completed' ? (
                  <>
                    <div className="flex space-x-2">
                      <Button 
                        className="flex-1 gold-gradient hover:opacity-90 text-[#171821] font-semibold"
                        onClick={() => navigate('/create-itinerary')}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Edit Trip
                      </Button>
                      <Button 
                        className="flex-1 gold-gradient hover:opacity-90 text-[#171821] font-semibold"
                        onClick={() => navigate(`/itinerary?id=${activeItineraries[currentTripIndex]?.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                    <Button 
                      className="w-full gold-gradient hover:opacity-90 text-[#171821] font-semibold"
                      onClick={() => {/* TODO: Implement invite functionality */}}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite
                    </Button>
                  </>
                ) : (
                  <Button 
                    className="w-full bg-white/10 hover:bg-white/15 text-white/70 border-white/20"
                    onClick={() => navigate(`/itinerary?id=${activeItineraries[currentTripIndex]?.id}`)}
                  >
                    View Memories
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Controls */}
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

        {/* Swipe Indicators */}
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