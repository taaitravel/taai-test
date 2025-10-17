import { Badge } from '@/components/ui/badge';
import { Plane, Hotel, Car, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PackageSearchCardProps {
  package: any;
  onExpand: () => void;
}

export const PackageSearchCard = ({ package: pkg, onExpand }: PackageSearchCardProps) => {
  const flightPrice = pkg.flight?.price || 450;
  const hotelPrice = pkg.hotel?.price || 199;
  const carPrice = pkg.car?.price || 45;
  const regularTotal = flightPrice + hotelPrice + carPrice;
  const discount = Math.round(regularTotal * 0.15);
  const packagePrice = regularTotal - discount;

  return (
    <div className="space-y-4">
      {/* Package Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Complete Package Deal
          </h3>
          <p className="text-white/70">Flight + Hotel + Car</p>
        </div>
        <Badge className="bg-primary/20 text-primary border-primary/30 text-lg px-4 py-2">
          Save ${discount}
        </Badge>
      </div>

      {/* Flight Section */}
      <div className="bg-white/5 p-4 rounded-lg border border-white/20">
        <div className="flex items-center gap-2 mb-2">
          <Plane className="h-5 w-5 text-white/60" />
          <h4 className="text-white font-semibold">Flight</h4>
        </div>
        <p className="text-white/70 text-sm">{pkg.flight?.airline} - {pkg.flight?.from} → {pkg.flight?.to}</p>
        <p className="text-white/60 text-sm line-through mt-1">${flightPrice}</p>
      </div>

      {/* Hotel Section */}
      <div className="bg-white/5 p-4 rounded-lg border border-white/20">
        <div className="flex items-center gap-2 mb-2">
          <Hotel className="h-5 w-5 text-white/60" />
          <h4 className="text-white font-semibold">Hotel</h4>
        </div>
        <p className="text-white/70 text-sm">{pkg.hotel?.name}</p>
        <p className="text-white/60 text-sm">{pkg.hotel?.location}</p>
        <p className="text-white/60 text-sm line-through mt-1">${hotelPrice}</p>
      </div>

      {/* Car Section */}
      <div className="bg-white/5 p-4 rounded-lg border border-white/20">
        <div className="flex items-center gap-2 mb-2">
          <Car className="h-5 w-5 text-white/60" />
          <h4 className="text-white font-semibold">Car Rental</h4>
        </div>
        <p className="text-white/70 text-sm">{pkg.car?.name || 'Toyota Camry'}</p>
        <p className="text-white/60 text-sm line-through mt-1">${carPrice}</p>
      </div>

      {/* Package Price */}
      <div className="bg-gradient-to-r from-primary/20 to-primary/10 p-6 rounded-lg border border-primary/30">
        <div className="text-center">
          <p className="text-white/70 text-sm mb-1">Package Total</p>
          <p className="text-white/60 text-sm line-through mb-2">${regularTotal}</p>
          <p className="text-5xl font-bold text-white mb-2">${packagePrice}</p>
          <p className="text-primary font-semibold">Save 15% vs booking separately!</p>
        </div>
      </div>

      {/* View Details Button */}
      <Button
        onClick={onExpand}
        variant="outline"
        className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10"
      >
        View Full Package Details
      </Button>
    </div>
  );
};
