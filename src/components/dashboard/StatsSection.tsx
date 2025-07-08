import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Calendar, Map, MapPin, Plane, Users, BarChart3 } from "lucide-react";
import { CountriesMap } from "@/components/CountriesMap";

interface StatsSectionProps {
  userStats: {
    totalTrips: number;
    countriesVisited: number;
    citiesVisited: number;
    totalSpent: number;
    flightsThisYear: number;
    travelerLevel: string;
  };
  visitedCountries: string[];
}

export const StatsSection = ({ userStats, visitedCountries }: StatsSectionProps) => {
  // Last 6 months flight data
  const monthlyFlights = [
    { month: 'Jul', flights: 5 },
    { month: 'Aug', flights: 2 },
    { month: 'Sep', flights: 1 },
    { month: 'Oct', flights: 1 },
    { month: 'Nov', flights: 3 },
    { month: 'Dec', flights: 2 }
  ];

  // Logo-themed colors for spending categories
  const spendingData = [
    { name: 'Flights', value: 18000, color: 'hsl(351, 85%, 75%)' }, // Primary gold/pink
    { name: 'Hotels', value: 15000, color: 'hsl(15, 80%, 70%)' }, // Warm orange
    { name: 'Food', value: 7000, color: 'hsl(25, 75%, 65%)' }, // Golden orange
    { name: 'Activities', value: 5000, color: 'hsl(45, 42%, 35%)' } // Dark brown
  ];

  const chartConfig = {
    flights: {
      label: "Flights",
      color: "hsl(var(--primary))",
    }
  };

  return (
    <div className="mb-8">
      {/* Grouped Metrics Container */}
      <Card className="border-white/30 hover:shadow-xl hover:shadow-white/10 transition-all duration-300 bg-[#171821]/80 backdrop-blur-md p-5">
        {/* Header with View Metrics Button */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-white">Travel Metrics</h2>
          <Button 
            size="sm"
            className="gold-gradient hover:opacity-90 text-[#171821] font-semibold"
          >
            View Metrics
          </Button>
        </div>

        {/* First Row: YTD and Countries Visited */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          {/* YTD Flights Card - Hidden on mobile */}
          <Card className="border-white/20 bg-[#171821]/60 backdrop-blur-sm hidden md:block">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-white/70 mb-1">Flights (Last 6 Months)</p>
                  <p className="text-2xl font-bold text-white">{Number(userStats.flightsThisYear)}</p>
                </div>
                <Calendar className="h-6 w-6 text-white/70" />
              </div>
              <ChartContainer config={chartConfig} className="h-20 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyFlights}>
                    <Bar dataKey="flights" fill="hsl(351, 85%, 75%)" radius={2} />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12, fill: 'white' }} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Countries Visited Card with Map */}
          <Card className="border-white/20 bg-[#171821]/60 backdrop-blur-sm">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-white/70 mb-1">Countries Visited</p>
                  <p className="text-2xl font-bold text-white">{visitedCountries.length}</p>
                </div>
                <Map className="h-6 w-6 text-white/70" />
              </div>
              <div className="h-32">
                <CountriesMap visitedCountries={visitedCountries} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Second Row: Total Spent and Stats Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Total Spent Card with Pie Chart */}
          <Card className="border-white/20 bg-[#171821]/60 backdrop-blur-sm">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-white/70 mb-1">Total Spent</p>
                  <p className="text-2xl font-bold text-white">${userStats.totalSpent.toLocaleString()}</p>
                </div>
                <BarChart3 className="h-6 w-6 text-white/70" />
              </div>
              <div className="h-32">
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

          {/* Vertical Stats Table */}
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
    </div>
  );
};