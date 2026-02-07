import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserMinus, Shield, Eye, Edit, Users } from "lucide-react";
import { useItineraryAttendees } from "@/hooks/useItineraryAttendees";
import { InviteAttendeesDialog } from "./InviteAttendeesDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AttendeesSectionProps {
  itineraryId: number;
}

export const AttendeesSection = ({ itineraryId }: AttendeesSectionProps) => {
  const { attendees, loading, updateAttendeeRole, removeAttendee } = useItineraryAttendees(itineraryId);

  if (loading) {
    return null;
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Shield className="h-4 w-4" />;
      case 'editor':
        return <Edit className="h-4 w-4" />;
      case 'viewer':
        return <Eye className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'editor':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'viewer':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return '';
    }
  };

  return (
    <Card className="bg-card/80 border-border backdrop-blur-md mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground flex items-center space-x-2">
            <Users className="h-5 w-5 text-foreground" />
            <span>Trip Attendees ({attendees.length})</span>
          </CardTitle>
          <InviteAttendeesDialog itineraryId={itineraryId} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {attendees.map((attendee) => {
            const isOwner = attendee.role === 'owner';
            const userName = attendee.users?.first_name
              ? `${attendee.users.first_name} ${attendee.users.last_name || ''}`.trim()
              : attendee.users?.username || attendee.users?.email || 'Unknown';

            return (
              <div
                key={attendee.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border hover:bg-accent transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {userName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{userName}</p>
                    <p className="text-xs text-muted-foreground truncate">{attendee.users?.email || ''}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge className={`gap-1 text-xs px-2 py-0.5 ${getRoleBadgeColor(attendee.role)}`}>
                    {getRoleIcon(attendee.role)}
                    {attendee.role}
                  </Badge>

                  {attendee.status === 'pending' && (
                    <Badge variant="secondary" className="bg-muted text-foreground text-xs px-2 py-0.5">
                      Pending
                    </Badge>
                  )}

                  {!isOwner && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-foreground">
                          •••
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border-border">
                        {attendee.role !== 'editor' && (
                          <DropdownMenuItem 
                            onClick={() => updateAttendeeRole(attendee.id, 'editor')}
                            className="text-foreground hover:bg-accent cursor-pointer"
                          >
                            Make Editor
                          </DropdownMenuItem>
                        )}
                        {attendee.role !== 'viewer' && (
                          <DropdownMenuItem 
                            onClick={() => updateAttendeeRole(attendee.id, 'viewer')}
                            className="text-foreground hover:bg-accent cursor-pointer"
                          >
                            Make Viewer
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => removeAttendee(attendee.id)}
                          className="text-destructive hover:bg-accent cursor-pointer"
                        >
                          <UserMinus className="h-4 w-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};