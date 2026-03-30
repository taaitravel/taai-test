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
    // Authenticated client for user identity
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
    if (!invitation_id) throw new Error('invitation_id is required');

    // Use admin client for all writes to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get invitation details
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('itinerary_invitations')
      .select('*, itinerary(itin_name)')
      .eq('id', invitation_id)
      .single();

    if (inviteError || !invitation) {
      throw new Error('Invitation not found');
    }

    // Validate invitation is still pending
    if (invitation.status !== 'pending') {
      throw new Error(`Invitation already ${invitation.status}`);
    }

    // Validate the current user matches the invite target
    const { data: currentUser } = await supabaseAdmin
      .from('users')
      .select('email, username, cell, first_name, last_name')
      .eq('userid', user.id)
      .single();

    if (!currentUser) throw new Error('User profile not found');

    const normalizedInviteValue = invitation.invite_value?.toLowerCase().trim();
    const userEmail = currentUser.email?.toLowerCase().trim();
    const userUsername = currentUser.username?.toLowerCase().trim();
    const userCell = currentUser.cell?.toString();

    const isRecipient = 
      (invitation.invite_method === 'email' && userEmail === normalizedInviteValue) ||
      (invitation.invite_method === 'username' && userUsername === normalizedInviteValue) ||
      (invitation.invite_method === 'sms' && userCell === normalizedInviteValue);

    if (!isRecipient) {
      throw new Error('This invitation was not sent to you');
    }

    if (!accept) {
      // Decline: just update status
      const { error: declineError } = await supabaseAdmin
        .from('itinerary_invitations')
        .update({ status: 'declined' })
        .eq('id', invitation_id);

      if (declineError) throw declineError;

      return new Response(
        JSON.stringify({ success: true, status: 'declined' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Accept flow: insert attendee FIRST, then mark invitation
    const { error: attendeeError } = await supabaseAdmin
      .from('itinerary_attendees')
      .insert({
        itinerary_id: invitation.itinerary_id,
        user_id: user.id,
        role: 'collaborator',
        status: 'accepted',
        invited_by: invitation.invited_by,
      });

    if (attendeeError) {
      // If duplicate, that's OK — user is already an attendee
      if (!attendeeError.message?.includes('duplicate') && !attendeeError.message?.includes('unique')) {
        console.error('Failed to create attendee:', attendeeError);
        throw new Error('Failed to join trip: ' + attendeeError.message);
      }
    }

    // Now mark invitation as accepted
    const { error: updateError } = await supabaseAdmin
      .from('itinerary_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation_id);

    if (updateError) {
      console.error('Failed to update invitation status:', updateError);
    }

    // Chat participant is auto-created by trigger on itinerary_attendees insert
    // But ensure it exists as a safety net
    await supabaseAdmin
      .from('itinerary_chat_participants')
      .insert({
        itinerary_id: invitation.itinerary_id,
        user_id: user.id,
      })
      .then(() => {}) // ignore duplicate errors
      .catch(() => {});

    // Create notification for inviter
    const userName = currentUser.first_name
      ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim()
      : currentUser.username || 'Someone';

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

    return new Response(
      JSON.stringify({ 
        success: true, 
        status: 'accepted',
        itinerary_id: invitation.itinerary_id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing invitation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
