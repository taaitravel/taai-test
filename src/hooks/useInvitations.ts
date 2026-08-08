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
  inviter_display_name?: string | null;
  delivery_status?: string;
  status: string;
  created_at: string;
  itinerary?: {
    itin_name: string;
    itin_date_start: string;
    itin_date_end: string;
  };
}

const getFunctionErrorMessage = async (error: any, fallback: string) => {
  try {
    if (error?.context && typeof error.context.json === 'function') {
      const body = await error.context.json();
      if (body?.error) return body.error as string;
    }
  } catch {
    // Use the SDK message below when the response body is unavailable.
  }
  return error?.message || fallback;
};

export const useInvitations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [receivedInvitations, setReceivedInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvitations = async () => {
    if (!user) return;

    try {
      // Get user info to match against invitations (case-insensitive)
      const { data: userData } = await supabase
        .from('users')
        .select('email, username, cell')
        .eq('userid', user.id)
        .single();

      if (!userData) return;

      // Build filter for invitations sent to this user (normalized/lowercase)
      const filters: string[] = [];
      if (userData.email) filters.push(userData.email.toLowerCase().trim());
      if (userData.username) filters.push(userData.username.toLowerCase().trim());
      if (userData.cell) filters.push(userData.cell.toString());

      if (filters.length === 0) return;

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

      setReceivedInvitations((data || []) as Invitation[]);
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async (invitationId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('accept-invitation', {
        body: {
          invitation_id: invitationId,
          accept: true,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: 'Invitation accepted!',
        description: 'You have joined the trip. It will now appear in your shared itineraries.',
      });

      fetchInvitations();
      
      // Return the itinerary_id so the UI can navigate
      return data?.itinerary_id;
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      const description = await getFunctionErrorMessage(error, 'Failed to accept invitation');
      toast({
        title: 'Error',
        description,
        variant: 'destructive',
      });
      return null;
    }
  };

  const declineInvitation = async (invitationId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('accept-invitation', {
        body: {
          invitation_id: invitationId,
          accept: false,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: 'Invitation declined',
        description: 'You have declined the invitation',
      });

      fetchInvitations();
    } catch (error: any) {
      console.error('Error declining invitation:', error);
      const description = await getFunctionErrorMessage(error, 'Failed to decline invitation');
      toast({
        title: 'Error',
        description,
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
