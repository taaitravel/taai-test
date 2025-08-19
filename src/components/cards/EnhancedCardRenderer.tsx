import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ImageGallery } from '@/components/ui/image-gallery';
import { Star, MapPin, Calendar, Users, Clock, Plane, Utensils, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { EnhancedHotelItem, EnhancedFlightItem, EnhancedActivityItem, EnhancedReservationItem } from '@/types/enhanced-itinerary';

const getStatusIcon = (status?: string) => {
  switch (status) {
    case 'confirmed':
      return <CheckCircle className="h-3 w-3 text-green-400" />;
    case 'pending':
      return <AlertCircle className="h-3 w-3 text-yellow-400" />;
    case 'cancelled':
      return <XCircle className="h-3 w-3 text-red-400" />;
    default:
      return null;
  }
};

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'confirmed':
      return 'bg-green-500/20 text-green-300 border-green-500/30';
    case 'pending':
      return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    case 'cancelled':
      return 'bg-red-500/20 text-red-300 border-red-500/30';
    default:
      return 'bg-primary/20 text-primary border-primary/30';
  }
};

// Enhanced Hotel Card Renderer
export const EnhancedHotelRenderer = (hotel: EnhancedHotelItem, isTop: boolean) => (
  <>
    {isTop && (
      <ImageGallery
        images={hotel.images || []}
        alt={hotel.name}
        className="mb-4"
        overlayContent={
          <div className="flex items-center justify-between w-full">
            <Badge className="bg-black/50 text-white border-none">
              ${hotel.cost}/night
            </Badge>
            {hotel.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-white text-sm font-semibold">{hotel.rating}</span>
              </div>
            )}
          </div>
        }
      />
    )}
    
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-lg text-white">{hotel.name}</h3>
          {hotel.booking_status && getStatusIcon(hotel.booking_status)}
        </div>
        <div className="flex items-center gap-1 text-white/70 text-sm">
          <MapPin className="h-3 w-3" />
          {hotel.location}
        </div>
        {hotel.booking_reference && (
          <div className="text-white/50 text-xs mt-1">
            Booking: {hotel.booking_reference}
          </div>
        )}
      </div>
      
      {isTop && hotel.description && (
        <p className="text-white/80 text-sm line-clamp-2">
          {hotel.description}
        </p>
      )}
      
      {isTop && (
        <div className="flex items-center gap-4 text-xs text-white/60">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{hotel.check_in}</span>
          </div>
          <span>→</span>
          <span>{hotel.check_out}</span>
          <span>• {hotel.nights} nights</span>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className={`text-sm ${hotel.booking_status ? getStatusColor(hotel.booking_status) : 'bg-white/10 text-white/60 border-white/20'}`}>
            ${hotel.cost}
          </Badge>
          {hotel.booking_status && (
            <Badge variant="outline" className={`text-xs ${getStatusColor(hotel.booking_status)}`}>
              {hotel.booking_status}
            </Badge>
          )}
        </div>
        {!isTop && hotel.rating && (
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 text-yellow-400 fill-current" />
            <span className="text-white/60 text-sm">{hotel.rating}</span>
          </div>
        )}
      </div>
      
      {isTop && hotel.amenities && hotel.amenities.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {hotel.amenities.slice(0, 3).map((amenity: string, index: number) => (
            <Badge key={index} variant="outline" className="text-xs border-white/30 text-white/70">
              {amenity}
            </Badge>
          ))}
          {hotel.amenities.length > 3 && (
            <Badge variant="outline" className="text-xs border-white/30 text-white/70">
              +{hotel.amenities.length - 3}
            </Badge>
          )}
        </div>
      )}
    </div>
  </>
);

// Enhanced Flight Card Renderer
export const EnhancedFlightRenderer = (flight: EnhancedFlightItem, isTop: boolean) => (
  <>
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Plane className="h-6 w-6 text-blue-400" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-white">
              {flight.airline} {flight.flight_number}
            </h3>
            {flight.booking_status && getStatusIcon(flight.booking_status)}
          </div>
          <p className="text-white/70 text-sm">
            {flight.from} → {flight.to}
          </p>
          {flight.booking_reference && (
            <div className="text-white/50 text-xs">
              Booking: {flight.booking_reference}
            </div>
          )}
        </div>
      </div>
      
      {isTop && (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-white/50">Departure</p>
            <p className="text-white">{new Date(flight.departure).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
            <p className="text-white/70 text-xs">{new Date(flight.departure).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-white/50">Arrival</p>
            <p className="text-white">{new Date(flight.arrival).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
            <p className="text-white/70 text-xs">{new Date(flight.arrival).toLocaleDateString()}</p>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className={`text-sm ${flight.booking_status ? getStatusColor(flight.booking_status) : 'bg-blue-500/20 text-blue-300 border-blue-500/30'}`}>
            ${flight.cost}
          </Badge>
          {flight.booking_status && (
            <Badge variant="outline" className={`text-xs ${getStatusColor(flight.booking_status)}`}>
              {flight.booking_status}
            </Badge>
          )}
        </div>
        {flight.duration && (
          <div className="flex items-center gap-1 text-white/60 text-sm">
            <Clock className="h-3 w-3" />
            {flight.duration}
          </div>
        )}
      </div>

      {isTop && (flight.seat_class || flight.aircraft_type) && (
        <div className="flex flex-wrap gap-1">
          {flight.seat_class && (
            <Badge variant="outline" className="text-xs border-white/30 text-white/70">
              {flight.seat_class}
            </Badge>
          )}
          {flight.aircraft_type && (
            <Badge variant="outline" className="text-xs border-white/30 text-white/70">
              {flight.aircraft_type}
            </Badge>
          )}
        </div>
      )}
    </div>
  </>
);

// Enhanced Activity Card Renderer
export const EnhancedActivityRenderer = (activity: EnhancedActivityItem, isTop: boolean) => (
  <>
    {isTop && (
      <ImageGallery
        images={activity.images || []}
        alt={activity.name}
        aspectRatio="wide"
        className="mb-3"
        overlayContent={
          <div className="flex items-center justify-between w-full">
            <Badge className="bg-black/50 text-white border-none">
              ${activity.cost}
            </Badge>
            {activity.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-white text-sm font-semibold">{activity.rating}</span>
              </div>
            )}
          </div>
        }
      />
    )}
    
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-lg text-white">{activity.name}</h3>
          {activity.booking_status && getStatusIcon(activity.booking_status)}
        </div>
        <div className="flex items-center gap-1 text-white/70 text-sm">
          <MapPin className="h-3 w-3" />
          {activity.location}
        </div>
        {activity.booking_reference && (
          <div className="text-white/50 text-xs mt-1">
            Booking: {activity.booking_reference}
          </div>
        )}
      </div>
      
      {isTop && activity.description && (
        <p className="text-white/80 text-sm line-clamp-2">
          {activity.description}
        </p>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className={`text-sm ${activity.booking_status ? getStatusColor(activity.booking_status) : 'bg-green-500/20 text-green-300 border-green-500/30'}`}>
            ${activity.cost}
          </Badge>
          {activity.booking_status && (
            <Badge variant="outline" className={`text-xs ${getStatusColor(activity.booking_status)}`}>
              {activity.booking_status}
            </Badge>
          )}
        </div>
        {activity.duration && (
          <div className="flex items-center gap-1 text-white/60 text-sm">
            <Clock className="h-3 w-3" />
            {activity.duration}
          </div>
        )}
      </div>
      
      {activity.date && (
        <div className="flex items-center gap-1 text-white/60 text-sm">
          <Calendar className="h-3 w-3" />
          {new Date(activity.date).toLocaleDateString()}
        </div>
      )}

      {isTop && (activity.category || activity.difficulty_level) && (
        <div className="flex flex-wrap gap-1">
          {activity.category && (
            <Badge variant="outline" className="text-xs border-white/30 text-white/70">
              {activity.category}
            </Badge>
          )}
          {activity.difficulty_level && (
            <Badge variant="outline" className="text-xs border-white/30 text-white/70">
              {activity.difficulty_level}
            </Badge>
          )}
        </div>
      )}
    </div>
  </>
);

// Enhanced Restaurant Card Renderer
export const EnhancedRestaurantRenderer = (restaurant: EnhancedReservationItem, isTop: boolean) => (
  <>
    {isTop && restaurant.images && restaurant.images.length > 0 && (
      <ImageGallery
        images={restaurant.images}
        alt={restaurant.name}
        aspectRatio="wide"
        className="mb-3"
        overlayContent={
          <div className="flex items-center justify-between w-full">
            {restaurant.price_range && (
              <Badge className="bg-black/50 text-white border-none">
                {restaurant.price_range}
              </Badge>
            )}
            {restaurant.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-white text-sm font-semibold">{restaurant.rating}</span>
              </div>
            )}
          </div>
        }
      />
    )}
    
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-lg text-white">{restaurant.name}</h3>
          {restaurant.booking_status && getStatusIcon(restaurant.booking_status)}
        </div>
        <div className="flex items-center gap-1 text-white/70 text-sm">
          <MapPin className="h-3 w-3" />
          {restaurant.city}
        </div>
        {restaurant.booking_reference && (
          <div className="text-white/50 text-xs mt-1">
            Booking: {restaurant.booking_reference}
          </div>
        )}
      </div>
      
      {isTop && restaurant.description && (
        <p className="text-white/80 text-sm line-clamp-2">
          {restaurant.description}
        </p>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Utensils className="h-4 w-4 text-orange-400" />
          <span className="text-white/70 text-sm">{restaurant.cuisine || restaurant.type}</span>
          {restaurant.booking_status && (
            <Badge variant="outline" className={`text-xs ${getStatusColor(restaurant.booking_status)}`}>
              {restaurant.booking_status}
            </Badge>
          )}
        </div>
        {restaurant.rating && !isTop && (
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 text-yellow-400 fill-current" />
            <span className="text-white/60 text-sm">{restaurant.rating}</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between text-white/60 text-sm">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {new Date(restaurant.date).toLocaleDateString()} • {restaurant.time}
        </div>
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {restaurant.party_size} people
        </div>
      </div>

      {restaurant.price_range && (
        <Badge className="text-sm bg-orange-500/20 text-orange-300 border-orange-500/30">
          {restaurant.price_range}
        </Badge>
      )}
    </div>
  </>
);