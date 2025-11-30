import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { invitation_id, accept } = await req.json();

    // Get invitation details
    const { data: invitation, error: inviteError } = await supabaseClient
      .from('itinerary_invitations')
      .select('*, itinerary(itin_name)')
      .eq('id', invitation_id)
      .single();

    if (inviteError) throw inviteError;

    // Update invitation status
    const newStatus = accept ? 'accepted' : 'declined';
    await supabaseClient
      .from('itinerary_invitations')
      .update({ status: newStatus })
      .eq('id', invitation_id);

    // If accepted, create attendee record
    if (accept) {
      await supabaseClient
        .from('itinerary_attendees')
        .insert({
          itinerary_id: invitation.itinerary_id,
          user_id: user.id,
          role: 'viewer',
          status: 'accepted',
          invited_by: invitation.invited_by,
        });

      // Create notification for inviter
      const { data: currentUser } = await supabaseClient
        .from('users')
        .select('first_name, last_name, username')
        .eq('userid', user.id)
        .single();

      const userName = currentUser?.first_name 
        ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim()
        : currentUser?.username || 'Someone';

      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: invitation.invited_by,
          type: 'invite_accepted',
          reference_type: 'itinerary',
          reference_id: invitation.itinerary_id.toString(),
          title: 'Invitation Accepted',
          message: `${userName} accepted your invitation to join "${invitation.itinerary?.itin_name || 'the trip'}"`,
        });
    }

    return new Response(
      JSON.stringify({ success: true, status: newStatus }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});