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
      <BudgetPieChart 
        itineraryId={itineraryData.id} 
        totalBudget={itineraryData.budget}
        totalSpent={itineraryData.spending}
        refreshTrigger={refreshTrigger} 
      />

      {/* AI Recommendations */}
      <Card className="bg-card/80 border-border backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-foreground">AI Recommendations</CardTitle>
          <CardDescription className="text-muted-foreground">
            Personalized suggestions for your trip
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-muted rounded-lg border border-border">
            <p className="text-sm font-medium text-foreground">🏨 Best Time to Book</p>
            <p className="text-sm text-muted-foreground mt-1">
              Book your hotels 2-3 weeks before travel for optimal rates in Europe.
            </p>
          </div>
          <div className="p-3 bg-muted rounded-lg border border-border">
            <p className="text-sm font-medium text-foreground">🍽️ Local Cuisine</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try paella in Barcelona, pasta in Rome, and croissants in Paris.
            </p>
          </div>
          <div className="p-3 bg-muted rounded-lg border border-border">
            <p className="text-sm font-medium text-foreground">🚇 Transportation</p>
            <p className="text-sm text-muted-foreground mt-1">
              Consider getting a Eurail pass for convenient travel between cities.
            </p>
          </div>
          <div className="p-3 bg-muted rounded-lg border border-border">
            <p className="text-sm font-medium text-foreground">💰 Budget Tips</p>
            <p className="text-sm text-muted-foreground mt-1">
              Restaurant reservations estimated at $65/person. Adjust in budget overview if needed.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};