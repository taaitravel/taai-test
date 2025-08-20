import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ImageGallery } from '@/components/ui/image-gallery';
import { Star, Calendar, Users, Plane, Utensils } from 'lucide-react';

// Enhanced Hotel Card Renderer with Images
export const EnhancedHotelCardRenderer = (hotel: any, index: number) => (
  <>
    <div>
      {(hotel.images || hotel.image) && (
        <ImageGallery
          images={hotel.images || (hotel.image ? [hotel.image] : [])}
          alt={hotel.name}
          aspectRatio="wide"
          className="mb-3 rounded-lg overflow-hidden"
        />
      )}
      <div className="text-2xl mb-2 opacity-60">🏨</div>
      <h4 className="font-bold text-[#171822] text-base mb-1 line-clamp-2">
        {hotel.name}
      </h4>
      <p className="text-white/50 text-sm mb-2">{hotel.location || hotel.city}</p>
      <div className="flex flex-wrap gap-1 mb-2">
        <Badge className="text-sm bg-white/10 text-white/60 border-white/20">
          ${hotel.price || hotel.cost}
        </Badge>
        {hotel.rating && (
          <div className="flex items-center gap-1 text-white/60 text-sm">
            <Star className="h-3 w-3 text-yellow-400 fill-current" />
            {hotel.rating}
          </div>
        )}
      </div>
    </div>
    <div className="space-y-1">
      {hotel.nights && (
        <div className="flex items-center text-sm text-white/50">
          <Calendar className="h-3 w-3 mr-1" />
          {hotel.nights} nights
        </div>
      )}
    </div>
  </>
);

// Enhanced Flight Card Renderer 
export const EnhancedFlightCardRenderer = (flight: any, index: number) => (
  <>
    <div>
      <div className="text-2xl mb-2 opacity-60">✈️</div>
      <h4 className="font-bold text-[#171822] text-base mb-1 line-clamp-2">
        {flight.airline} {flight.flight_number}
      </h4>
      <p className="text-white/50 text-sm mb-2">
        {flight.from} → {flight.to}
      </p>
      <div className="flex flex-wrap gap-1 mb-2">
        <Badge className="text-sm bg-white/10 text-white/60 border-white/20">
          ${flight.cost}
        </Badge>
      </div>
    </div>
    <div className="space-y-1">
      <div className="flex items-center text-sm text-white/50">
        <Calendar className="h-3 w-3 mr-1" />
        {new Date(flight.departure).toLocaleDateString()}
      </div>
      <p className="text-white/50 text-sm">
        {new Date(flight.departure).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
      </p>
    </div>
  </>
);

// Enhanced Activity Card Renderer with Images
export const EnhancedActivityCardRenderer = (activity: any, index: number) => (
  <>
    <div>
      {(activity.images || activity.image) && (
        <ImageGallery
          images={activity.images || (activity.image ? [activity.image] : [])}
          alt={activity.name}
          aspectRatio="wide"
          className="mb-3 rounded-lg overflow-hidden"
        />
      )}
      <div className="text-2xl mb-2 opacity-60">🎯</div>
      <h4 className="font-bold text-[#171822] text-base mb-1 line-clamp-2">
        {activity.name}
      </h4>
      <p className="text-white/50 text-sm mb-2">{activity.location || activity.city}</p>
      <div className="flex flex-wrap gap-1 mb-2">
        <Badge className="text-sm bg-white/10 text-white/60 border-white/20">
          ${activity.price || activity.cost}
        </Badge>
        {activity.rating && (
          <div className="flex items-center gap-1 text-white/60 text-sm">
            <Star className="h-3 w-3 text-yellow-400 fill-current" />
            {activity.rating}
          </div>
        )}
      </div>
    </div>
    <div className="space-y-1">
      {activity.date && (
        <div className="flex items-center text-sm text-white/50">
          <Calendar className="h-3 w-3 mr-1" />
          {new Date(activity.date).toLocaleDateString()}
        </div>
      )}
      {activity.duration && (
        <p className="text-white/50 text-sm">{activity.duration}</p>
      )}
    </div>
  </>
);

// Enhanced Reservation Card Renderer with Images
export const EnhancedReservationCardRenderer = (reservation: any, index: number) => (
  <>
    <div>
      {(reservation.images || reservation.image) && (
        <ImageGallery
          images={reservation.images || (reservation.image ? [reservation.image] : [])}
          alt={reservation.name}
          aspectRatio="wide"
          className="mb-3 rounded-lg overflow-hidden"
        />
      )}
      <div className="text-2xl mb-2 opacity-60">
        {reservation.type === 'restaurant' ? '🍽️' : '📅'}
      </div>
      <h4 className="font-bold text-[#171822] text-base mb-1 line-clamp-2">
        {reservation.name}
      </h4>
      <p className="text-white/50 text-sm mb-2">{reservation.location || reservation.city}</p>
      <div className="flex flex-wrap gap-1 mb-2">
        <Badge className="text-sm bg-white/10 text-white/60 border-white/20">
          {reservation.type}
        </Badge>
        {reservation.cuisine && (
          <Badge className="text-sm bg-orange-500/20 text-orange-300 border-orange-500/30">
            {reservation.cuisine}
          </Badge>
        )}
      </div>
    </div>
    <div className="space-y-1">
      <div className="flex items-center text-sm text-white/50">
        <Users className="h-3 w-3 mr-1" />
        {reservation.party_size} people
      </div>
      <p className="text-white/50 text-sm">
        {new Date(reservation.date).toLocaleDateString()} • {reservation.time}
      </p>
    </div>
  </>
);