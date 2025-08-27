import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ImageGallery } from '@/components/ui/image-gallery';
import { MapPin, Calendar, Clock, Star, Users, Plane, Utensils } from 'lucide-react';

interface BaseItem {
  name?: string;
  airline?: string;
  flight_number?: string;
  location?: string;
  address?: string;
  city?: string;
  country?: string;
  images?: string[];
  rating?: number;
  cost?: number;
  price?: string | number;
  booking_status?: string;
}

interface HotelItem extends BaseItem {
  type: 'hotel';
  check_in?: string;
  check_out?: string;
  nights?: number;
}

interface ActivityItem extends BaseItem {
  type: 'activity';
  date?: string;
  duration?: string;
}

interface FlightItem extends BaseItem {
  type: 'flight';
  airline?: string;
  flight_number?: string;
  departure_airport?: string;
  arrival_airport?: string;
  departure_date?: string;
  departure_time?: string;
}

interface ReservationItem extends BaseItem {
  type: 'reservation';
  date?: string;
  time?: string;
  party_size?: number;
  cuisine?: string;
  reservation_type?: string;
}

type ItineraryItem = HotelItem | ActivityItem | FlightItem | ReservationItem;

interface OptimizedItineraryCardProps {
  item: ItineraryItem;
  onEdit?: () => void;
  onDelete?: () => void;
}

const getStatusColor = (status?: string) => {
  switch (status?.toLowerCase()) {
    case 'confirmed': return 'bg-green-500/20 text-green-300 border-green-500/30';
    case 'pending': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-500/30';
    default: return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
  }
};

const getLocationDisplay = (item: ItineraryItem) => {
  if (item.address) return item.address;
  const parts = [item.city, item.country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : item.location || 'Location not specified';
};

const getItemName = (item: ItineraryItem) => {
  if (item.name) return item.name;
  if (item.type === 'flight' && item.airline && item.flight_number) {
    return `${item.airline} ${item.flight_number}`;
  }
  return 'Unnamed Item';
};

const OptimizedItineraryCard = memo(({ item, onEdit, onDelete }: OptimizedItineraryCardProps) => {
  const renderTypeSpecificContent = () => {
    switch (item.type) {
      case 'hotel':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white/70">
              <Calendar className="h-4 w-4" />
              <span>{item.check_in} - {item.check_out}</span>
            </div>
            {item.nights && (
              <div className="flex items-center gap-2 text-white/70">
                <Clock className="h-4 w-4" />
                <span>{item.nights} nights</span>
              </div>
            )}
          </div>
        );
      
      case 'activity':
        return (
          <div className="space-y-3">
            {item.date && (
              <div className="flex items-center gap-2 text-white/70">
                <Calendar className="h-4 w-4" />
                <span>{item.date}</span>
              </div>
            )}
            {item.duration && (
              <div className="flex items-center gap-2 text-white/70">
                <Clock className="h-4 w-4" />
                <span>{item.duration} hours</span>
              </div>
            )}
          </div>
        );
      
      case 'flight':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white/70">
              <Plane className="h-4 w-4" />
              <span>{item.airline} {item.flight_number}</span>
            </div>
            <div className="flex items-center gap-2 text-white/70">
              <span>{item.departure_airport} → {item.arrival_airport}</span>
            </div>
            {item.departure_date && (
              <div className="flex items-center gap-2 text-white/70">
                <Calendar className="h-4 w-4" />
                <span>{item.departure_date} at {item.departure_time}</span>
              </div>
            )}
          </div>
        );
      
      case 'reservation':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white/70">
              <Utensils className="h-4 w-4" />
              <span>{item.cuisine}</span>
            </div>
            {item.date && item.time && (
              <div className="flex items-center gap-2 text-white/70">
                <Calendar className="h-4 w-4" />
                <span>{item.date} at {item.time}</span>
              </div>
            )}
            {item.party_size && (
              <div className="flex items-center gap-2 text-white/70">
                <Users className="h-4 w-4" />
                <span>{item.party_size} people</span>
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Card className="bg-gradient-to-br from-white/10 to-white/5 border-white/20 overflow-hidden">
      <CardContent className="p-6">
        {/* Header with images */}
        {item.images && item.images.length > 0 && (
          <div className="mb-4">
            <ImageGallery 
              images={item.images} 
              alt={`${item.name} images`}
            />
          </div>
        )}
        
        {/* Title and Status */}
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">{getItemName(item)}</h3>
          {item.booking_status && (
            <Badge className={getStatusColor(item.booking_status)}>
              {item.booking_status}
            </Badge>
          )}
        </div>
        
        {/* Location */}
        <div className="flex items-center gap-2 text-white/70 mb-4">
          <MapPin className="h-4 w-4" />
          <span>{getLocationDisplay(item)}</span>
        </div>
        
        {/* Type-specific content */}
        {renderTypeSpecificContent()}
        
        {/* Rating and Price */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-4">
            {item.rating && (
              <div className="flex items-center gap-1 text-yellow-400">
                <Star className="h-4 w-4 fill-current" />
                <span>{item.rating}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {(item.cost || item.price) && (
              <span className="text-lg font-semibold text-white">
                ${item.cost || item.price}
              </span>
            )}
            
            {(onEdit || onDelete) && (
              <div className="flex gap-1">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onEdit}
                    className="text-white/70 hover:text-white hover:bg-white/10"
                  >
                    Edit
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDelete}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    Delete
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

OptimizedItineraryCard.displayName = 'OptimizedItineraryCard';

export { OptimizedItineraryCard };