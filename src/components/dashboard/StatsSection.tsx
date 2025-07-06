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
      {/* Combined Stats Card with 4 Sections */}
      <Card className="border-white/30 hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 bg-[#171821]/80 backdrop-blur-md group">
        <CardContent className="p-6">
          <div className="space-y-8">
            {/* Section 1: Total Trips YTD */}
            <div className="border-b border-white/10 pb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-white/70">Total Trips YTD</p>
                  <p className="text-2xl font-bold text-white group-hover:scale-105 transition-transform duration-300">{userStats.totalTrips}</p>
                </div>
                <Calendar className="h-8 w-8 text-white group-hover:scale-105 transition-transform duration-300" />
              </div>
              <ChartContainer config={chartConfig} className="h-20 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyFlights}>
                    <Bar dataKey="flights" fill="white" radius={2} />
                    <XAxis dataKey="month" hide />
                    <YAxis hide />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            {/* Section 2: Countries Visited */}
            <div className="border-b border-white/10 pb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-white/70">Countries Visited</p>
                  <p className="text-2xl font-bold text-white group-hover:scale-105 transition-transform duration-300">{visitedCountries.length}</p>
                </div>
                <Map className="h-8 w-8 text-white group-hover:scale-105 transition-transform duration-300" />
              </div>
              <WorldMap visitedCountries={visitedCountries} />
            </div>

            {/* Section 3: Travel Metrics */}
            <div className="border-b border-white/10 pb-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/70">Cities Visited</p>
                    <p className="text-xl font-bold text-white">{userStats.citiesVisited}</p>
                  </div>
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/70">Flights This Year</p>
                    <p className="text-xl font-bold text-white">{Number(userStats.flightsThisYear)}</p>
                  </div>
                  <Plane className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/70">Traveler Level</p>
                    <p className="text-sm font-semibold text-white">{userStats.travelerLevel}</p>
                  </div>
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            {/* Section 4: Total Spent */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-white/70">Total Spent</p>
                  <p className="text-2xl font-bold text-white group-hover:scale-105 transition-transform duration-300">${userStats.totalSpent.toLocaleString()}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-white group-hover:scale-105 transition-transform duration-300" />
              </div>
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={spendingData}
                      cx="50%"
                      cy="50%"
                      innerRadius={15}
                      outerRadius={35}
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