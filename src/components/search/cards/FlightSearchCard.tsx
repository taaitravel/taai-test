import { Badge } from '@/components/ui/badge';
import { Plane, Clock, Luggage, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, isValid } from 'date-fns';

interface FlightSearchCardProps {
  flight: any;
  onExpand: () => void;
}

export const FlightSearchCard = ({ flight, onExpand }: FlightSearchCardProps) => {
  const price = flight.price || flight.cost || 0;
  const totalPrice = flight.totalPrice || price;
  
  // Parse dates safely
  const departureDate = new Date(flight.departure);
  const arrivalDate = new Date(flight.arrival);
  
  const departureTime = isValid(departureDate) ? format(departureDate, 'h:mm a') : '';
  const arrivalTime = isValid(arrivalDate) ? format(arrivalDate, 'h:mm a') : '';
  const formattedDate = isValid(departureDate) ? format(departureDate, 'MMM dd, yyyy') : '';

  return (
    <div className="space-y-4 bg-[#1a1c2e] p-6 rounded-lg shadow-[0_4px_12px_rgba(192,192,192,0.15)]">
      {/* Flight Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">{flight.airline}</h3>
          <p className="text-white/60 text-sm">{flight.flight_number || 'Flight'}</p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-white/10 text-white/80 border-white/20">
            {flight.source}
          </Badge>
          <Badge className="bg-white/10 text-white/80 border-white/20 capitalize">
            {flight.class || 'Economy'}
          </Badge>
        </div>
      </div>

      {/* Route Visualization */}
      <div className="bg-white/5 p-6 rounded-lg border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <div className="text-center flex-1">
            <p className="text-3xl font-bold text-white">{flight.from || flight.origin}</p>
            <p className="text-white/60 text-sm">{departureTime}</p>
          </div>

          <div className="flex-1 flex flex-col items-center">
            <Plane className="h-6 w-6 text-white/60 mb-1 transform rotate-90" />
            <div className="w-full h-0.5 bg-white/30"></div>
            <p className="text-white/60 text-sm mt-1">{flight.duration || '3h 30m'}</p>
          </div>

          <div className="text-center flex-1">
            <p className="text-3xl font-bold text-white">{flight.to || flight.destination}</p>
            <p className="text-white/60 text-sm">{arrivalTime}</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 text-white/60 text-sm">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formattedDate}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {flight.stops || 0} {flight.stops === 1 ? 'stop' : 'stops'}
          </div>
        </div>
      </div>

      {/* Flight Details */}
      <div className="grid grid-cols-2 gap-3">
        <Badge className="bg-white/10 text-white/80 border-white/20 flex items-center gap-1 justify-center py-2">
          <Luggage className="h-4 w-4" />
          Baggage Included
        </Badge>
        <Badge className="bg-white/10 text-white/80 border-white/20 flex items-center gap-1 justify-center py-2">
          <Plane className="h-4 w-4" />
          {flight.aircraft || 'Boeing 737'}
        </Badge>
      </div>

      {/* Price and Action */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <p className="text-4xl font-bold" style={{ color: '#ff849c' }}>
            {flight.priceDisplay || `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </p>
          <p className="text-white/60 text-xs">total price</p>
        </div>
        <Button
          onClick={onExpand}
          className="bg-gradient-to-r from-[#9b87f5] to-[#7E69AB] hover:opacity-90 text-white"
        >
          view deal
        </Button>
      </div>
    </div>
  );
};
