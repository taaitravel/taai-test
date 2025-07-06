import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DailyScheduleSectionProps {
  startDate: string;
  duration: number;
  destinations: string[];
}

export const DailyScheduleSection = ({ startDate, duration, destinations }: DailyScheduleSectionProps) => {
  return (
    <div className="lg:col-span-2">
      <Card className="bg-[#171821]/80 border-white/30 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-white">Daily Schedule</CardTitle>
          <CardDescription className="text-white/70">
            Your day-by-day travel plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: duration }, (_, index) => {
              const currentDate = new Date(startDate);
              currentDate.setDate(currentDate.getDate() + index);
              const destination = destinations[index % destinations.length];
              
              return (
                <div key={index} className="border-l-2 border-white/30 pl-4 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-white">
                      Day {index + 1} - {currentDate.toLocaleDateString()}
                    </h4>
                    <Badge className="bg-white/20 text-white border-white/30">
                      {destination}
                    </Badge>
                  </div>
                  <div className="text-sm text-white/70 space-y-1">
                    <p>🏨 Check accommodation availability</p>
                    <p>✈️ Review flight details</p>
                    <p>🍽️ Explore local dining options</p>
                    <p>🎯 Discover activities and attractions</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};