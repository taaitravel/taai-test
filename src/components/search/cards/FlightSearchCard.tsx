import { Badge } from '@/components/ui/badge';
import { Plane, Clock, Luggage, Calendar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, isValid } from 'date-fns';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ItineraryMatcherModal } from '../ItineraryMatcherModal';

interface FlightSearchCardProps {
  flight: any;
}

export const FlightSearchCard = ({ flight }: FlightSearchCardProps) => {
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();

  const price = flight.price || flight.cost || 0;
  const totalPrice = flight.totalPrice || price;
  const roundedPrice = Math.ceil(totalPrice);
  
  // Parse dates safely
  const departureDate = new Date(flight.departure);
  const arrivalDate = new Date(flight.arrival);
  
  const departureTime = isValid(departureDate) ? format(departureDate, 'h:mm a') : '';
  const arrivalTime = isValid(arrivalDate) ? format(arrivalDate, 'h:mm a') : '';
  const departureOnlyDate = isValid(departureDate) ? format(departureDate, 'MM/dd/yy') : '';
  const arrivalOnlyDate = isValid(arrivalDate) ? format(arrivalDate, 'MM/dd/yy') : '';

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
            airline: flight.airline,
            flightNumber: flight.flight_number,
            from: flight.from || flight.origin,
            to: flight.to || flight.destination,
            departure: flight.departure,
            arrival: flight.arrival,
            duration: flight.duration,
            stops: flight.stops || 0,
            class: flight.class,
            aircraft: flight.aircraft,
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
    <div className="w-[255px] h-[375px] flex flex-col bg-[#1a1c2e] p-6 rounded-lg shadow-[0_4px_12px_rgba(192,192,192,0.15)]">
      {/* Flight Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Plane className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{flight.airline}</h3>
            <p className="text-white/50 text-sm">{flight.flight_number || 'Flight'}</p>
          </div>
        </div>
        <Badge className="bg-white/10 text-white/80 border-white/20 text-xs capitalize">
          {flight.class || 'Economy'}
        </Badge>
      </div>

      {/* Route Visualization */}
      <div className="bg-white/5 p-4 rounded-lg border border-white/10 mb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="text-center flex-1">
            <p className="text-white/40 text-xs mb-1">{departureOnlyDate}</p>
            <p className="text-2xl font-bold text-white">{flight.from || flight.origin}</p>
            <p className="text-white/50 text-sm mt-0.5">{departureTime}</p>
          </div>

          <div className="flex-1 flex flex-col items-center px-4">
            <Plane className="h-4 w-4 text-white/40 mb-1 transform rotate-90" />
            <div className="w-full h-px bg-white/20"></div>
            <p className="text-white/50 text-xs mt-1">{flight.duration || '3h 30m'}</p>
          </div>

          <div className="text-center flex-1">
            <p className="text-white/40 text-xs mb-1">{arrivalOnlyDate}</p>
            <p className="text-2xl font-bold text-white">{flight.to || flight.destination}</p>
            <p className="text-white/50 text-sm mt-0.5">{arrivalTime}</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1 pt-2 border-t border-white/10">
          <Clock className="h-3.5 w-3.5 text-white/40" />
          <span className="text-white/50 text-xs">
            {flight.stops || 0} {flight.stops === 1 ? 'stop' : 'stops'}
          </span>
        </div>
      </div>

      {/* Flight Details */}
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
      <div className="pt-4 border-t border-white/10 mt-auto">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <p className="text-white/60 text-sm">Total Price</p>
            <p className="text-3xl font-bold" style={{ color: '#ff849c' }}>
              ${roundedPrice.toLocaleString('en-US')}
            </p>
            <p className="text-white/40 text-xs mt-1">including taxes and fees</p>
          </div>
        </div>
      </div>

      {/* Add to Itinerary Button */}
      <div className="pt-4 border-t border-white/10">
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
          checkin: flight.departure || new Date().toISOString().split('T')[0],
          checkout: flight.departure || new Date().toISOString().split('T')[0]
        }}
        item={flight}
        onConfirm={handleModalConfirm}
      />
    </div>
  );
};
