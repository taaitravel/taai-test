import { Badge } from '@/components/ui/badge';
import { ImageGallery } from '@/components/ui/image-gallery';
import { Star, MapPin, Wifi, Car, Coffee, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HotelSearchCardProps {
  hotel: any;
}

export const HotelSearchCard = ({ hotel }: HotelSearchCardProps) => {
  const images = hotel.images || (hotel.image ? [hotel.image] : []);
  const amenities = hotel.amenities || ['WiFi', 'Parking', 'Pool', 'Breakfast'];
  const pricePerNight = hotel.pricePerNight || hotel.price || 0;
  const totalPrice = hotel.totalPrice || hotel.min_total_price || 0;
  const nights = hotel.nights || 1;

  const amenityIcons: any = {
    'WiFi': Wifi,
    'Parking': Car,
    'Breakfast': Coffee,
    'Pool': Waves,
  };

  return (
    <div className="space-y-3 hover:scale-[1.02] transition-transform duration-200">
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
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-2">
            <h3 className="text-lg font-bold text-white mb-1 line-clamp-2">{hotel.name}</h3>
            <p className="text-white/70 text-sm flex items-center gap-1">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              {hotel.location || hotel.cityName || hotel.city}
            </p>
          </div>
          {hotel.rating && (
            <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full flex-shrink-0">
              <Star className="h-3 w-3 text-yellow-400 fill-current" />
              <span className="text-white text-sm font-semibold">{hotel.rating}</span>
            </div>
          )}
        </div>

        {/* Amenities */}
        <div className="flex flex-wrap gap-1.5">
          {amenities.slice(0, 3).map((amenity: string, idx: number) => {
            const Icon = amenityIcons[amenity] || Wifi;
            return (
              <Badge key={idx} className="bg-white/10 text-white/80 border-white/20 flex items-center gap-1 text-xs px-2 py-0.5">
                <Icon className="h-2.5 w-2.5" />
                {amenity}
              </Badge>
            );
          })}
        </div>

        {/* Price */}
        <div className="bg-white/5 p-3 rounded-lg border border-white/20">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-white">${pricePerNight}</p>
              <p className="text-white/60 text-xs">per night</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-primary">${totalPrice}</p>
              <p className="text-white/50 text-xs">including taxes and fees</p>
            </div>
          </div>
        </div>

        {/* View Details Button */}
        <Button
          onClick={() => window.open(hotel.bookingUrl, '_blank')}
          variant="outline"
          className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10"
        >
          view taai deal
        </Button>
      </div>
    </div>
  );
};
