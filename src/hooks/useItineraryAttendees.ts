import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface ParticipantProfile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  avatar_url: string | null;
  role: string;
}

interface Attendee {
  id: string;
  user_id: string;
  role: 'owner' | 'collaborator';
  status: 'accepted' | 'pending';
  joined_at: string;
  profile?: ParticipantProfile;
}

export interface PendingItineraryInvitation {
  id: string;
  invite_method: string;
  invite_value: string;
  status: string;
  delivery_status: string;
  created_at: string;
  expires_at: string | null;
}

const getFunctionErrorMessage = async (error: any, fallback: string) => {
  try {
    const context = error?.context;
    if (context && typeof context.json === 'function') {
      const body = await context.json();
      if (body?.error) return body.error as string;
    }
  } catch {
    // Fall through to the SDK message.
  }
  return error?.message || fallback;
};

export const useItineraryAttendees = (itineraryId: number | null) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingItineraryInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingInvitations = async () => {
    if (!itineraryId || !user) {
      setPendingInvitations([]);
      return;
    }

    const { data, error } = await supabase
      .from('itinerary_invitations')
      .select('id, invite_method, invite_value, status, delivery_status, created_at, expires_at')
      .eq('itinerary_id', itineraryId)
      .eq('invited_by', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending invitations:', error);
      return;
    }
    setPendingInvitations((data || []) as PendingItineraryInvitation[]);
  };

  const fetchAttendees = async () => {
    if (!itineraryId) return;

    try {
      // Fetch attendee records
      const { data, error } = await supabase
        .from('itinerary_attendees')
        .select('*')
        .eq('itinerary_id', itineraryId)
        .order('joined_at', { ascending: true });

      if (error) {
        console.error('Error fetching attendees:', error);
        return;
      }

      // Use the safe RPC to get participant profiles
      const { data: profiles } = await supabase.rpc('get_itinerary_participant_profiles', {
        p_itinerary_id: itineraryId
      });

      const profileMap = new Map<string, ParticipantProfile>();
      (profiles || []).forEach((p: ParticipantProfile) => {
        profileMap.set(p.user_id, p);
      });

      const attendeesWithProfiles = (data || []).map((attendee) => ({
        ...attendee,
        profile: profileMap.get(attendee.user_id),
      }));

      setAttendees(attendeesWithProfiles as Attendee[]);
    } finally {
      setLoading(false);
    }
  };

  const isOwner = attendees.some(a => a.user_id === user?.id && a.role === 'owner');

  const inviteAttendee = async (method: string, value: string, role: string = 'collaborator') => {
    try {
      const { data, error } = await supabase.functions.invoke('send-invitation', {
        body: {
          itinerary_id: itineraryId,
          method,
          value,
          role,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: 'Invitation created',
        description: data?.delivery_message || `Invitation created for ${value}`,
      });

      await fetchPendingInvitations();

      return data;
    } catch (error: any) {
      console.error('Error inviting attendee:', error);
      const description = await getFunctionErrorMessage(error, 'Failed to create invitation');
      toast({
        title: 'Error',
        description,
        variant: 'destructive',
      });
      throw new Error(description);
    }
  };

  const revokeInvitation = async (invitationId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-invitation', {
        body: { invitation_id: invitationId, action: 'revoke' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({
        title: 'Invitation revoked',
        description: 'The recipient can no longer accept this invitation.',
      });
      await fetchPendingInvitations();
    } catch (error: any) {
      const description = await getFunctionErrorMessage(error, 'Failed to revoke invitation');
      toast({ title: 'Error', description, variant: 'destructive' });
      throw new Error(description);
    }
  };

  const updateAttendeeRole = async (attendeeId: string, newRole: string) => {
    const { error } = await supabase
      .from('itinerary_attendees')
      .update({ role: newRole })
      .eq('id', attendeeId);

    if (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update role',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Role updated',
      description: 'Attendee role has been updated',
    });

    fetchAttendees();
  };

  const removeAttendee = async (attendeeId: string) => {
    const { error } = await supabase
      .from('itinerary_attendees')
      .delete()
      .eq('id', attendeeId);

    if (error) {
      console.error('Error removing attendee:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove attendee',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Attendee removed',
      description: 'Attendee has been removed from the trip',
    });

    fetchAttendees();
  };

  useEffect(() => {
    fetchAttendees();
    fetchPendingInvitations();

    // Set up realtime subscription
    const channel = supabase
      .channel('itinerary-attendees')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'itinerary_attendees',
          filter: `itinerary_id=eq.${itineraryId}`
        },
        () => {
          fetchAttendees();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [itineraryId]);

  return {
    attendees,
    pendingInvitations,
    loading,
    isOwner,
    inviteAttendee,
    revokeInvitation,
    updateAttendeeRole,
    removeAttendee,
    refresh: fetchAttendees,
  };
};
