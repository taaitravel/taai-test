import { Star, MapPin, Wifi, Coffee, ParkingCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface HotelResultCardProps {
  hotel: any;
}

export const HotelResultCard = ({ hotel }: HotelResultCardProps) => {
  return (
    <div className="p-6">
      {/* Image carousel */}
      <div className="relative h-64 bg-white/5 rounded-lg mb-4 overflow-hidden">
        {hotel.images?.[0] ? (
          <img 
            src={hotel.images[0]} 
            alt={hotel.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/40">
            No image available
          </div>
        )}
        <div className="absolute top-4 right-4">
          <Badge className="bg-primary text-white">
            {hotel.rating || 4.5} <Star className="ml-1 h-3 w-3 fill-current" />
          </Badge>
        </div>
      </div>

      {/* Hotel info */}
      <div className="space-y-3">
        <div>
          <h3 className="text-2xl font-bold text-white">{hotel.name}</h3>
          <p className="text-white/60 flex items-center gap-1 mt-1">
            <MapPin className="h-4 w-4" />
            {hotel.location || hotel.address}
          </p>
        </div>

        {/* Amenities */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="bg-white/5 border-white/20 text-white">
            <Wifi className="mr-1 h-3 w-3" />
            Free WiFi
          </Badge>
          <Badge variant="outline" className="bg-white/5 border-white/20 text-white">
            <Coffee className="mr-1 h-3 w-3" />
            Breakfast
          </Badge>
          <Badge variant="outline" className="bg-white/5 border-white/20 text-white">
            <ParkingCircle className="mr-1 h-3 w-3" />
            Parking
          </Badge>
        </div>

        {/* Price */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-white/60 text-sm">Price per night</p>
              <p className="text-3xl font-bold text-white">
                ${hotel.price || hotel.cost || '199'}
              </p>
            </div>
            {hotel.duration && (
              <div className="text-right">
                <p className="text-white/60 text-sm">Total ({hotel.duration} nights)</p>
                <p className="text-xl font-semibold text-white">
                  ${(hotel.price || 199) * hotel.duration}
                </p>
              </div>
            )}
          </div>
        </div>

        {hotel.description && (
          <p className="text-white/70 text-sm line-clamp-2">{hotel.description}</p>
        )}
      </div>
    </div>
  );
};
