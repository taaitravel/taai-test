import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, UserPlus } from "lucide-react";

interface Attendee {
  id: number;
  name: string;
  email: string;
  avatar: string;
  status: string;
}

interface AttendeesSectionProps {
  attendees?: Attendee[];
}

export const AttendeesSection = ({ attendees }: AttendeesSectionProps) => {
  if (!attendees || attendees.length === 0) return null;

  return (
    <Card className="bg-[#171821]/80 border-white/30 backdrop-blur-md mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center space-x-2">
            <Users className="h-5 w-5 text-white" />
            <span>Trip Attendees</span>
          </CardTitle>
          <Button 
            size="sm" 
            className="gold-gradient hover:opacity-90 text-[#171821] font-semibold text-xs px-3 py-1 h-8"
            onClick={() => console.log('Invite more people')}
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Invite
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {attendees.map((attendee) => (
            <div key={attendee.id} className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg border border-white/20 hover:bg-white/15 transition-colors">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-sm font-medium">
                {attendee.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{attendee.name}</p>
                <p className="text-xs text-white/60 truncate">{attendee.email}</p>
              </div>
              <Badge className={`text-xs px-2 py-0.5 shrink-0 ${attendee.status === 'confirmed' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-white/20 text-white border-white/30'}`}>
                {attendee.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
