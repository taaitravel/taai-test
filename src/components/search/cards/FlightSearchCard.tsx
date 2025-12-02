import { Badge } from '@/components/ui/badge';
import { Plane, Clock, Calendar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, isValid } from 'date-fns';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ItineraryMatcherModal } from '../ItineraryMatcherModal';
import { getAirlineName } from '@/lib/airlineNames';

interface FlightSearchCardProps {
  flight: any;
}

export const FlightSearchCard = ({ flight }: FlightSearchCardProps) => {
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();

  // Guard clause: return null if flight is undefined or invalid
  if (!flight || typeof flight !== 'object') {
    return null;
  }

  const price = flight.price || flight.cost || 0;
  const totalPrice = flight.totalPrice || price;
  const roundedPrice = Math.ceil(totalPrice);
  
  // Parse dates safely
  const departureDate = new Date(flight.departure);
  const arrivalDate = new Date(flight.arrival);
  
  const departureTime = isValid(departureDate) ? format(departureDate, 'h:mm a') : '';
  const arrivalTime = isValid(arrivalDate) ? format(arrivalDate, 'h:mm a') : '';
  const departureOnlyDate = isValid(departureDate) ? format(departureDate, 'MM/dd/yy') : '';

  // Get full airline name
  const airlineName = getAirlineName(flight.airline || '');

  const handleAddToItinerary = () => {
    setShowModal(true);
  };

  const handleModalConfirm = async (itineraryId: string | 'new', newItineraryName?: string, startDate?: string, endDate?: string) => {
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

      // Fetch the itinerary to get its itin_id (UUID)
      const { data: itinData, error: itinError } = await supabase
        .from('itinerary')
        .select('itin_id')
        .eq('id', parseInt(targetItineraryId))
        .single();

      if (itinError) throw itinError;

      const { error } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          itinerary_id: itinData.itin_id,
          type: 'flight',
          external_ref: flight.id || `flight-${Date.now()}`,
          price: roundedPrice,
          item_data: {
            airline: airlineName,
            flightNumber: flight.flight_number,
            from: flight.from || flight.origin,
            to: flight.to || flight.destination,
            departure: flight.departure,
            arrival: flight.arrival,
            duration: flight.duration,
            stops: flight.stops || 0,
            class: flight.class,
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
    <div className="w-[270px] h-[385px] flex flex-col overflow-hidden rounded-lg border border-white/20 bg-[#1a1c2e] pb-[20px] hover:shadow-lg hover:shadow-gray-500/10 transition-all duration-300">
      {/* Card Content - Matching Hotel Card Style */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Header with emoji and class badge */}
          <div className="flex items-center justify-between mb-2">
            <div className="text-xl opacity-60">✈️</div>
            <Badge variant="secondary" className="text-xs bg-white/5 text-white/40 border-white/10 capitalize">
              {flight.class || 'Economy'}
            </Badge>
          </div>

          {/* Airline name */}
          <h4 className="font-bold text-white text-sm mb-1 line-clamp-1">
            {airlineName}
          </h4>
          <p className="text-white/60 text-xs mb-3">
            {flight.flight_number || 'Flight'}
          </p>

          {/* Route Visualization - Compact */}
          <div className="bg-white/5 p-3 rounded-lg border border-white/10 mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-center flex-1">
                <p className="text-white/40 text-xs">{departureOnlyDate}</p>
                <p className="text-lg font-bold text-white">{flight.from || flight.origin}</p>
                <p className="text-white/50 text-xs">{departureTime}</p>
              </div>

              <div className="flex-1 flex flex-col items-center px-2">
                <Plane className="h-3 w-3 text-white/40 transform rotate-90" />
                <div className="w-full h-px bg-white/20 my-1"></div>
                <p className="text-white/50 text-xs">{flight.duration || '3h 30m'}</p>
              </div>

              <div className="text-center flex-1">
                <p className="text-white/40 text-xs">&nbsp;</p>
                <p className="text-lg font-bold text-white">{flight.to || flight.destination}</p>
                <p className="text-white/50 text-xs">{arrivalTime}</p>
              </div>
            </div>
          </div>

          {/* Flight Details Badges */}
          <div className="flex flex-wrap gap-1 mb-2">
            <Badge className="text-xs bg-white/10 text-white/60 border-white/20 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {flight.stops || 0} {flight.stops === 1 ? 'stop' : 'stops'}
            </Badge>
            <Badge className="text-xs bg-white/10 text-white/60 border-white/20">
              Baggage
            </Badge>
          </div>
        </div>

        {/* Price and Button Section */}
        <div className="space-y-2">
          <div className="space-y-1 mb-4">
            <div className="flex items-center text-xs text-white/50">
              <Calendar className="h-3 w-3 mr-1" />
              Total Price
            </div>
            <p className="text-2xl font-bold text-center" style={{ color: '#ff849c' }}>
              ${roundedPrice.toLocaleString('en-US')}
            </p>
            <p className="text-white/40 text-xs text-center">including taxes and fees</p>
          </div>
          <div className="pt-2 border-t border-white/10 flex-shrink-0">
            <Button
              onClick={handleAddToItinerary}
              disabled={saving}
              className="w-full h-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-xs text-white"
            >
              <Plus className="mr-1 h-3 w-3" />
              {saving ? 'Saving...' : 'Flight'}
            </Button>
          </div>
        </div>
      </div>

      <ItineraryMatcherModal
        open={showModal}
        onOpenChange={setShowModal}
        searchDates={{
          checkin: flight.departure || new Date().toISOString().split('T')[0],
          checkout: flight.departure || new Date().toISOString().split('T')[0]
        }}
        item={flight}
        onConfirm={handleModalConfirm}
      />
    </div>
  );
};
