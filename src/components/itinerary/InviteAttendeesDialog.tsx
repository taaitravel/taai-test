import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Mail, MessageSquare, User } from 'lucide-react';
import { useItineraryAttendees } from '@/hooks/useItineraryAttendees';

interface InviteAttendeesDialogProps {
  itineraryId: number;
}

export const InviteAttendeesDialog = ({ itineraryId }: InviteAttendeesDialogProps) => {
  const { inviteAttendee } = useItineraryAttendees(itineraryId);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailValue, setEmailValue] = useState('');
  const [usernameValue, setUsernameValue] = useState('');

  const handleEmailInvite = async () => {
    if (!emailValue.trim()) return;
    setLoading(true);
    try {
      await inviteAttendee('email', emailValue);
      setEmailValue('');
      setOpen(false);
    } catch (error) {
      console.error('Error sending email invite:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameInvite = async () => {
    if (!usernameValue.trim()) return;
    setLoading(true);
    try {
      await inviteAttendee('username', usernameValue);
      setUsernameValue('');
      setOpen(false);
    } catch (error) {
      console.error('Error sending username invite:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Invite
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite to Trip</DialogTitle>
          <DialogDescription>
            Invite friends to collaborate on this trip
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="email" className="gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="username" className="gap-2">
              <User className="h-4 w-4" />
              Username
            </TabsTrigger>
            <TabsTrigger value="sms" className="gap-2" disabled>
              <MessageSquare className="h-4 w-4" />
              SMS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="friend@example.com"
                value={emailValue}
                onChange={(e) => setEmailValue(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleEmailInvite} 
              disabled={loading || !emailValue.trim()}
              className="w-full"
            >
              Send Invitation
            </Button>
          </TabsContent>

          <TabsContent value="username" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="username"
                value={usernameValue}
                onChange={(e) => setUsernameValue(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleUsernameInvite} 
              disabled={loading || !usernameValue.trim()}
              className="w-full"
            >
              Send Invitation
            </Button>
          </TabsContent>

          <TabsContent value="sms" className="space-y-4 mt-4">
            <div className="text-center py-8 text-muted-foreground">
              SMS invitations coming soon
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};