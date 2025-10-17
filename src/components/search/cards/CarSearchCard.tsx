import { Badge } from '@/components/ui/badge';
import { Car, Users, Settings, Navigation, Fuel } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CarSearchCardProps {
  car: any;
  onExpand: () => void;
}

export const CarSearchCard = ({ car, onExpand }: CarSearchCardProps) => {
  const pricePerDay = car.price || car.pricePerDay || 45;
  const days = car.days || 4;
  const totalPrice = pricePerDay * days;

  return (
    <div className="space-y-4">
      {/* Car Image */}
      {car.image && (
        <div className="rounded-lg overflow-hidden bg-white/5 p-4">
          <img src={car.image} alt={car.name} className="w-full h-48 object-contain" />
        </div>
      )}

      {/* Car Header */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-1">{car.name || 'Toyota Camry'}</h3>
        <p className="text-white/70">{car.type || 'Sedan'}</p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-2 gap-3">
        <Badge className="bg-white/10 text-white/80 border-white/20 flex items-center gap-1 justify-center py-2">
          <Users className="h-4 w-4" />
          {car.seats || 5} seats
        </Badge>
        <Badge className="bg-white/10 text-white/80 border-white/20 flex items-center gap-1 justify-center py-2">
          <Settings className="h-4 w-4" />
          {car.transmission || 'Automatic'}
        </Badge>
        <Badge className="bg-white/10 text-white/80 border-white/20 flex items-center gap-1 justify-center py-2">
          <Fuel className="h-4 w-4" />
          {car.fuelType || 'Gasoline'}
        </Badge>
        <Badge className="bg-white/10 text-white/80 border-white/20 flex items-center gap-1 justify-center py-2">
          <Navigation className="h-4 w-4" />
          GPS Included
        </Badge>
      </div>

      {/* Pickup/Dropoff */}
      <div className="bg-white/5 p-4 rounded-lg border border-white/20">
        <div className="space-y-2 text-sm text-white/70">
          <p><strong className="text-white">Pickup:</strong> {car.pickupLocation || 'Airport'}</p>
          <p><strong className="text-white">Dropoff:</strong> {car.dropoffLocation || 'Airport'}</p>
          <p><strong className="text-white">Mileage:</strong> {car.mileageLimit || 'Unlimited'}</p>
        </div>
      </div>

      {/* Price */}
      <div className="bg-white/5 p-4 rounded-lg border border-white/20">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-4xl font-bold text-white">${pricePerDay}</p>
            <p className="text-white/60 text-sm">per day</p>
          </div>
          <div className="text-right">
            <p className="text-white/70 text-sm">Total for {days} days</p>
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
