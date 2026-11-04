import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import { buildCorsHeaders, guardOrigin } from "../_shared/edge-guard.ts";



const jsonResponse = (corsHeaders: Record<string, string>, body: unknown, status = 200) => new Response(
  JSON.stringify(body),
  { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
);

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get("origin"));
  const originGuard = guardOrigin(req.headers.get("origin"));
  if (!originGuard.ok) {
    return new Response(JSON.stringify({ error: originGuard.error }), {
      status: originGuard.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authenticatedClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
    );
    const { data: { user } } = await authenticatedClient.auth.getUser();
    if (!user) return jsonResponse(corsHeaders, { error: 'Please sign in first.', code: 'unauthorized' }, 401);

    const { invitation_id, accept } = await req.json();
    if (!invitation_id || typeof accept !== 'boolean') {
      return jsonResponse(corsHeaders, { error: 'A valid invitation response is required.', code: 'invalid_request' }, 400);
    }

    const { data: result, error: responseError } = await authenticatedClient.rpc(
      'respond_to_itinerary_invitation',
      { p_invitation_id: invitation_id, p_accept: accept },
    );
    if (responseError) {
      const raw = responseError.message || '';
      if (raw.includes('PLAN_LIMIT_SHARING')) {
        return jsonResponse(corsHeaders, {
          error: 'PLAN_LIMIT_SHARING: This trip has reached its sharing limit. The trip owner can upgrade to invite more people.',
          code: 'PLAN_LIMIT_SHARING',
        }, 402);
      }
      const message = raw.replace(/^.*?: /, '') || 'Unable to process invitation.';
      return jsonResponse(corsHeaders, { error: message, code: 'invitation_response_failed' }, 409);
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

    return jsonResponse(corsHeaders, { success: true, ...result });
  } catch (error) {
    console.error('Error processing invitation:', error);
    return jsonResponse(corsHeaders, { error: 'Unable to process invitation. Please try again.', code: 'invitation_response_failed' }, 500);
  }
});
