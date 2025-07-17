import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Calendar, Users, Clock, Plane, Utensils } from 'lucide-react';

// Hotel Card Renderer
export const SwipeHotelRenderer = (hotel: any, isTop: boolean) => (
  <>
    {isTop && hotel.image && (
      <div className="relative h-48 overflow-hidden rounded-lg mb-4">
        <img 
          src={hotel.image} 
          alt={hotel.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2">
          <Badge className="bg-black/50 text-white">
            ${hotel.price}/night
          </Badge>
        </div>
        {hotel.rating && (
          <div className="absolute top-2 left-2 flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-white text-sm font-semibold">{hotel.rating}</span>
          </div>
        )}
      </div>
    )}
    
    <div className="space-y-3">
      <div>
        <h3 className="font-bold text-lg text-white">{hotel.name}</h3>
        <div className="flex items-center gap-1 text-white/70 text-sm">
          <MapPin className="h-3 w-3" />
          {hotel.location}
        </div>
      </div>
      
      {isTop && hotel.description && (
        <p className="text-white/80 text-sm line-clamp-2">
          {hotel.description}
        </p>
      )}
      
      {isTop && hotel.checkIn && hotel.checkOut && (
        <div className="flex items-center gap-4 text-xs text-white/60">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{hotel.checkIn}</span>
          </div>
          <span>→</span>
          <span>{hotel.checkOut}</span>
        </div>
      )}
      
      {!isTop && (
        <div className="flex items-center justify-between">
          <Badge className="text-sm bg-white/10 text-white/60 border-white/20">
            ${hotel.price}/night
          </Badge>
          {hotel.rating && (
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-400 fill-current" />
              <span className="text-white/60 text-sm">{hotel.rating}</span>
            </div>
          )}
        </div>
      )}
      
      {isTop && hotel.amenities && (
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

// Flight Card Renderer
export const SwipeFlightRenderer = (flight: any, isTop: boolean) => (
  <>
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Plane className="h-6 w-6 text-blue-400" />
        <div>
          <h3 className="font-bold text-lg text-white">
            {flight.airline} {flight.flight_number}
          </h3>
          <p className="text-white/70 text-sm">
            {flight.from} → {flight.to}
          </p>
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
        <Badge className="text-sm bg-blue-500/20 text-blue-300 border-blue-500/30">
          ${flight.cost || flight.price}
        </Badge>
        {flight.duration && (
          <div className="flex items-center gap-1 text-white/60 text-sm">
            <Clock className="h-3 w-3" />
            {flight.duration}
          </div>
        )}
      </div>
    </div>
  </>
);

// Activity Card Renderer
export const SwipeActivityRenderer = (activity: any, isTop: boolean) => (
  <>
    {isTop && activity.image && (
      <div className="relative h-32 overflow-hidden rounded-lg mb-3">
        <img 
          src={activity.image} 
          alt={activity.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2">
          <Badge className="bg-black/50 text-white">
            ${activity.price || activity.cost}
          </Badge>
        </div>
      </div>
    )}
    
    <div className="space-y-3">
      <div>
        <h3 className="font-bold text-lg text-white">{activity.name}</h3>
        <div className="flex items-center gap-1 text-white/70 text-sm">
          <MapPin className="h-3 w-3" />
          {activity.location || activity.city}
        </div>
      </div>
      
      {isTop && activity.description && (
        <p className="text-white/80 text-sm line-clamp-2">
          {activity.description}
        </p>
      )}
      
      <div className="flex items-center justify-between">
        <Badge className="text-sm bg-green-500/20 text-green-300 border-green-500/30">
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
  </>
);

// Restaurant Card Renderer
export const SwipeRestaurantRenderer = (restaurant: any, isTop: boolean) => (
  <>
    {isTop && restaurant.image && (
      <div className="relative h-32 overflow-hidden rounded-lg mb-3">
        <img 
          src={restaurant.image} 
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        {restaurant.rating && (
          <div className="absolute top-2 left-2 flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-white text-sm font-semibold">{restaurant.rating}</span>
          </div>
        )}
      </div>
    )}
    
    <div className="space-y-3">
      <div>
        <h3 className="font-bold text-lg text-white">{restaurant.name}</h3>
        <div className="flex items-center gap-1 text-white/70 text-sm">
          <MapPin className="h-3 w-3" />
          {restaurant.location || restaurant.city}
        </div>
      </div>
      
      {isTop && restaurant.description && (
        <p className="text-white/80 text-sm line-clamp-2">
          {restaurant.description}
        </p>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Utensils className="h-4 w-4 text-orange-400" />
          <span className="text-white/70 text-sm">{restaurant.cuisine || 'Restaurant'}</span>
        </div>
        {restaurant.rating && !isTop && (
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 text-yellow-400 fill-current" />
            <span className="text-white/60 text-sm">{restaurant.rating}</span>
          </div>
        )}
      </div>
      
      {restaurant.priceRange && (
        <Badge className="text-sm bg-orange-500/20 text-orange-300 border-orange-500/30">
          {restaurant.priceRange}
        </Badge>
      )}
      
      {isTop && restaurant.party_size && (
        <div className="flex items-center gap-1 text-white/60 text-sm">
          <Users className="h-3 w-3" />
          {restaurant.party_size} people
        </div>
      )}
    </div>
  </>
);