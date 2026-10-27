import { Plane, Hotel, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface PackageResultCardProps {
  package: any;
}

export const PackageResultCard = ({ package: pkg }: PackageResultCardProps) => {
  const hotel = pkg.hotel || {};
  const flight = pkg.flight || {};

  return (
    <div className="w-[270px] h-[385px] p-6 flex flex-col overflow-auto">
      {/* Package header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge className="bg-primary text-foreground">Package Deal</Badge>
          <Badge variant="outline" className="bg-green-500/20 border-green-500/50 text-green-500">
            Save ${Math.floor((pkg.totalPrice || 0) * 0.15)}
          </Badge>
        </div>
        <h3 className="text-2xl font-bold text-foreground">Flight + Hotel Package</h3>
        <p className="text-muted-foreground text-sm">Everything you need for your trip</p>
      </div>

      {/* Flight section */}
      <div className="bg-muted rounded-lg p-4 mb-3">
        <div className="flex items-center gap-2 mb-3">
          <Plane className="h-5 w-5 text-primary" />
          <h4 className="font-semibold text-foreground">Flight</h4>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Airline</span>
            <span className="text-foreground">{flight.airline || 'Major Airline'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Route</span>
            <span className="text-foreground">
              {flight.origin || 'Origin'} → {flight.destination || 'Destination'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Duration</span>
            <span className="text-foreground">{flight.duration || '2h 30m'}</span>
          </div>
        </div>
      </div>

      {/* Hotel section */}
      <div className="bg-muted rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Hotel className="h-5 w-5 text-primary" />
          <h4 className="font-semibold text-foreground">Hotel</h4>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-start">
            <span className="text-muted-foreground">Property</span>
            <span className="text-foreground text-right flex-1 ml-2">{hotel.name || 'Premium Hotel'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Rating</span>
            <span className="text-foreground flex items-center gap-1">
              {hotel.rating || 4.5} <Star className="h-3 w-3 fill-current text-yellow-500" />
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Location</span>
            <span className="text-foreground">{hotel.location || 'City Center'}</span>
          </div>
        </div>
      </div>

      <Separator className="bg-muted mb-4" />

      {/* Total price */}
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-muted-foreground text-sm">Package Total</p>
          <p className="text-xs text-muted-foreground">Flight + Hotel included</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-foreground">
            ${pkg.totalPrice || ((hotel.price || 399) + (flight.price || 450))}
          </p>
          <p className="text-primary text-sm font-semibold">Package idea</p>
        </div>
      </div>
    </div>
  );
};
