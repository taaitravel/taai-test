import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
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
}

export const ItinerarySidebar = ({ itineraryData }: ItinerarySidebarProps) => {
  return (
    <div className="space-y-6">
      {/* Budget Pie Chart */}
      <BudgetPieChart itineraryId={itineraryData.id} />

      {/* Budget Breakdown */}
      <Card className="bg-[#171821]/80 border-white/30 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-white" />
            <span>Budget Breakdown</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-white/70">Flights</span>
              <span className="text-white font-medium">
                ${itineraryData.flights ? itineraryData.flights.reduce((sum, flight) => sum + flight.cost, 0).toLocaleString() : '0'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/70">Accommodation</span>
              <span className="text-white font-medium">
                ${itineraryData.hotels ? itineraryData.hotels.reduce((sum, hotel) => sum + hotel.cost, 0).toLocaleString() : '0'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/70">Activities</span>
              <span className="text-white font-medium">
                ${itineraryData.activities ? itineraryData.activities.reduce((sum, activity) => sum + activity.cost, 0).toLocaleString() : '0'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/70">Budget Efficiency</span>
              <span className="text-white font-medium">{Math.round(itineraryData.budget_rate * 100)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/70">Spending vs Budget</span>
              <span className="text-white font-medium">${itineraryData.spending ? itineraryData.spending.toLocaleString() : '0'}</span>
            </div>
            <hr className="border-white/20" />
            <div className="flex justify-between font-semibold">
              <span className="text-white">Total Budget</span>
              <span className="text-white">${Number(itineraryData.budget).toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

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
        </CardContent>
      </Card>
    </div>
  );
};