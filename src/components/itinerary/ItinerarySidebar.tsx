import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetPieChart } from "./BudgetPieChart";

interface ItineraryData {
  id: number;
  flights?: any[];
  hotels?: any[];
  activities?: any[];
  budget: number;
  spending?: number;
  budget_rate: number;
}

interface ItinerarySidebarProps {
  itineraryData: ItineraryData;
  refreshTrigger?: number;
}

export const ItinerarySidebar = ({ itineraryData, refreshTrigger }: ItinerarySidebarProps) => {
  return (
    <div className="space-y-6">
      {/* Budget Pie Chart */}
      <BudgetPieChart itineraryId={itineraryData.id} refreshTrigger={refreshTrigger} />

      {/* AI Recommendations */}
      <Card className="bg-[#171821]/80 border-white/30 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-white">AI Recommendations</CardTitle>
          <CardDescription className="text-white/70">
            Personalized suggestions for your trip
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-white/10 rounded-lg border border-white/20">
            <p className="text-sm font-medium text-white">🏨 Best Time to Book</p>
            <p className="text-sm text-white/70 mt-1">
              Book your hotels 2-3 weeks before travel for optimal rates in Europe.
            </p>
          </div>
          <div className="p-3 bg-white/10 rounded-lg border border-white/20">
            <p className="text-sm font-medium text-white">🍽️ Local Cuisine</p>
            <p className="text-sm text-white/70 mt-1">
              Try paella in Barcelona, pasta in Rome, and croissants in Paris.
            </p>
          </div>
          <div className="p-3 bg-white/10 rounded-lg border border-white/20">
            <p className="text-sm font-medium text-white">🚇 Transportation</p>
            <p className="text-sm text-white/70 mt-1">
              Consider getting a Eurail pass for convenient travel between cities.
            </p>
          </div>
          <div className="p-3 bg-white/10 rounded-lg border border-white/20">
            <p className="text-sm font-medium text-white">💰 Budget Tips</p>
            <p className="text-sm text-white/70 mt-1">
              Restaurant reservations estimated at $65/person. Adjust in budget overview if needed.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};