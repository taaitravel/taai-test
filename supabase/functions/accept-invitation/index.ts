import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const jsonResponse = (body: unknown, status = 200) => new Response(
  JSON.stringify(body),
  { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
);

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authenticatedClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
    );
    const { data: { user } } = await authenticatedClient.auth.getUser();
    if (!user) return jsonResponse({ error: 'Please sign in first.', code: 'unauthorized' }, 401);

    const { invitation_id, accept } = await req.json();
    if (!invitation_id || typeof accept !== 'boolean') {
      return jsonResponse({ error: 'A valid invitation response is required.', code: 'invalid_request' }, 400);
    }

    const { data: result, error: responseError } = await authenticatedClient.rpc(
      'respond_to_itinerary_invitation',
      { p_invitation_id: invitation_id, p_accept: accept },
    );
    if (responseError) {
      const message = responseError.message?.replace(/^.*?: /, '') || 'Unable to process invitation.';
      return jsonResponse({ error: message, code: 'invitation_response_failed' }, 409);
    }

    if (accept) {
      const admin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      );
      const { data: itinerary } = await admin
        .from('itinerary')
        .select('itin_name')
        .eq('id', result.itinerary_id)
        .single();

      await admin.from('notifications').insert({
        user_id: result.invited_by,
        type: 'invite_accepted',
        reference_type: 'itinerary',
        reference_id: result.itinerary_id.toString(),
        title: 'Invitation Accepted',
        message: `${result.user_name} accepted your invitation to join "${itinerary?.itin_name || 'the trip'}"`,
      });
    }

    return jsonResponse({ success: true, ...result });
  } catch (error) {
    console.error('Error processing invitation:', error);
    return jsonResponse({ error: 'Unable to process invitation. Please try again.', code: 'invitation_response_failed' }, 500);
  }
});
