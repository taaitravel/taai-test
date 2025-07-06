import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Users, UserPlus } from "lucide-react";

interface Attendee {
  id: number;
  name: string;
  email: string;
  avatar: string;
  status: string;
}

interface TripOverviewSectionProps {
  duration: number;
  budget: number;
  peopleCount: number;
  destinations: string[];
  description?: string;
  attendees?: Attendee[];
}

export const TripOverviewSection = ({ 
  duration, 
  budget, 
  peopleCount, 
  destinations, 
  description,
  attendees 
}: TripOverviewSectionProps) => {
  return (
    <div className="space-y-4">
      <Card className="bg-[#171821]/80 border-white/30 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-white" />
            <span>Trip Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div>
              <span className="text-white/70">Duration:</span>
              <p className="text-white font-medium">{duration} days</p>
            </div>
            <div>
              <span className="text-white/70">Budget per person:</span>
              <p className="text-white font-medium">${Math.round(budget / peopleCount).toLocaleString()}</p>
            </div>
          </div>
          
          <div>
            <span className="text-white/70 text-sm">Destinations:</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {destinations.map((destination, index) => (
                <Badge key={index} className="bg-white/20 text-white border-white/30 text-xs">
                  {destination}
                </Badge>
              ))}
            </div>
          </div>

          {description && (
            <div>
              <span className="text-white/70 text-sm">Description:</span>
              <p className="text-white mt-1 text-xs">{description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trip Attendees */}
      <Card className="bg-[#171821]/80 border-white/30 backdrop-blur-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center space-x-2">
              <Users className="h-5 w-5 text-white" />
              <span>Attendees</span>
            </CardTitle>
            <Button 
              size="sm" 
              className="gold-gradient hover:opacity-90 text-[#171821] font-semibold text-xs px-2 py-1 h-7"
              onClick={() => console.log('Invite more people')}
            >
              <UserPlus className="h-3 w-3 mr-1" />
              Invite
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {attendees && attendees.slice(0, 2).map((attendee) => (
            <div key={attendee.id} className="flex items-center space-x-2 p-2 bg-white/10 rounded-lg border border-white/20">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm">
                {attendee.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{attendee.name}</p>
                <p className="text-xs text-white/60 truncate">{attendee.email}</p>
              </div>
              <Badge className={`text-xs px-2 py-0.5 ${attendee.status === 'confirmed' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-white/20 text-white border-white/30'}`}>
                {attendee.status}
              </Badge>
            </div>
          ))}
          {attendees && attendees.length > 2 && (
            <div className="text-center pt-1">
              <span className="text-xs text-white/60">+{attendees.length - 2} more</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};