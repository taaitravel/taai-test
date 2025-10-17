import { Badge } from '@/components/ui/badge';
import { ImageGallery } from '@/components/ui/image-gallery';
import { Star, MapPin, Wifi, Car, Coffee, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HotelSearchCardProps {
  hotel: any;
  onExpand: () => void;
}

export const HotelSearchCard = ({ hotel, onExpand }: HotelSearchCardProps) => {
  const images = hotel.images || (hotel.image ? [hotel.image] : []);
  const amenities = hotel.amenities || ['WiFi', 'Parking', 'Pool', 'Breakfast'];
  const pricePerNight = hotel.price || hotel.pricePerNight || 199;
  const nights = hotel.nights || 4;
  const totalPrice = pricePerNight * nights;

  const amenityIcons: any = {
    'WiFi': Wifi,
    'Parking': Car,
    'Breakfast': Coffee,
    'Pool': Waves,
  };

  return (
    <div className="space-y-4">
      {/* Image Gallery */}
      {images.length > 0 && (
        <ImageGallery
          images={images}
          alt={hotel.name}
          aspectRatio="wide"
          className="rounded-lg overflow-hidden"
        />
      )}

      {/* Hotel Header */}
      <div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">{hotel.name}</h3>
            <p className="text-white/70 flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {hotel.location || hotel.city}
            </p>
          </div>
          {hotel.rating && (
            <div className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-white font-semibold">{hotel.rating}</span>
            </div>
          )}
        </div>

        {/* Amenities */}
        <div className="flex flex-wrap gap-2 mb-4">
          {amenities.slice(0, 4).map((amenity: string, idx: number) => {
            const Icon = amenityIcons[amenity] || Wifi;
            return (
              <Badge key={idx} className="bg-white/10 text-white/80 border-white/20 flex items-center gap-1">
                <Icon className="h-3 w-3" />
                {amenity}
              </Badge>
            );
          })}
        </div>

        {/* Price */}
        <div className="bg-white/5 p-4 rounded-lg border border-white/20">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold text-white">${pricePerNight}</p>
              <p className="text-white/60 text-sm">per night</p>
            </div>
            <div className="text-right">
              <p className="text-white/70 text-sm">Total for {nights} nights</p>
              <p className="text-2xl font-semibold text-primary">${totalPrice}</p>
            </div>
          </div>
        </div>

        {/* View Details Button */}
        <Button
          onClick={onExpand}
          variant="outline"
          className="w-full mt-4 bg-white/5 border-white/20 text-white hover:bg-white/10"
        >
          View Full Details
        </Button>
      </div>
    </div>
  );
};
