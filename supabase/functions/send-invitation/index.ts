import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

class InvitationRequestError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

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
      throw new InvitationRequestError('Please sign in before inviting travelers.', 'unauthorized', 401);
    }

    const { itinerary_id, method, value } = await req.json();
    if (!itinerary_id || !method || !value) {
      throw new InvitationRequestError('Trip, invitation method, and recipient are required.', 'invalid_request');
    }
    if (!['email', 'username', 'sms'].includes(method)) {
      throw new InvitationRequestError('Choose email, username, or SMS as the invitation method.', 'invalid_method');
    }

    const normalizedValue = value.toLowerCase().trim();

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabaseAdmin
      .from('itinerary_invitations')
      .update({ status: 'expired', responded_at: new Date().toISOString() })
      .eq('itinerary_id', itinerary_id)
      .eq('status', 'pending')
      .lte('expires_at', new Date().toISOString());

    // Only owners can invite
    const { data: senderAttendee } = await supabaseAdmin
      .from('itinerary_attendees')
      .select('role')
      .eq('itinerary_id', itinerary_id)
      .eq('user_id', user.id)
      .eq('status', 'accepted')
      .single();

    if (!senderAttendee || senderAttendee.role !== 'owner') {
      throw new InvitationRequestError('Only the trip owner can send invitations.', 'owner_required', 403);
    }

    // Check if target is already an attendee
    let recipientId: string | null = null;
    if (method === 'email') {
      const { data: recipient } = await supabaseAdmin
        .from('users')
        .select('userid')
        .ilike('email', normalizedValue)
        .single();
      recipientId = recipient?.userid ?? null;
    } else if (method === 'username') {
      const { data: recipient } = await supabaseAdmin
        .from('users')
        .select('userid')
        .ilike('username', normalizedValue)
        .single();
      recipientId = recipient?.userid ?? null;
    }

    if (recipientId) {
      // Check if already an attendee
      const { data: existingAttendee } = await supabaseAdmin
        .from('itinerary_attendees')
        .select('id')
        .eq('itinerary_id', itinerary_id)
        .eq('user_id', recipientId)
        .single();

      if (existingAttendee) {
        throw new InvitationRequestError('This person is already a collaborator on this trip.', 'already_member', 409);
      }
    }

    // Check for existing pending invitation
    const { data: existingInvite } = await supabaseAdmin
      .from('itinerary_invitations')
      .select('id')
      .eq('itinerary_id', itinerary_id)
      .ilike('invite_value', normalizedValue)
      .eq('status', 'pending')
      .single();

    if (existingInvite) {
      throw new InvitationRequestError('A pending invitation already exists for this recipient.', 'already_pending', 409);
    }

    // Get itinerary details
    const { data: itinerary } = await supabaseAdmin
      .from('itinerary')
      .select('itin_name')
      .eq('id', itinerary_id)
      .single();

    const { data: inviter } = await supabaseAdmin
      .from('users')
      .select('first_name, last_name, username')
      .eq('userid', user.id)
      .single();

    const inviterName = inviter?.first_name
      ? `${inviter.first_name} ${inviter.last_name || ''}`.trim()
      : inviter?.username || 'Trip owner';

    const deliveryStatus = recipientId ? 'in_app' : 'record_only';

    // Create invitation with normalized value and truthful delivery metadata.
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('itinerary_invitations')
      .insert({
        itinerary_id,
        invited_by: user.id,
        invite_method: method,
        invite_value: normalizedValue,
        inviter_display_name: inviterName,
        delivery_status: deliveryStatus,
      })
      .select()
      .single();

    if (inviteError?.code === '23505') {
      throw new InvitationRequestError('A pending invitation already exists for this recipient.', 'already_pending', 409);
    }
    if (inviteError) throw inviteError;

    // Create notification for recipient if they exist in the system
    if (recipientId) {
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: recipientId,
          type: 'invite_received',
          reference_type: 'itinerary_invitation',
          reference_id: invitation.id,
          title: 'Trip Invitation',
          message: `${inviterName} invited you to join "${itinerary?.itin_name || 'a trip'}"`,
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        invitation,
        delivery_status: deliveryStatus,
        delivery_message: recipientId
          ? 'The recipient can review this invitation in TAAI.'
          : 'The invitation was recorded, but external email delivery is not configured.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending invitation:', error);
    const knownError = error instanceof InvitationRequestError;
    return new Response(
      JSON.stringify({
        error: knownError ? error.message : 'Unable to create the invitation. Please try again.',
        code: knownError ? error.code : 'invitation_failed',
      }),
      { status: knownError ? error.status : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
