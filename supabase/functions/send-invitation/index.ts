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

    const { itinerary_id, method, value, role = 'collaborator' } = await req.json();
    if (!itinerary_id || !method || !value) {
      throw new Error('itinerary_id, method, and value are required');
    }

    const normalizedValue = value.toLowerCase().trim();

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Only owners can invite
    const { data: senderAttendee } = await supabaseAdmin
      .from('itinerary_attendees')
      .select('role')
      .eq('itinerary_id', itinerary_id)
      .eq('user_id', user.id)
      .eq('status', 'accepted')
      .single();

    if (!senderAttendee || senderAttendee.role !== 'owner') {
      throw new Error('Only the trip owner can send invitations');
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
        throw new Error('This user is already a member of this trip');
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
      throw new Error('A pending invitation already exists for this user');
    }

    // Get itinerary details
    const { data: itinerary } = await supabaseAdmin
      .from('itinerary')
      .select('itin_name')
      .eq('id', itinerary_id)
      .single();

    // Create invitation with normalized value
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('itinerary_invitations')
      .insert({
        itinerary_id,
        invited_by: user.id,
        invite_method: method,
        invite_value: normalizedValue,
      })
      .select()
      .single();

    if (inviteError) throw inviteError;

    // Create notification for recipient if they exist in the system
    if (recipientId) {
      const { data: inviter } = await supabaseAdmin
        .from('users')
        .select('first_name, last_name, username')
        .eq('userid', user.id)
        .single();

      const inviterName = inviter?.first_name 
        ? `${inviter.first_name} ${inviter.last_name || ''}`.trim()
        : inviter?.username || 'Someone';

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
      JSON.stringify({ success: true, invitation }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending invitation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
