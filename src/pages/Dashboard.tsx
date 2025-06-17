
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plane, Plus, Calendar, Map, BarChart3, MessageCircle, Users, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeItineraries] = useState([
    {
      id: 1,
      name: "Summer Europe Trip",
      dates: "Jul 15 - Jul 30, 2024",
      locations: ["Paris", "Rome", "Barcelona"],
      budget: 5000,
      spent: 3200,
      people: 2,
      status: "active"
    },
    {
      id: 2,
      name: "Business Trip NYC",
      dates: "Aug 5 - Aug 8, 2024",
      locations: ["New York City"],
      budget: 2000,
      spent: 1100,
      people: 1,
      status: "planning"
    }
  ]);

  const userStats = {
    totalTrips: 12,
    countriesVisited: 18,
    totalSpent: 45000,
    flightsThisYear: 24,
    travelerLevel: "Master Traveler"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Plane className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                TAAI Travel
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-emerald-100 text-emerald-700">
                {userStats.travelerLevel}
              </Badge>
              <Button 
                onClick={() => navigate('/create-itinerary')}
                className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Trip
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, John! ✈️</h1>
          <p className="text-lg text-gray-600">Ready to plan your next adventure?</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-blue-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Trips</p>
                  <p className="text-2xl font-bold text-blue-600">{userStats.totalTrips}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Countries Visited</p>
                  <p className="text-2xl font-bold text-emerald-600">{userStats.countriesVisited}</p>
                </div>
                <Map className="h-8 w-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Flights This Year</p>
                  <p className="text-2xl font-bold text-purple-600">{userStats.flightsThisYear}</p>
                </div>
                <Plane className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold text-orange-600">${userStats.totalSpent.toLocaleString()}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Itineraries */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Active Trips</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/create-itinerary')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New
              </Button>
            </div>

            <div className="space-y-4">
              {activeItineraries.map((trip) => (
                <Card key={trip.id} className="hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{trip.name}</CardTitle>
                        <CardDescription className="flex items-center space-x-2 mt-1">
                          <Calendar className="h-4 w-4" />
                          <span>{trip.dates}</span>
                        </CardDescription>
                      </div>
                      <Badge 
                        variant={trip.status === 'active' ? 'default' : 'secondary'}
                        className={trip.status === 'active' ? 'bg-green-100 text-green-700' : ''}
                      >
                        {trip.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Map className="h-4 w-4" />
                        <span>{trip.locations.join(" → ")}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>{trip.people} {trip.people === 1 ? 'person' : 'people'}</span>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Budget Progress</span>
                          <span className="font-medium">
                            ${trip.spent.toLocaleString()} / ${trip.budget.toLocaleString()}
                          </span>
                        </div>
                        <Progress value={(trip.spent / trip.budget) * 100} className="h-2" />
                      </div>

                      <div className="flex space-x-2 pt-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Chat
                        </Button>
                        <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Quick Actions & Recent Activity */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
            
            <div className="space-y-4">
              <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-3 rounded-full">
                      <Plane className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Book a Flight</h3>
                      <p className="text-sm text-gray-600">Find and compare flight options</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-emerald-100 p-3 rounded-full">
                      <Map className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Explore Destinations</h3>
                      <p className="text-sm text-gray-600">Discover new places to visit</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-purple-100 p-3 rounded-full">
                      <BarChart3 className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Budget Analysis</h3>
                      <p className="text-sm text-gray-600">Review your travel spending</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 text-sm">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Updated Europe Trip budget</span>
                      <span className="text-gray-400">2h ago</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Added flight to NYC trip</span>
                      <span className="text-gray-400">1d ago</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Created new itinerary</span>
                      <span className="text-gray-400">3d ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
