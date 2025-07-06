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
      {/* Combined Stats Card with 4 Ultra-Compact Sections */}
      <Card className="border-white/30 hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 bg-[#171821]/80 backdrop-blur-md group">
        <CardContent className="p-2">
          <div className="space-y-2">
            {/* Section 1: Total Trips YTD */}
            <div className="border-b border-white/10 pb-1">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="text-[10px] font-medium text-white/70">Total Trips YTD</p>
                  <p className="text-sm font-bold text-white">{userStats.totalTrips}</p>
                </div>
                <Calendar className="h-3 w-3 text-white" />
              </div>
              <ChartContainer config={chartConfig} className="h-6 w-full">
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
            <div className="border-b border-white/10 pb-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium text-white/70">Countries Visited</p>
                  <p className="text-sm font-bold text-white">{visitedCountries.length}</p>
                </div>
                <Map className="h-3 w-3 text-white" />
              </div>
            </div>

            {/* Section 3: Travel Metrics */}
            <div className="border-b border-white/10 pb-1">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[9px] font-medium text-white/70">Cities</p>
                  <p className="text-xs font-bold text-white">{userStats.citiesVisited}</p>
                </div>
                <div>
                  <p className="text-[9px] font-medium text-white/70">Flights</p>
                  <p className="text-xs font-bold text-white">{Number(userStats.flightsThisYear)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-medium text-white/70">Level</p>
                  <p className="text-[9px] font-semibold text-white">{userStats.travelerLevel}</p>
                </div>
              </div>
            </div>

            {/* Section 4: Total Spent */}
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium text-white/70">Total Spent</p>
                  <p className="text-sm font-bold text-white">${userStats.totalSpent.toLocaleString()}</p>
                </div>
                <BarChart3 className="h-3 w-3 text-white" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};