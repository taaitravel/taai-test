import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, MapPin, Calendar, Users, Star, Utensils } from "lucide-react";

interface StackedCardProps {
  title: string;
  icon: React.ComponentType<any>;
  items: any[];
  onCardClick: (index: number) => void;
  renderCard: (item: any, index: number) => React.ReactNode;
  emptyMessage: string;
}

export const ItineraryStackedSection = ({ 
  title, 
  icon: Icon, 
  items, 
  onCardClick, 
  renderCard,
  emptyMessage 
}: StackedCardProps) => {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <Icon className="h-5 w-5 mr-2" />
        {title}
      </h3>
      
      {items.length > 0 ? (
        <div className="relative h-[300px]">
          {items.slice(0, 3).map((item, index) => (
            <Card 
              key={index}
              className="absolute w-full aspect-[16/20] bg-[#171821]/80 border-white/30 backdrop-blur-md cursor-pointer hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 group"
              style={{
                transform: `translateY(${index * 10}px) translateX(${index * 5}px)`,
                zIndex: 10 - index
              }}
              onClick={() => onCardClick(index)}
            >
              <CardContent className="p-4 h-full flex flex-col justify-between">
                {renderCard(item, index)}
              </CardContent>
            </Card>
          ))}
          
          {items.length > 3 && (
            <div className="absolute bottom-0 right-0 bg-white/20 backdrop-blur-md rounded-full px-3 py-1 text-xs text-white border border-white/30">
              +{items.length - 3} more
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-white/50">
          <Icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
};

// Flight Card Renderer
export const FlightCardRenderer = (flight: any, index: number) => (
  <>
    <div>
      <div className="text-2xl mb-2">✈️</div>
      <h4 className="font-bold text-white text-sm mb-1 line-clamp-2">
        {flight.airline} {flight.flight_number}
      </h4>
      <p className="text-white/70 text-xs mb-2">
        {flight.from} → {flight.to}
      </p>
      <div className="flex flex-wrap gap-1 mb-2">
        <Badge className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
          ${flight.cost}
        </Badge>
      </div>
    </div>
    <div className="space-y-1">
      <div className="flex items-center text-xs text-white/70">
        <Calendar className="h-3 w-3 mr-1" />
        {new Date(flight.departure).toLocaleDateString()}
      </div>
      <p className="text-white/60 text-xs">
        {new Date(flight.departure).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
      </p>
    </div>
  </>
);

// Hotel Card Renderer
export const HotelCardRenderer = (hotel: any, index: number) => (
  <>
    <div>
      <div className="text-2xl mb-2">🏨</div>
      <h4 className="font-bold text-white text-sm mb-1 line-clamp-2">
        {hotel.name}
      </h4>
      <p className="text-white/70 text-xs mb-2">{hotel.city}</p>
      <div className="flex flex-wrap gap-1 mb-2">
        <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
          ${hotel.cost}
        </Badge>
      </div>
    </div>
    <div className="space-y-1">
      <div className="flex items-center text-xs text-white/70">
        <Calendar className="h-3 w-3 mr-1" />
        {hotel.nights} nights
      </div>
      <div className="flex items-center text-yellow-400">
        <Star className="h-3 w-3 fill-current mr-1" />
        <span className="text-xs">{hotel.rating}</span>
      </div>
    </div>
  </>
);

// Activity Card Renderer
export const ActivityCardRenderer = (activity: any, index: number) => (
  <>
    <div>
      <div className="text-2xl mb-2">🎯</div>
      <h4 className="font-bold text-white text-sm mb-1 line-clamp-2">
        {activity.name}
      </h4>
      <p className="text-white/70 text-xs mb-2">{activity.city}</p>
      <div className="flex flex-wrap gap-1 mb-2">
        <Badge className="text-xs bg-purple-500/20 text-purple-400 border-purple-500/30">
          ${activity.cost}
        </Badge>
      </div>
    </div>
    <div className="space-y-1">
      <div className="flex items-center text-xs text-white/70">
        <Calendar className="h-3 w-3 mr-1" />
        {new Date(activity.date).toLocaleDateString()}
      </div>
      <p className="text-white/60 text-xs">{activity.duration}</p>
    </div>
  </>
);

// Reservation Card Renderer
export const ReservationCardRenderer = (reservation: any, index: number) => (
  <>
    <div>
      <div className="text-2xl mb-2">
        {reservation.type === 'restaurant' ? '🍽️' : '📅'}
      </div>
      <h4 className="font-bold text-white text-sm mb-1 line-clamp-2">
        {reservation.name}
      </h4>
      <p className="text-white/70 text-xs mb-2">{reservation.city}</p>
      <div className="flex flex-wrap gap-1 mb-2">
        <Badge className={`text-xs ${
          reservation.type === 'restaurant' 
            ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' 
            : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
        }`}>
          {reservation.type}
        </Badge>
      </div>
    </div>
    <div className="space-y-1">
      <div className="flex items-center text-xs text-white/70">
        <Users className="h-3 w-3 mr-1" />
        {reservation.party_size} people
      </div>
      <p className="text-white/60 text-xs">
        {new Date(reservation.date).toLocaleDateString()} • {reservation.time}
      </p>
    </div>
  </>
);