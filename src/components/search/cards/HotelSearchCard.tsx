import { Badge } from '@/components/ui/badge';
import { ImageGallery } from '@/components/ui/image-gallery';
import { Star, MapPin, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HotelSearchCardProps {
  hotel: any;
}

export const HotelSearchCard = ({ hotel }: HotelSearchCardProps) => {
  const images = hotel.images || (hotel.image ? [hotel.image] : []);
  const pricePerNight = hotel.pricePerNight || hotel.price || 0;
  const totalPrice = hotel.totalPrice || hotel.min_total_price || 0;
  const nights = hotel.nights || 1;
  const location = hotel.cityName 
    ? `${hotel.cityName}${hotel.distanceFromSearch ? `, ${hotel.distanceFromSearch} mi` : ''}` 
    : (hotel.location || hotel.city || '');
  const source = hotel.source || 'Booking.com';

  return (
    <div className="h-full flex flex-col hover:shadow-lg hover:shadow-gray-500/10 transition-all duration-300">
      {/* Image Gallery */}
      {images.length > 0 && (
        <ImageGallery
          images={images}
          alt={hotel.name}
          aspectRatio="wide"
          className="rounded-t-lg overflow-hidden"
        />
      )}

      {/* Card Content - Matching Itinerary Card Style */}
      <div className="p-4 flex-1 flex flex-col justify-between bg-[#1a1c2e] border border-white/10 rounded-b-lg shadow-[0_4px_12px_rgba(192,192,192,0.15)]">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl opacity-60">🏨</div>
            <Badge variant="secondary" className="text-xs bg-white/5 text-white/40 border-white/10">
              {source}
            </Badge>
          </div>
          <h4 className="font-bold text-white text-base mb-1 line-clamp-2">
            {hotel.name}
          </h4>
          <p className="text-white/60 text-sm mb-2 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {location}
          </p>
          <div className="flex flex-wrap gap-1 mb-2">
            <Badge className="text-sm bg-white/10 text-white/60 border-white/20">
              ${pricePerNight.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/night
            </Badge>
            {hotel.rating && (
              <Badge className="text-sm bg-white/10 text-white/60 border-white/20 flex items-center gap-1">
                <Star className="h-3 w-3 fill-current" />
                {hotel.rating}
              </Badge>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <div className="space-y-1">
            <div className="flex items-center text-sm text-white/50">
              <Calendar className="h-3 w-3 mr-1" />
              {nights} nights
            </div>
            <p className="text-base font-semibold" style={{ color: '#ff849c' }}>
              Total: ${totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-white/40 text-xs">including taxes and fees</p>
          </div>
          <Button
            onClick={() => window.open(hotel.bookingUrl, '_blank')}
            variant="outline"
            size="sm"
            className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 text-xs"
          >
            view taai deal
          </Button>
        </div>
      </div>
    </div>
  );
};
