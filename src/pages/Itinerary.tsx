
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, MapPin, Calendar, Users, DollarSign, ArrowLeft, Edit, Share2, Download } from "lucide-react";
import Map from "@/components/Map";

interface ItineraryData {
  name: string;
  startDate: string;
  endDate: string;
  people: number;
  budget: string;
  destinations: string;
  description: string;
}

const Itinerary = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [itineraryData, setItineraryData] = useState<ItineraryData | null>(null);

  useEffect(() => {
    if (location.state?.itineraryData) {
      setItineraryData(location.state.itineraryData);
    } else {
      // Mock data for demonstration
      setItineraryData({
        name: "European Adventure",
        startDate: "2024-07-15",
        endDate: "2024-07-25",
        people: 2,
        budget: "5000",
        destinations: "Paris, Rome, Barcelona",
        description: "A romantic getaway through Europe's most beautiful cities"
      });
    }
  }, [location.state]);

  if (!itineraryData) {
    return (
      <div className="min-h-screen bg-[#171821] flex items-center justify-center">
        <div className="text-center">
          <Plane className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
          <p className="text-yellow-200">Loading your itinerary...</p>
        </div>
      </div>
    );
  }

  const duration = Math.ceil((new Date(itineraryData.endDate).getTime() - new Date(itineraryData.startDate).getTime()) / (1000 * 60 * 60 * 24));
  const destinations = itineraryData.destinations.split(',').map(d => d.trim());

  return (
    <div className="min-h-screen bg-[#171821]">
      {/* Navigation */}
      <nav className="bg-[#171821]/95 backdrop-blur-md border-b border-yellow-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/dashboard')}
                className="text-yellow-300 hover:text-yellow-200 hover:bg-yellow-400/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Plane className="h-8 w-8 text-yellow-400" />
              <span className="text-2xl font-bold luxury-text-gradient">
                TAAI Travel
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-400/10">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-400/10">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm" className="gold-gradient hover:opacity-90 text-[#171821] font-semibold">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold luxury-text-gradient mb-2">{itineraryData.name}</h1>
          <div className="flex justify-center items-center space-x-6 text-yellow-300/70">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>{new Date(itineraryData.startDate).toLocaleDateString()} - {new Date(itineraryData.endDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>{itineraryData.people} {itineraryData.people === 1 ? 'Traveler' : 'Travelers'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span>${Number(itineraryData.budget).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trip Overview */}
            <Card className="bg-[#171821]/60 border-yellow-500/30 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-yellow-200 flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-yellow-400" />
                  <span>Trip Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-yellow-300/70">Duration:</span>
                    <p className="text-yellow-200 font-medium">{duration} days</p>
                  </div>
                  <div>
                    <span className="text-yellow-300/70">Budget per person:</span>
                    <p className="text-yellow-200 font-medium">${Math.round(Number(itineraryData.budget) / itineraryData.people).toLocaleString()}</p>
                  </div>
                </div>
                
                <div>
                  <span className="text-yellow-300/70 text-sm">Destinations:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {destinations.map((destination, index) => (
                      <Badge key={index} className="bg-yellow-400/20 text-yellow-300 border-yellow-500/30">
                        {destination}
                      </Badge>
                    ))}
                  </div>
                </div>

                {itineraryData.description && (
                  <div>
                    <span className="text-yellow-300/70 text-sm">Description:</span>
                    <p className="text-yellow-200 mt-1">{itineraryData.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Map */}
            <Card className="bg-[#171821]/60 border-yellow-500/30 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-yellow-200">Trip Map</CardTitle>
                <CardDescription className="text-yellow-300/70">
                  Explore your destinations and discover nearby attractions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96 rounded-lg overflow-hidden">
                  <Map />
                </div>
              </CardContent>
            </Card>

            {/* Daily Itinerary */}
            <Card className="bg-[#171821]/60 border-yellow-500/30 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-yellow-200">Daily Schedule</CardTitle>
                <CardDescription className="text-yellow-300/70">
                  Your day-by-day travel plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: duration }, (_, index) => {
                    const currentDate = new Date(itineraryData.startDate);
                    currentDate.setDate(currentDate.getDate() + index);
                    const destination = destinations[index % destinations.length];
                    
                    return (
                      <div key={index} className="border-l-2 border-yellow-500/30 pl-4 pb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-yellow-200">
                            Day {index + 1} - {currentDate.toLocaleDateString()}
                          </h4>
                          <Badge className="bg-yellow-400/20 text-yellow-300 border-yellow-500/30">
                            {destination}
                          </Badge>
                        </div>
                        <div className="text-sm text-yellow-300/70 space-y-1">
                          <p>🏨 Check accommodation availability</p>
                          <p>✈️ Review flight details</p>
                          <p>🍽️ Explore local dining options</p>
                          <p>🎯 Discover activities and attractions</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Budget Breakdown */}
            <Card className="bg-[#171821]/60 border-yellow-500/30 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-yellow-200 flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-yellow-400" />
                  <span>Budget Breakdown</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-yellow-300/70">Flights</span>
                    <span className="text-yellow-200 font-medium">$1,200</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-yellow-300/70">Accommodation</span>
                    <span className="text-yellow-200 font-medium">$1,800</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-yellow-300/70">Activities</span>
                    <span className="text-yellow-200 font-medium">$800</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-yellow-300/70">Food & Dining</span>
                    <span className="text-yellow-200 font-medium">$1,000</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-yellow-300/70">Miscellaneous</span>
                    <span className="text-yellow-200 font-medium">$200</span>
                  </div>
                  <hr className="border-yellow-500/20" />
                  <div className="flex justify-between font-semibold">
                    <span className="text-yellow-200">Total</span>
                    <span className="text-yellow-200">${Number(itineraryData.budget).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Recommendations */}
            <Card className="bg-[#171821]/60 border-yellow-500/30 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-yellow-200">AI Recommendations</CardTitle>
                <CardDescription className="text-yellow-300/70">
                  Personalized suggestions for your trip
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-yellow-400/10 rounded-lg border border-yellow-500/20">
                  <p className="text-sm font-medium text-yellow-200">🏨 Best Time to Book</p>
                  <p className="text-sm text-yellow-300/70 mt-1">
                    Book your hotels 2-3 weeks before travel for optimal rates in Europe.
                  </p>
                </div>
                <div className="p-3 bg-yellow-400/10 rounded-lg border border-yellow-500/20">
                  <p className="text-sm font-medium text-yellow-200">🍽️ Local Cuisine</p>
                  <p className="text-sm text-yellow-300/70 mt-1">
                    Try paella in Barcelona, pasta in Rome, and croissants in Paris.
                  </p>
                </div>
                <div className="p-3 bg-yellow-400/10 rounded-lg border border-yellow-500/20">
                  <p className="text-sm font-medium text-yellow-200">🚇 Transportation</p>
                  <p className="text-sm text-yellow-300/70 mt-1">
                    Consider getting a Eurail pass for convenient travel between cities.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Itinerary;
