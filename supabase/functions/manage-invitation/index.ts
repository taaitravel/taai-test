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
    const authenticatedClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
    );
    const { data: { user } } = await authenticatedClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Please sign in first.', code: 'unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { invitation_id, action } = await req.json();
    if (!invitation_id || action !== 'revoke') {
      return new Response(JSON.stringify({ error: 'A valid invitation and action are required.', code: 'invalid_request' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: invitation } = await admin
      .from('itinerary_invitations')
      .select('id, itinerary_id, invited_by, status')
      .eq('id', invitation_id)
      .single();

    if (!invitation) {
      return new Response(JSON.stringify({ error: 'Invitation not found.', code: 'not_found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: owner } = await admin
      .from('itinerary_attendees')
      .select('id')
      .eq('itinerary_id', invitation.itinerary_id)
      .eq('user_id', user.id)
      .eq('role', 'owner')
      .eq('status', 'accepted')
      .single();

    if (!owner || invitation.invited_by !== user.id) {
      return new Response(JSON.stringify({ error: 'Only the owner who sent this invitation can revoke it.', code: 'owner_required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (invitation.status !== 'pending') {
      return new Response(JSON.stringify({ error: `This invitation is already ${invitation.status}.`, code: 'not_pending' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const now = new Date().toISOString();
    const { error: updateError } = await admin
      .from('itinerary_invitations')
      .update({ status: 'revoked', revoked_at: now, responded_at: now })
      .eq('id', invitation.id)
      .eq('status', 'pending');

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, status: 'revoked' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error managing invitation:', error);
    return new Response(JSON.stringify({ error: 'Unable to update the invitation.', code: 'invitation_update_failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
