import { Plane, Clock, Info, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ItineraryMatcherModal } from '../ItineraryMatcherModal';
import type { PlanningDraftCardAction } from '@/types/planning-draft';
import {
  formatDurationMinutes,
  formatOfferPrice,
  type CanonicalFlightOffer,
} from '@/types/flight-offer';
import { saveFlightReference, type SaveFlightReferenceResult } from '@/lib/flights/flight-reference';
import { trackFlightOfferViewed, trackFlightReferenceSaved } from '@/lib/taai/minerva/flight-events';

interface FlightResultCardProps {
  flight: CanonicalFlightOffer;
  planningAction?: PlanningDraftCardAction;
}

const formatTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const formatDateShort = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'TBD';
  return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
};

export const FlightResultCard = ({ flight, planningAction }: FlightResultCardProps) => {
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    trackFlightOfferViewed(flight);
  }, [flight]);

  const outbound = flight.slices[0];
  const firstSegment = outbound?.segments[0];
  const lastSegment = outbound?.segments[outbound.segments.length - 1];
  const isTestMode = flight.mode === 'test';

  const handleAddReference = () => setShowModal(true);

  const handleModalConfirm = async (
    itineraryId: string | 'new',
    newItineraryName?: string,
    startDate?: string,
    endDate?: string,
  ) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Sign in required',
          description: 'Please sign in to save a flight reference.',
          variant: 'destructive',
        });
        return;
      }

      let targetItineraryId = itineraryId;
      if (itineraryId === 'new') {
        const { data: newItin, error: createError } = await supabase
          .from('itinerary')
          .insert({
            userid: user.id,
            itin_name: newItineraryName,
            itin_date_start: startDate,
            itin_date_end: endDate,
          })
          .select()
          .single();
        if (createError) throw createError;
        targetItineraryId = newItin.id.toString();
      }

      const { data: itinData, error: itinError } = await supabase
        .from('itinerary')
        .select('itin_id')
        .eq('id', parseInt(targetItineraryId))
        .single();
      if (itinError) throw itinError;

      const result: SaveFlightReferenceResult = await saveFlightReference(flight, itinData.itin_id);
      if (result.ok) {
        trackFlightReferenceSaved(flight, itinData.itin_id);
        toast({
          title: 'Flight reference added',
          description: 'Saved to your itinerary as a planning reference.',
        });
        setShowModal(false);
        return;
      }

      const pending = result.reason === 'schema_pending';
      toast({
        title: pending ? 'Saving not enabled yet' : 'Could not save',
        description: result.message,
        variant: pending ? 'default' : 'destructive',
      });

    } catch (error) {
      console.error('Error saving flight reference:', error);
      toast({
        title: 'Error',
        description: 'Failed to save this flight reference.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const referenceDate = outbound?.departureAt?.split('T')[0] || new Date().toISOString().split('T')[0];

  return (
    <div className="w-[255px] h-[375px] flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Plane className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-white truncate">
              {firstSegment?.marketingCarrierName || 'Airline'}
            </h3>
            <p className="text-white/50 text-sm truncate">{firstSegment?.flightNumber}</p>
          </div>
        </div>
        <Badge className="bg-white/10 text-white/80 border-white/20 text-xs capitalize flex-shrink-0">
          {(flight.cabinClass || 'economy').replace('_', ' ')}
        </Badge>
      </div>

      {/* Test-mode / reference-only disclosure */}
      {isTestMode && (
        <Badge className="mb-3 w-full justify-center bg-[#ffce87]/15 text-[#ffce87] border-[#ffce87]/40 text-[10px] tracking-wide uppercase">
          Test result — reference only
        </Badge>
      )}

      {/* Route */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="text-center">
            <div className="text-white/40 text-xs mb-1">{formatDateShort(outbound?.departureAt ?? '')}</div>
            <div className="text-2xl font-bold text-white">{flight.origin}</div>
            <div className="text-white/60 text-sm mt-0.5">{formatTime(firstSegment?.departureAt ?? '')}</div>
          </div>

          <div className="flex-1 mx-4">
            <div className="flex items-center justify-center">
              <div className="flex-1 h-px bg-white/20" />
              <div className="px-2">
                <Plane className="h-4 w-4 text-white/30 transform rotate-90" />
              </div>
              <div className="flex-1 h-px bg-white/20" />
            </div>
            <div className="text-center mt-1.5">
              <p className="text-white/50 text-xs">{formatDurationMinutes(flight.totalDurationMinutes)}</p>
            </div>
          </div>

          <div className="text-center">
            <div className="text-white/40 text-xs mb-1">{formatDateShort(outbound?.arrivalAt ?? '')}</div>
            <div className="text-2xl font-bold text-white">{flight.destination}</div>
            <div className="text-white/60 text-sm mt-0.5">{formatTime(lastSegment?.arrivalAt ?? '')}</div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-3 pt-3 border-t border-white/10">
          <Clock className="h-3.5 w-3.5 text-white/40" />
          <span className="text-white/50 text-xs">
            {flight.stopCount === 0
              ? 'Non-stop'
              : `${flight.stopCount} ${flight.stopCount === 1 ? 'stop' : 'stops'}`}
            {flight.slices.length > 1 ? ' · round trip' : ''}
          </span>
        </div>
      </div>

      {/* Observed price */}
      <div className="pt-3 border-t border-white/10">
        <p className="text-white/60 text-sm">Observed price</p>
        <p className="text-3xl font-bold" style={{ color: '#ff849c' }}>
          {formatOfferPrice(flight.observedPrice)}
        </p>
        <p className="text-white/40 text-xs mt-1 flex items-start gap-1">
          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span>
            {isTestMode
              ? 'Price observed in test mode; not live availability.'
              : 'Price observed at search time; not live availability.'}
          </span>
        </p>
      </div>

      {/* Reference action */}
      <div className="pt-3 border-t border-white/10 mt-auto">
        {planningAction === undefined ? (
          <Button
            onClick={handleAddReference}
            disabled={saving}
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            <Plus className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Add flight reference'}
          </Button>
        ) : planningAction.mode === 'enabled' ? (
          <Button
            onClick={planningAction.onToggle}
            variant={planningAction.selected ? 'secondary' : 'default'}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            {planningAction.selected ? 'Added to draft' : 'Add to draft'}
          </Button>
        ) : (
          <Button disabled className="w-full" title={planningAction.reason}>
            Cannot add
          </Button>
        )}
      </div>

      {planningAction === undefined && (
        <ItineraryMatcherModal
          open={showModal}
          onOpenChange={setShowModal}
          searchDates={{ checkin: referenceDate, checkout: referenceDate }}
          item={flight}
          onConfirm={handleModalConfirm}
        />
      )}
    </div>
  );
};
