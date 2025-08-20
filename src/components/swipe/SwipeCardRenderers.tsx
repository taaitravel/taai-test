import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ImageGallery } from '@/components/ui/image-gallery';
import { Star, MapPin, Calendar, Users, Clock, Plane, Utensils, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

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

// Hotel Card Renderer
export const SwipeHotelRenderer = (hotel: any, isTop: boolean) => (
  <div className="space-y-3">
    {(hotel.images || hotel.image) && (
      <ImageGallery
        images={hotel.images || (hotel.image ? [hotel.image] : [])}
        alt={hotel.name}
        aspectRatio="wide"
        className="mb-3 rounded-lg overflow-hidden"
      />
    )}
    
    <div className="flex items-center justify-between">
      <h3 className="font-bold text-lg text-white">{hotel.name}</h3>
      {hotel.rating && (
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 text-yellow-400 fill-current" />
          <span className="text-white/60 text-sm">{hotel.rating}</span>
        </div>
      )}
    </div>
    
    <div className="flex items-center gap-1 text-white/70 text-sm">
      <MapPin className="h-3 w-3" />
      {hotel.location}
    </div>
    
    <div className="flex items-center justify-between">
      <Badge className="bg-white/10 text-white/60 border-white/20">
        ${hotel.price || hotel.cost}
      </Badge>
      {hotel.nights && (
        <span className="text-white/60 text-sm">{hotel.nights} nights</span>
      )}
    </div>
  </div>
);

// Flight Card Renderer
export const SwipeFlightRenderer = (flight: any, isTop: boolean) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2">
      <Plane className="h-6 w-6 text-blue-400" />
      <div className="flex-1">
        <h3 className="font-bold text-lg text-white">
          {flight.airline} {flight.flight_number}
        </h3>
        <p className="text-white/70 text-sm">
          {flight.from} → {flight.to}
        </p>
      </div>
    </div>
    
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
    
    <div className="flex items-center justify-between">
      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
        ${flight.cost}
      </Badge>
      {flight.duration && (
        <div className="flex items-center gap-1 text-white/60 text-sm">
          <Clock className="h-3 w-3" />
          {flight.duration}
        </div>
      )}
    </div>
  </div>
);

// Activity Card Renderer
export const SwipeActivityRenderer = (activity: any, isTop: boolean) => (
  <div className="space-y-3">
    {(activity.images || activity.image) && (
      <ImageGallery
        images={activity.images || (activity.image ? [activity.image] : [])}
        alt={activity.name}
        aspectRatio="wide"
        className="mb-3 rounded-lg overflow-hidden"
      />
    )}
    
    <div className="flex items-center justify-between">
      <h3 className="font-bold text-lg text-white">{activity.name}</h3>
      {activity.rating && (
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 text-yellow-400 fill-current" />
          <span className="text-white/60 text-sm">{activity.rating}</span>
        </div>
      )}
    </div>
    
    <div className="flex items-center gap-1 text-white/70 text-sm">
      <MapPin className="h-3 w-3" />
      {activity.location || activity.city}
    </div>
    
    <div className="flex items-center justify-between">
      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
        ${activity.price || activity.cost}
      </Badge>
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
  </div>
);

// Restaurant Card Renderer
export const SwipeRestaurantRenderer = (restaurant: any, isTop: boolean) => (
  <div className="space-y-3">
    {(restaurant.images || restaurant.image) && (
      <ImageGallery
        images={restaurant.images || (restaurant.image ? [restaurant.image] : [])}
        alt={restaurant.name}
        aspectRatio="wide"
        className="mb-3 rounded-lg overflow-hidden"
      />
    )}
    
    <div className="flex items-center justify-between">
      <h3 className="font-bold text-lg text-white">{restaurant.name}</h3>
      {restaurant.rating && (
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 text-yellow-400 fill-current" />
          <span className="text-white/60 text-sm">{restaurant.rating}</span>
        </div>
      )}
    </div>
    
    <div className="flex items-center gap-1 text-white/70 text-sm">
      <MapPin className="h-3 w-3" />
      {restaurant.location || restaurant.city}
    </div>
    
    <div className="flex items-center gap-2">
      <Utensils className="h-4 w-4 text-orange-400" />
      <span className="text-white/70 text-sm">{restaurant.cuisine || restaurant.type || 'Restaurant'}</span>
    </div>
    
    {restaurant.priceRange && (
      <Badge className="text-sm bg-orange-500/20 text-orange-300 border-orange-500/30">
        {restaurant.priceRange}
      </Badge>
    )}
    
    <div className="flex items-center justify-between text-white/60 text-sm">
      <div className="flex items-center gap-1">
        <Calendar className="h-3 w-3" />
        {restaurant.date && new Date(restaurant.date).toLocaleDateString()} • {restaurant.time}
      </div>
      {restaurant.party_size && (
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {restaurant.party_size} people
        </div>
      )}
    </div>
  </div>
);