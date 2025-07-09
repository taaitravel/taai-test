import { Card, CardContent } from "@/components/ui/card";
import { Plane, Map, BarChart3, Star } from "lucide-react";

export const TravelActions = () => {
  const actions = [
    {
      icon: Plane,
      title: "Book Flight",
      description: "Find deals"
    },
    {
      icon: Map,
      title: "Explore",
      description: "Destinations"
    },
    {
      icon: BarChart3,
      title: "Budget",
      description: "Analysis"
    },
    {
      icon: Star,
      title: "Reviews",
      description: "Rate trips"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      {actions.map((action, index) => (
        <Card 
          key={index}
          className="hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 cursor-pointer bg-[#171821]/80 backdrop-blur-md border-white/30 group"
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-full group-hover:scale-105 transition-transform duration-300">
                <action.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">{action.title}</h3>
                <p className="text-xs text-white/70">{action.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};