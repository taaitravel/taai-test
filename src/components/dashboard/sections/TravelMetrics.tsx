import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Map, BarChart3 } from "lucide-react";
import { CountriesMap } from "@/components/CountriesMap";
import { FlightProgressIndicator } from "../FlightProgressIndicator";
interface TravelMetricsProps {
  userStats: {
    totalTrips: number;
    countriesVisited: number;
    citiesVisited: number;
    totalSpent: number;
    projectedSpend: number;
    flightsThisYear: number;
    travelerLevel: string;
  };
  visitedCountries: string[];
  activeItineraries?: any[];
}
export const TravelMetrics = ({
  userStats,
  visitedCountries,
  activeItineraries
}: TravelMetricsProps) => {
  const today = new Date();
  // Rank future trips by spending amount (highest to lowest) for projected spend
  const rankedTrips = (activeItineraries || [])
    .filter(itinerary => {
      const endDate = itinerary.itin_date_end;
      return endDate && new Date(endDate) >= today && itinerary.spending && Number(itinerary.spending) > 0;
    })
    .map(itinerary => ({
      name: itinerary.title || itinerary.itin_name || 'Unnamed Trip',
      spending: Number(itinerary.spending) || 0,
      date: itinerary.start_date || itinerary.itin_date_start
    }))
    .sort((a, b) => b.spending - a.spending)
    .slice(0, 5);

  const formatMonthYear = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${month}/${year}`;
  };
  return <Card className="bright-card bright-card-hover p-4 sm:p-6 overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="font-mono-label mb-1">Overview</p>
          <h2 className="font-display text-xl sm:text-2xl font-semibold text-foreground">Travel Metrics</h2>
        </div>
        <Button size="sm" className="bright-btn-grad rounded-full px-4 h-9 font-medium">
          View Metrics
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5 mb-5">
        {/* Flight Progress Indicator */}
        <Card className="bright-card">
          <CardContent className="p-4 min-h-[250px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-mono-label mb-1">Flight Progress</p>
                <p className="text-xs text-muted-foreground">Track your journey to the next level</p>
              </div>
            </div>
            <div className="flex justify-center">
              <FlightProgressIndicator currentFlights={Number(userStats.flightsThisYear)} currentLevel={userStats.travelerLevel} />
            </div>
          </CardContent>
        </Card>

        {/* Countries Map */}
        <Card className="bright-card">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-mono-label mb-1">Countries Visited</p>
                <p className="font-display font-semibold bright-grad-text text-4xl">{visitedCountries.length}</p>
              </div>
              <Map className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="h-[250px]">
              <CountriesMap visitedCountries={visitedCountries} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5">
        {/* Top Spending Trips */}
        <Card className="bright-card">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-mono-label mb-1">Projected Spend</p>
                <p className="font-display font-semibold bright-grad-text text-2xl sm:text-4xl">${userStats.projectedSpend.toLocaleString()}</p>
              </div>
              <BarChart3 className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              {rankedTrips.length > 0 ? rankedTrips.map((trip, index) => <div key={index} className="flex items-center justify-between py-2 px-3 rounded-xl bg-[hsl(var(--muted))]/60 hover:bg-accent transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="font-mono text-[10px] text-muted-foreground w-4">#{index + 1}</span>
                      <span className="text-sm text-foreground truncate">{trip.name}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-muted-foreground">{formatMonthYear(trip.date)}</span>
                      <span className="text-sm font-bold text-foreground">${trip.spending.toLocaleString()}</span>
                    </div>
                  </div>) : <div className="text-center py-8 text-muted-foreground text-sm">
                  No trip spending data yet
                </div>}
            </div>
          </CardContent>
        </Card>

        {/* Stats Table */}
        <Card className="bright-card hidden md:block">
          <CardContent className="p-3">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="font-mono-label">Total Trips</span>
                <span className="font-display font-semibold text-foreground text-2xl">{userStats.totalTrips}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="font-mono-label">Cities Visited</span>
                <span className="font-display font-semibold text-foreground text-2xl">{userStats.citiesVisited}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="font-mono-label">Flights YTD</span>
                <span className="font-display font-semibold text-foreground text-2xl">{Number(userStats.flightsThisYear)}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="font-mono-label">Upcoming Trips</span>
                <span className="font-display font-semibold text-foreground text-2xl">
                  {(activeItineraries || []).filter(trip => trip.itin_date_start && new Date(trip.itin_date_start) > new Date()).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono-label">Traveler Level</span>
                <span className="text-xs font-semibold text-foreground bg-secondary px-2.5 py-1 rounded-full">
                  {userStats.travelerLevel}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Card>;
};
