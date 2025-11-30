import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Invitation {
  id: string;
  itinerary_id: number;
  invited_by: string;
  invite_method: string;
  invite_value: string;
  status: string;
  created_at: string;
  itinerary?: {
    itin_name: string;
    itin_date_start: string;
    itin_date_end: string;
  };
  inviter?: {
    first_name: string | null;
    last_name: string | null;
    username: string | null;
  };
}

export const useInvitations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [receivedInvitations, setReceivedInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvitations = async () => {
    if (!user) return;

    // Get user info to match against invitations
    const { data: userData } = await supabase
      .from('users')
      .select('email, username, cell')
      .eq('userid', user.id)
      .single();

    if (!userData) return;

    // Build filter for invitations sent to this user
    const filters = [];
    if (userData.email) filters.push(userData.email);
    if (userData.username) filters.push(userData.username);
    if (userData.cell) filters.push(userData.cell.toString());

    const { data, error } = await supabase
      .from('itinerary_invitations')
      .select(`
        *,
        itinerary(itin_name, itin_date_start, itin_date_end)
      `)
      .in('invite_value', filters)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invitations:', error);
      return;
    }

    // Fetch inviter details
    const invitationsWithInviters = await Promise.all(
      (data || []).map(async (inv) => {
        const { data: inviter } = await supabase
          .from('users')
          .select('first_name, last_name, username')
          .eq('userid', inv.invited_by)
          .single();

        return { ...inv, inviter };
      })
    );

    setReceivedInvitations(invitationsWithInviters);
    setLoading(false);
  };

  const acceptInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase.functions.invoke('accept-invitation', {
        body: {
          invitation_id: invitationId,
          accept: true,
        },
      });

      if (error) throw error;

      toast({
        title: 'Invitation accepted',
        description: 'You have joined the trip!',
      });

      fetchInvitations();
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept invitation',
        variant: 'destructive',
      });
    }
  };

  const declineInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase.functions.invoke('accept-invitation', {
        body: {
          invitation_id: invitationId,
          accept: false,
        },
      });

      if (error) throw error;

      toast({
        title: 'Invitation declined',
        description: 'You have declined the invitation',
      });

      fetchInvitations();
    } catch (error) {
      console.error('Error declining invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to decline invitation',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [user]);

  return {
    receivedInvitations,
    loading,
    acceptInvitation,
    declineInvitation,
    refresh: fetchInvitations,
  };
};