import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Calendar, Map, MapPin, Plane, Users, BarChart3 } from "lucide-react";
import WorldMap from "@/components/WorldMap";

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
    <div className="grid grid-cols-1 gap-6 mb-8">
      {/* Combined Stats Card with 4 Compact Sections */}
      <Card className="border-white/30 hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 bg-[#171821]/80 backdrop-blur-md group">
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Section 1: Total Trips YTD */}
            <div className="border-b border-white/10 pb-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs font-medium text-white/70">Total Trips YTD</p>
                  <p className="text-lg font-bold text-white">{userStats.totalTrips}</p>
                </div>
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <ChartContainer config={chartConfig} className="h-12 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyFlights}>
                    <Bar dataKey="flights" fill="white" radius={1} />
                    <XAxis dataKey="month" hide />
                    <YAxis hide />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            {/* Section 2: Countries Visited */}
            <div className="border-b border-white/10 pb-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs font-medium text-white/70">Countries Visited</p>
                  <p className="text-lg font-bold text-white">{visitedCountries.length}</p>
                </div>
                <Map className="h-5 w-5 text-white" />
              </div>
              <div className="h-16">
                <WorldMap visitedCountries={visitedCountries} />
              </div>
            </div>

            {/* Section 3: Travel Metrics */}
            <div className="border-b border-white/10 pb-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-white/70">Cities Visited</p>
                    <p className="text-sm font-bold text-white">{userStats.citiesVisited}</p>
                  </div>
                  <MapPin className="h-4 w-4 text-white" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-white/70">Flights This Year</p>
                    <p className="text-sm font-bold text-white">{Number(userStats.flightsThisYear)}</p>
                  </div>
                  <Plane className="h-4 w-4 text-white" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-white/70">Traveler Level</p>
                    <p className="text-xs font-semibold text-white">{userStats.travelerLevel}</p>
                  </div>
                  <Users className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>

            {/* Section 4: Total Spent */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs font-medium text-white/70">Total Spent</p>
                  <p className="text-lg font-bold text-white">${userStats.totalSpent.toLocaleString()}</p>
                </div>
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <ChartContainer config={chartConfig} className="h-20 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={spendingData}
                      cx="50%"
                      cy="50%"
                      innerRadius={8}
                      outerRadius={20}
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};