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
  return <Card className="border-border hover:shadow-xl hover:shadow-foreground/5 transition-all duration-300 bg-card/80 backdrop-blur-md p-5">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-bold text-foreground">Travel Metrics</h2>
        <Button size="sm" className="gold-gradient hover:opacity-90 text-background font-semibold">
          View Metrics
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        {/* Flight Progress Indicator */}
        <Card className="border-border bg-secondary backdrop-blur-sm">
          <CardContent className="p-4 min-h-[250px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Flight Progress</p>
                <p className="text-xs text-muted-foreground">Track your journey to the next level</p>
              </div>
            </div>
            <div className="flex justify-center">
              <FlightProgressIndicator currentFlights={Number(userStats.flightsThisYear)} currentLevel={userStats.travelerLevel} />
            </div>
          </CardContent>
        </Card>

        {/* Countries Map */}
        <Card className="border-border bg-secondary backdrop-blur-sm">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Countries Visited</p>
                <p className="font-bold text-foreground text-4xl">{visitedCountries.length}</p>
              </div>
              <Map className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="h-[250px]">
              <CountriesMap visitedCountries={visitedCountries} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Top Spending Trips */}
        <Card className="border-border bg-secondary backdrop-blur-sm">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-foreground/60 mb-1">Projected Spend</p>
                <p className="text-foreground font-sans font-bold text-4xl">${userStats.projectedSpend.toLocaleString()}</p>
              </div>
              <BarChart3 className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              {rankedTrips.length > 0 ? rankedTrips.map((trip, index) => <div key={index} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted hover:bg-accent transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-xs font-bold text-muted-foreground w-4">#{index + 1}</span>
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
        <Card className="border-border bg-secondary backdrop-blur-sm hidden md:block">
          <CardContent className="p-3">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border rounded-2xl">
                <span className="text-sm text-muted-foreground">Total Trips</span>
                <span className="font-bold text-foreground text-2xl">{userStats.totalTrips}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="text-sm text-muted-foreground">Cities Visited</span>
                <span className="text-foreground font-bold text-2xl">{userStats.citiesVisited}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="text-sm text-muted-foreground">Flights YTD</span>
                <span className="font-bold text-foreground text-2xl">{Number(userStats.flightsThisYear)}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="text-sm text-muted-foreground">Upcoming Trips</span>
                <span className="font-bold text-foreground text-2xl">
                  {(activeItineraries || []).filter(trip => trip.itin_date_start && new Date(trip.itin_date_start) > new Date()).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Traveler Level</span>
                <span className="text-sm font-bold text-foreground bg-muted px-2 py-1 rounded">
                  {userStats.travelerLevel}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Card>;
};
