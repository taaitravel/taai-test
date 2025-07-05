import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Plane, Map, BarChart3, Star, Calendar, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface QuickActionsProps {
  activeItineraries: any[];
  onBrowseTrips: () => void;
}

export const QuickActions = ({ activeItineraries, onBrowseTrips }: QuickActionsProps) => {
  const navigate = useNavigate();

  return (
    <div className="col-span-2">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Travel Hub</h2>
        <div className="flex gap-2">
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
        className="mb-6 bg-gradient-to-r from-white/10 via-white/5 to-transparent backdrop-blur-md border-white/30 cursor-pointer hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 group"
        onClick={onBrowseTrips}
      >
        <CardContent className="p-6">
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
            <div className="text-4xl group-hover:scale-110 transition-transform duration-300">
              🗂️
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 cursor-pointer bg-[#171821]/80 backdrop-blur-md border-white/30 group">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-full group-hover:scale-105 transition-transform duration-300">
                <Plane className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">Book Flight</h3>
                <p className="text-xs text-white/70">Find deals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 cursor-pointer bg-[#171821]/80 backdrop-blur-md border-white/30 group">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-full group-hover:scale-105 transition-transform duration-300">
                <Map className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">Explore</h3>
                <p className="text-xs text-white/70">Destinations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 cursor-pointer bg-[#171821]/80 backdrop-blur-md border-white/30 group">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-full group-hover:scale-105 transition-transform duration-300">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">Budget</h3>
                <p className="text-xs text-white/70">Analysis</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 cursor-pointer bg-[#171821]/80 backdrop-blur-md border-white/30 group">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-full group-hover:scale-105 transition-transform duration-300">
                <Star className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">Reviews</h3>
                <p className="text-xs text-white/70">Rate trips</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-[#171821]/80 backdrop-blur-md border-white/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-white">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm">
              <Clock className="h-4 w-4 text-white/70" />
              <span className="text-white/70">Updated Singapore trip budget</span>
              <span className="text-white/50">2h ago</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <Clock className="h-4 w-4 text-white/70" />
              <span className="text-white/70">Added hotel to Europe trip</span>
              <span className="text-white/50">1d ago</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <Clock className="h-4 w-4 text-white/70" />
              <span className="text-white/70">Created new itinerary</span>
              <span className="text-white/50">3d ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};