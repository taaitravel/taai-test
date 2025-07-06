import { Card, CardContent } from "@/components/ui/card";
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
  const monthlyFlights = [
    { month: 'Jan', flights: 2 },
    { month: 'Feb', flights: 1 },
    { month: 'Mar', flights: 3 },
    { month: 'Apr', flights: 2 },
    { month: 'May', flights: 4 },
    { month: 'Jun', flights: 3 },
    { month: 'Jul', flights: 5 },
    { month: 'Aug', flights: 2 },
    { month: 'Sep', flights: 1 },
    { month: 'Oct', flights: 1 },
    { month: 'Nov', flights: 0 },
    { month: 'Dec', flights: 0 }
  ];

  const spendingData = [
    { name: 'Flights', value: 18000, color: 'hsl(var(--primary))' },
    { name: 'Hotels', value: 15000, color: 'hsl(var(--secondary))' },
    { name: 'Food', value: 7000, color: 'hsl(var(--accent))' },
    { name: 'Activities', value: 5000, color: 'hsl(var(--muted))' }
  ];

  const chartConfig = {
    flights: {
      label: "Flights",
      color: "hsl(var(--primary))",
    }
  };

  return (
    <div className="mb-8">
      {/* First Row: YTD and Countries Visited */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* YTD Flights Card */}
        <Card className="border-white/30 hover:shadow-xl hover:shadow-white/10 transition-all duration-300 bg-[#171821]/80 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-white/70 mb-1">Flights This Year</p>
                <p className="text-2xl font-bold text-white">{Number(userStats.flightsThisYear)}</p>
              </div>
              <Calendar className="h-6 w-6 text-white/70" />
            </div>
            <ChartContainer config={chartConfig} className="h-16 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyFlights}>
                  <Bar dataKey="flights" fill="hsl(var(--primary))" radius={2} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.6)' }} />
                  <YAxis hide />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Countries Visited Card with Map */}
        <Card className="border-white/30 hover:shadow-xl hover:shadow-white/10 transition-all duration-300 bg-[#171821]/80 backdrop-blur-md">
          <CardContent className="p-4">
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
      <div className="grid grid-cols-2 gap-6">
        {/* Total Spent Card with Pie Chart */}
        <Card className="border-white/30 hover:shadow-xl hover:shadow-white/10 transition-all duration-300 bg-[#171821]/80 backdrop-blur-md">
          <CardContent className="p-4">
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
                      innerRadius={25}
                      outerRadius={50}
                      paddingAngle={2}
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
            <div className="grid grid-cols-2 gap-2 mt-2">
              {spendingData.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-white/70">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Vertical Stats Table */}
        <Card className="border-white/30 hover:shadow-xl hover:shadow-white/10 transition-all duration-300 bg-[#171821]/80 backdrop-blur-md">
          <CardContent className="p-4">
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
    </div>
  );
};