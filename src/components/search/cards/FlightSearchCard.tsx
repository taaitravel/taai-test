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
      <div className="bg-white/5 p-4 rounded-lg border border-white/10 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-center flex-1">
            <p className="text-2xl font-bold text-white">{flight.from || flight.origin}</p>
            <p className="text-white/50 text-sm mt-0.5">{departureTime}</p>
          </div>

          <div className="flex-1 flex flex-col items-center px-4">
            <Plane className="h-4 w-4 text-white/40 mb-1 transform rotate-90" />
            <div className="w-full h-px bg-white/20"></div>
            <p className="text-white/50 text-xs mt-1">{flight.duration || '3h 30m'}</p>
          </div>

          <div className="text-center flex-1">
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
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge variant="outline" className="bg-white/5 border-white/20 text-white text-xs">
          Baggage Included
        </Badge>
        {flight.aircraft && (
          <Badge variant="outline" className="bg-white/5 border-white/20 text-white text-xs">
            {flight.aircraft}
          </Badge>
        )}
      </div>

      {/* Price and Action */}
      <div className="pt-4 border-t border-white/10">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-white/60 text-sm">Total Price</p>
            <p className="text-2xl font-bold" style={{ color: '#ff849c' }}>
              {flight.priceDisplay || `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </p>
          </div>
          <Button
            onClick={onExpand}
            className="bg-gradient-to-r from-[#9b87f5] to-[#7E69AB] hover:opacity-90 text-white"
          >
            view deal
          </Button>
        </div>
      </div>
    </div>
  );
};
