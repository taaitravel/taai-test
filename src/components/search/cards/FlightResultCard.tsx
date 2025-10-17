import { Plane, Clock, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FlightResultCardProps {
  flight: any;
}

export const FlightResultCard = ({ flight }: FlightResultCardProps) => {
  return (
    <div className="p-6">
      {/* Flight header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
          <Plane className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">{flight.airline || 'Airline'}</h3>
          <p className="text-white/60">{flight.flightNumber || 'Flight Number'}</p>
        </div>
        <Badge className="ml-auto bg-white/10 text-white border-white/20">
          {flight.class || 'Economy'}
        </Badge>
      </div>

      {/* Route visualization */}
      <div className="bg-white/5 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center">
            <p className="text-2xl font-bold text-white">{flight.departure?.time || '10:00'}</p>
            <p className="text-white/60 text-sm">{flight.origin || 'Origin'}</p>
            <p className="text-white/40 text-xs mt-1 flex items-center justify-center gap-1">
              <Calendar className="h-3 w-3" />
              {flight.departure?.date || 'Date'}
            </p>
          </div>

          <div className="flex-1 flex flex-col items-center">
            <div className="flex items-center gap-2 text-white/60">
              <div className="h-px w-12 bg-white/20" />
              <Plane className="h-4 w-4" />
              <div className="h-px w-12 bg-white/20" />
            </div>
            <p className="text-white/60 text-sm mt-2 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {flight.duration || '2h 30m'}
            </p>
            {flight.stops !== undefined && (
              <p className="text-primary text-xs mt-1">
                {flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
              </p>
            )}
          </div>

          <div className="flex-1 text-center">
            <p className="text-2xl font-bold text-white">{flight.arrival?.time || '14:30'}</p>
            <p className="text-white/60 text-sm">{flight.destination || 'Destination'}</p>
            <p className="text-white/40 text-xs mt-1 flex items-center justify-center gap-1">
              <Calendar className="h-3 w-3" />
              {flight.arrival?.date || 'Date'}
            </p>
          </div>
        </div>
      </div>

      {/* Additional details */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/60">Baggage</span>
          <span className="text-white">{flight.baggage || '1 checked bag included'}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/60">Seat Selection</span>
          <span className="text-white">{flight.seatSelection || 'Available'}</span>
        </div>
      </div>

      {/* Price */}
      <div className="pt-4 mt-4 border-t border-white/10">
        <div className="flex items-baseline justify-between">
          <p className="text-white/60 text-sm">Total price</p>
          <p className="text-3xl font-bold text-white">
            ${flight.price || flight.cost || '450'}
          </p>
        </div>
      </div>
    </div>
  );
};
