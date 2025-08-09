import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Calendar, Map, BarChart3 } from "lucide-react";
import { CountriesMap } from "@/components/CountriesMap";
import { FlightProgressIndicator } from "../FlightProgressIndicator";

interface TravelMetricsProps {
  userStats: {
    totalTrips: number;
    countriesVisited: number;
    citiesVisited: number;
    totalSpent: number;
    flightsThisYear: number;
    travelerLevel: string;
  };
  visitedCountries: string[];
  activeItineraries?: any[];
}

export const TravelMetrics = ({ userStats, visitedCountries, activeItineraries }: TravelMetricsProps) => {
  const monthlyFlights = [
    { month: 'Jul', flights: 5 },
    { month: 'Aug', flights: 2 },
    { month: 'Sep', flights: 1 },
    { month: 'Oct', flights: 1 },
    { month: 'Nov', flights: 3 },
    { month: 'Dec', flights: 2 }
  ];

  const spendingData = [
    { name: 'Flights', value: 18000, color: 'hsl(351, 85%, 75%)' },
    { name: 'Hotels', value: 15000, color: 'hsl(15, 80%, 70%)' },
    { name: 'Food', value: 7000, color: 'hsl(25, 75%, 65%)' },
    { name: 'Activities', value: 5000, color: 'hsl(45, 42%, 35%)' }
  ];

  const chartConfig = {
    flights: {
      label: "Flights",
      color: "hsl(var(--primary))",
    }
  };

  return (
    <Card className="border-white/30 hover:shadow-xl hover:shadow-white/10 transition-all duration-300 bg-[#171821]/80 backdrop-blur-md p-5">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-bold text-white">Travel Metrics</h2>
        <Button 
          size="sm"
          className="gold-gradient hover:opacity-90 text-[#171821] font-semibold"
        >
          View Metrics
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        {/* Flight Progress Indicator */}
        <Card className="border-white/20 bg-[#171821]/60 backdrop-blur-sm">
          <CardContent className="p-4 min-h-[250px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-white/70 mb-1">Flight Progress</p>
                <p className="text-xs text-white/50">Track your journey to the next level</p>
              </div>
            </div>
            <div className="flex justify-center">
              <FlightProgressIndicator 
                currentFlights={Number(userStats.flightsThisYear)} 
                currentLevel={userStats.travelerLevel}
              />
            </div>
          </CardContent>
        </Card>

        {/* Countries Map */}
        <Card className="border-white/20 bg-[#171821]/60 backdrop-blur-sm">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-white/70 mb-1">Countries Visited</p>
                <p className="text-2xl font-bold text-white">{visitedCountries.length}</p>
              </div>
              <Map className="h-6 w-6 text-white/70" />
            </div>
            <div className="h-[250px]">
              <CountriesMap visitedCountries={visitedCountries} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Spending Chart */}
        <Card className="border-white/20 bg-[#171821]/60 backdrop-blur-sm">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-white/70 mb-1">Total Spent</p>
                <p className="text-2xl font-bold text-white">${userStats.totalSpent.toLocaleString()}</p>
              </div>
              <BarChart3 className="h-6 w-6 text-white/70" />
            </div>
            <div className="h-[150px]">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={spendingData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={55}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {spendingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {spendingData.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-white/80 font-medium">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats Table */}
        <Card className="border-white/20 bg-[#171821]/60 backdrop-blur-sm hidden md:block">
          <CardContent className="p-3">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-sm text-white/70">Total Trips</span>
                <span className="text-lg font-bold text-white">{userStats.totalTrips}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-sm text-white/70">Cities Visited</span>
                <span className="text-lg font-bold text-white">{userStats.citiesVisited}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-sm text-white/70">Flights YTD</span>
                <span className="text-lg font-bold text-white">{Number(userStats.flightsThisYear)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">Traveler Level</span>
                <span className="text-sm font-bold text-white bg-white/20 px-2 py-1 rounded">
                  {userStats.travelerLevel}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Card>
  );
};