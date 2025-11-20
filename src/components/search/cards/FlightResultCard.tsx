import { Plane, Clock, Calendar, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ItineraryMatcherModal } from '../ItineraryMatcherModal';

interface FlightResultCardProps {
  flight: any;
}

export const FlightResultCard = ({ flight }: FlightResultCardProps) => {
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();

  // Parse departure and arrival times
  const parseDatetime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return {
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      dateShort: date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }).replace(/\//g, '/'),
    };
  };

  const departureInfo = flight.departure ? parseDatetime(flight.departure) : { time: '10:00', dateShort: 'TBD' };
  const arrivalInfo = flight.arrival ? parseDatetime(flight.arrival) : { time: '14:30', dateShort: 'TBD' };

  const handleAddToItinerary = () => {
    setShowModal(true);
  };

  const handleModalConfirm = async (itineraryId: string | 'new', newItineraryName?: string) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Authentication Required',
          description: 'Please sign in to add items to your itinerary',
          variant: 'destructive',
        });
        return;
      }

      let targetItineraryId = itineraryId;

      // If 'new', create the itinerary first
      if (itineraryId === 'new') {
        const departureDate = flight.departure?.at || new Date().toISOString().split('T')[0];
        
        const { data: newItin, error: createError } = await supabase
          .from('itinerary')
          .insert({
            userid: user.id,
            itin_name: newItineraryName,
            itin_date_start: departureDate,
            itin_date_end: departureDate,
          })
          .select()
          .single();

        if (createError) throw createError;
        targetItineraryId = newItin.id.toString();
      }

      const { error } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          itinerary_id: targetItineraryId,
          type: 'flight',
          external_ref: flight.id || `flight-${Date.now()}`,
          price: parseFloat(flight.price?.total || '0'),
          item_data: {
            airline: flight.validatingAirlineCodes?.[0] || flight.airline,
            flightNumber: flight.flightNumber,
            departure: {
              iataCode: flight.departure?.iataCode,
              at: flight.departure?.at,
            },
            arrival: {
              iataCode: flight.arrival?.iataCode,
              at: flight.arrival?.at,
            },
            duration: flight.duration,
            stops: flight.numberOfStops || 0,
            baggage: flight.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.includedCheckedBags?.quantity || 0,
            aircraft: flight.aircraft?.code,
            class: flight.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin,
            price: flight.price,
            bookingStatus: 'pending'
          }
        });

      if (error) throw error;

      toast({
        title: 'Flight Saved',
        description: 'Added to your itinerary as a pending booking',
      });

      setShowModal(false);
    } catch (error) {
      console.error('Error saving flight:', error);
      toast({
        title: 'Error',
        description: 'Failed to save flight to itinerary',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-6">
      {/* Flight header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Plane className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{flight.airlineName || flight.airline}</h3>
            <p className="text-white/50 text-sm">{flight.flight_number}</p>
          </div>
        </div>
        <Badge className="bg-white/10 text-white/80 border-white/20 text-xs capitalize">
          {flight.cabinClass || flight.class || 'Economy'}
        </Badge>
      </div>

      {/* Route visualization */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          {/* Departure */}
          <div className="text-center">
            <div className="text-white/40 text-xs mb-1">{departureInfo.dateShort}</div>
            <div className="text-2xl font-bold text-white">{flight.from}</div>
            <div className="text-white/60 text-sm mt-0.5">{departureInfo.time}</div>
          </div>

          {/* Flight path */}
          <div className="flex-1 mx-6">
            <div className="flex items-center justify-center">
              <div className="flex-1 h-px bg-white/20"></div>
              <div className="px-3">
                <Plane className="h-4 w-4 text-white/30 transform rotate-90" />
              </div>
              <div className="flex-1 h-px bg-white/20"></div>
            </div>
            <div className="text-center mt-1.5">
              <p className="text-white/50 text-xs">{flight.duration}</p>
            </div>
          </div>

          {/* Arrival */}
          <div className="text-center">
            <div className="text-white/40 text-xs mb-1">{arrivalInfo.dateShort}</div>
            <div className="text-2xl font-bold text-white">{flight.to}</div>
            <div className="text-white/60 text-sm mt-0.5">{arrivalInfo.time}</div>
          </div>
        </div>
        
        {/* Stops info */}
        <div className="flex items-center justify-center gap-1.5 mt-3 pt-3 border-t border-white/10">
          <Clock className="h-3.5 w-3.5 text-white/40" />
          <span className="text-white/50 text-xs">
            {flight.stops === 0 ? 'Non-stop' : `${flight.stops} ${flight.stops === 1 ? 'stop' : 'stops'}`}
          </span>
        </div>
      </div>

      {/* Flight details */}
      <div className="flex flex-wrap gap-2 mb-4 flex-shrink-0">
        <Badge variant="outline" className="bg-white/5 border-white/20 text-white text-xs">
          Baggage Included
        </Badge>
        {flight.aircraft && (
          <Badge variant="outline" className="bg-white/5 border-white/20 text-white text-xs">
            {flight.aircraft}
          </Badge>
        )}
      </div>

      {/* Price Section */}
      <div className="pt-4 border-t border-white/10">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <p className="text-white/60 text-sm">Total Price</p>
            <p className="text-3xl font-bold" style={{ color: '#ff849c' }}>
              ${Math.ceil(parseFloat(flight.price?.total || flight.price || '0')).toLocaleString('en-US')}
            </p>
            <p className="text-white/40 text-xs mt-1">including taxes and fees</p>
          </div>
        </div>
      </div>

      {/* Add to Itinerary Button */}
      <div className="pt-4 border-t border-white/10 mt-auto">
        <Button
          onClick={handleAddToItinerary}
          disabled={saving}
          className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
        >
          <Plus className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Flight'}
        </Button>
      </div>

      <ItineraryMatcherModal
        open={showModal}
        onOpenChange={setShowModal}
        searchDates={{
          checkin: flight.departure?.at?.split('T')[0] || new Date().toISOString().split('T')[0],
          checkout: flight.departure?.at?.split('T')[0] || new Date().toISOString().split('T')[0]
        }}
        item={flight}
        onConfirm={handleModalConfirm}
      />
    </div>
  );
};
