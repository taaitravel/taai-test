import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useInvitations } from '@/hooks/useInvitations';
import { format } from 'date-fns';
import { Calendar, Check, X } from 'lucide-react';

export const PendingInvitationsCard = () => {
  const { receivedInvitations, loading, acceptInvitation, declineInvitation } = useInvitations();

  if (loading || receivedInvitations.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          Trip Invitations
          <Badge variant="destructive" className="ml-2">
            {receivedInvitations.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {receivedInvitations.map((invitation) => {
          const inviterName = invitation.inviter?.first_name
            ? `${invitation.inviter.first_name} ${invitation.inviter.last_name || ''}`.trim()
            : invitation.inviter?.username || 'Someone';

          return (
            <div
              key={invitation.id}
              className="p-4 rounded-lg bg-secondary border border-border space-y-3"
            >
              <div>
                <p className="text-foreground font-semibold">
                  {invitation.itinerary?.itin_name || 'Trip Invitation'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {inviterName} invited you to join this trip
                </p>
              </div>

              {invitation.itinerary && (
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {format(new Date(invitation.itinerary.itin_date_start), 'MMM d')} - 
                      {format(new Date(invitation.itinerary.itin_date_end), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => acceptInvitation(invitation.id)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => declineInvitation(invitation.id)}
                  className="flex-1 border-border text-foreground hover:bg-accent"
                >
                  <X className="h-4 w-4 mr-1" />
                  Decline
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
