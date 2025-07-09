import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

export const RecentActivity = () => {
  const activities = [
    {
      action: "Updated Singapore trip budget",
      time: "2h ago"
    },
    {
      action: "Added hotel to Europe trip",
      time: "1d ago"
    },
    {
      action: "Created new itinerary",
      time: "3d ago"
    }
  ];

  return (
    <Card className="bg-[#171821]/80 backdrop-blur-md border-white/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-white">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-center space-x-3 text-sm">
              <Clock className="h-4 w-4 text-white/70" />
              <span className="text-white/70">{activity.action}</span>
              <span className="text-white/50">{activity.time}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};