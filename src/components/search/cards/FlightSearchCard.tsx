import { Badge } from '@/components/ui/badge';
import { Plane, Clock, Luggage, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, isValid } from 'date-fns';

interface FlightSearchCardProps {
  flight: any;
  onExpand: () => void;
}

export const FlightSearchCard = ({ flight, onExpand }: FlightSearchCardProps) => {
  const pricePerPerson = flight.price || flight.cost || 450;
  const travelers = flight.travelers || 2;
  const totalPrice = pricePerPerson * travelers;
  
  // Parse dates safely
  const departureDate = new Date(flight.departure);
  const arrivalDate = new Date(flight.arrival);
  
  const departureTime = isValid(departureDate) ? format(departureDate, 'hh:mm a') : '08:00 AM';
  const arrivalTime = isValid(arrivalDate) ? format(arrivalDate, 'hh:mm a') : '11:30 AM';
  const formattedDate = isValid(departureDate) ? format(departureDate, 'MMM dd, yyyy') : 'Today';

  return (
    <div className="space-y-4">
      {/* Flight Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-2xl font-bold text-white">{flight.airline}</h3>
          <p className="text-white/60">{flight.flight_number || 'Flight'}</p>
        </div>
        <Badge className="bg-white/10 text-white/80 border-white/20">
          {flight.class || 'Economy'}
        </Badge>
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

      {/* Price */}
      <div className="bg-white/5 p-4 rounded-lg border border-white/20">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-4xl font-bold text-white">${pricePerPerson}</p>
            <p className="text-white/60 text-sm">per person</p>
          </div>
          <div className="text-right">
            <p className="text-white/70 text-sm">Total for {travelers} travelers</p>
            <p className="text-2xl font-semibold text-primary">${totalPrice}</p>
          </div>
        </div>
      </div>

      {/* View Details Button */}
      <Button
        onClick={onExpand}
        variant="outline"
        className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10"
      >
        View Full Details
      </Button>
    </div>
  );
};
