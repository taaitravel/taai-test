import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TravelActions } from "./TravelActions";
import { RecentActivity } from "./RecentActivity";

interface TravelHubProps {
  activeItineraries: any[];
  onBrowseTrips: () => void;
}

export const TravelHub = ({ activeItineraries, onBrowseTrips }: TravelHubProps) => {
  const navigate = useNavigate();

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold text-white">Travel Hub</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button 
            size="sm"
            onClick={() => navigate('/create-itinerary')}
            className="gold-gradient hover:opacity-90 text-[#171821] font-semibold"
          >
            <Plus className="h-4 w-4 mr-2" />
            AI Trip
          </Button>
          <Button 
            size="sm"
            variant="outline"
            onClick={() => navigate('/create-manual-itinerary')}
            className="border-white/50 text-white hover:bg-white/10"
          >
            <Plus className="h-4 w-4 mr-2" />
            Manual
          </Button>
        </div>
      </div>

      {/* Browse All Trips Card */}
      <Card 
        className="mb-6 bg-[#171821]/90 backdrop-blur-md border border-primary/30 cursor-pointer hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 group relative overflow-hidden"
        onClick={onBrowseTrips}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <CardContent className="p-6 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:scale-105 transition-transform duration-300">
                Browse All Trips
              </h3>
              <p className="text-white/70">Swipe through your travel collection</p>
              <div className="flex items-center space-x-4 mt-3">
                <div className="flex items-center text-sm text-white/70">
                  <Calendar className="h-4 w-4 mr-1" />
                  {activeItineraries.filter(trip => ['planning', 'upcoming', 'active'].includes(trip.status)).length} upcoming
                </div>
                <div className="flex items-center text-sm text-white/70">
                  <Clock className="h-4 w-4 mr-1" />
                  {activeItineraries.filter(trip => trip.status === 'completed').length} completed
                </div>
              </div>
            </div>
            <div className="text-4xl group-hover:scale-110 transition-transform duration-300 opacity-80 group-hover:opacity-100">
              🗂️
            </div>
          </div>
        </CardContent>
      </Card>

      <TravelActions />
      <RecentActivity />
    </div>
  );
};