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

    const { itinerary_id, method, value, role = 'viewer' } = await req.json();

    // Check if user is an attendee of the itinerary
    const { data: attendee } = await supabaseClient
      .from('itinerary_attendees')
      .select('role')
      .eq('itinerary_id', itinerary_id)
      .eq('user_id', user.id)
      .eq('status', 'accepted')
      .single();

    if (!attendee) {
      throw new Error('Not authorized to invite to this itinerary');
    }

    // Get itinerary details
    const { data: itinerary } = await supabaseClient
      .from('itinerary')
      .select('itin_name, itin_date_start, itin_date_end')
      .eq('id', itinerary_id)
      .single();

    // Create invitation
    const { data: invitation, error: inviteError } = await supabaseClient
      .from('itinerary_invitations')
      .insert({
        itinerary_id,
        invited_by: user.id,
        invite_method: method,
        invite_value: value,
      })
      .select()
      .single();

    if (inviteError) throw inviteError;

    // Try to find user by value and create notification
    let recipientId = null;
    if (method === 'email') {
      const { data: recipient } = await supabaseClient
        .from('users')
        .select('userid')
        .eq('email', value)
        .single();
      recipientId = recipient?.userid;
    } else if (method === 'username') {
      const { data: recipient } = await supabaseClient
        .from('users')
        .select('userid')
        .eq('username', value)
        .single();
      recipientId = recipient?.userid;
    }

    // Create notification for recipient if they exist
    if (recipientId) {
      const { data: inviter } = await supabaseClient
        .from('users')
        .select('first_name, last_name, username')
        .eq('userid', user.id)
        .single();

      const inviterName = inviter?.first_name 
        ? `${inviter.first_name} ${inviter.last_name || ''}`.trim()
        : inviter?.username || 'Someone';

      // Use service role for notification creation
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

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

    // TODO: Send email/SMS for external invitations
    // This would require Resend/Twilio integration

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