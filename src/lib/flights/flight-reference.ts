import { supabase } from '@/integrations/supabase/client';
import type { CanonicalFlightOffer } from '@/types/flight-offer';
import {
  buildFlightReferenceRow,
  FLIGHT_REFERENCE_TABLE,
  FLIGHT_REFERENCE_TABLE_READY,
  type SaveFlightReferenceResult,
} from './flight-reference-row';

export {
  buildFlightReferenceRow,
  FLIGHT_REFERENCE_TABLE,
  FLIGHT_REFERENCE_TABLE_READY,
  type SaveFlightReferenceResult,
};

export const saveFlightReference = async (
  offer: CanonicalFlightOffer,
  itineraryId: string,
): Promise<SaveFlightReferenceResult> => {
  if (!FLIGHT_REFERENCE_TABLE_READY) {
    return {
      ok: false,
      reason: 'schema_pending',
      message: 'Saving flight references is pending a schema approval. Nothing was written.',
    };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, reason: 'not_authenticated', message: 'Please sign in to save a flight reference.' };
  }

  const { error } = await (supabase as unknown as {
    from: (table: string) => {
      insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    };
  })
    .from(FLIGHT_REFERENCE_TABLE)
    .insert(buildFlightReferenceRow(offer, user.id, itineraryId));

  if (error) {
    return { ok: false, reason: 'failed', message: 'Could not save this flight reference. Please try again.' };
  }
  return { ok: true };
};
