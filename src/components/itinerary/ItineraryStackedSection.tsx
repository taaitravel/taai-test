import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plane, MapPin, Calendar, Users, Star, Utensils, Plus, ChevronLeft, ChevronRight } from "lucide-react";

interface StackedCardProps {
  title: string;
  icon: React.ComponentType<any>;
  items: any[];
  itemType: string;
  onCardClick: (index: number) => void;
  renderCard: (item: any, index: number) => React.ReactNode;
  emptyMessage: string;
  onAddClick?: () => void;
  onEdit?: (type: any, index: number) => void;
  onDelete?: (type: string, index: number) => void;
}

export const ItineraryStackedSection = ({ 
  title, 
  icon: Icon, 
  items,
  itemType,
  onCardClick, 
  renderCard,
  emptyMessage,
  onAddClick,
  onEdit,
  onDelete
}: StackedCardProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };
  
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Icon className="h-5 w-5 mr-2" />
          {title}
        </h3>
        {typeof (onAddClick) !== 'undefined' && (
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Add ${title}`}
            onClick={onAddClick}
            className="text-white/80 hover:text-white hover:bg-white/10 border border-white/10"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {items.length > 0 ? (
        <div className="relative flex justify-center">
          <div className="relative w-[255px] h-[375px]">
            {items.slice(0, 3).map((item, stackIndex) => {
              const actualIndex = (currentIndex + stackIndex) % items.length;
              const displayItem = items[actualIndex];
              
              return (
                <Card 
                  key={actualIndex}
                  className="absolute w-full h-full trip-card-past cursor-pointer hover:shadow-lg hover:shadow-gray-500/10 transition-all duration-300 group"
                  style={{
                    transform: `translateY(${stackIndex * 10}px) translateX(${stackIndex * 5}px)`,
                    zIndex: 10 - stackIndex
                  }}
                  onClick={() => onCardClick(actualIndex)}
                >
                  <CardContent className="p-4 h-full flex flex-col justify-between">
                    <div className="flex-1 overflow-hidden">
                      {renderCard(displayItem, actualIndex)}
                    </div>
                    
                    {stackIndex === 0 && (onEdit || onDelete) && (
                      <div className="flex gap-2 pt-3 mt-2 border-t border-white/10">
                        {onEdit && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(itemType, actualIndex);
                            }}
                            className="flex-1 text-xs"
                          >
                            Edit
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Are you sure you want to delete this item?')) {
                                onDelete(itemType, actualIndex);
                              }
                            }}
                            className="flex-1 text-xs text-red-400 hover:text-red-300"
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            
            {items.length > 1 && (
              <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrev}
                  className="h-8 w-8 rounded-full bg-white/10 border-white/20 hover:bg-white/20"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="flex items-center text-xs text-white/60">
                  {currentIndex + 1} / {items.length}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNext}
                  className="h-8 w-8 rounded-full bg-white/10 border-white/20 hover:bg-white/20"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-white/50">
          <Icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
};

// Flight Card Renderer
export const FlightCardRenderer = (flight: any, index: number) => (
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

// Hotel Card Renderer
export const HotelCardRenderer = (hotel: any, index: number) => (
  <>
    <div>
      <div className="text-2xl mb-2 opacity-60">🏨</div>
      <h4 className="font-bold text-[#171822] text-base mb-1 line-clamp-2">
        {hotel.name}
      </h4>
      <p className="text-white/50 text-sm mb-2">{hotel.city}</p>
      <div className="flex flex-wrap gap-1 mb-2">
        <Badge className="text-sm bg-white/10 text-white/60 border-white/20">
          ${hotel.cost}
        </Badge>
      </div>
    </div>
    <div className="space-y-1">
      <div className="flex items-center text-sm text-white/50">
        <Calendar className="h-3 w-3 mr-1" />
        {hotel.nights} nights
      </div>
      <div className="flex items-center text-white/50">
        <Star className="h-3 w-3 fill-current mr-1" />
        <span className="text-sm">{hotel.rating}</span>
      </div>
    </div>
  </>
);

// Activity Card Renderer
export const ActivityCardRenderer = (activity: any, index: number) => (
  <>
    <div>
      <div className="text-2xl mb-2 opacity-60">🎯</div>
      <h4 className="font-bold text-[#171822] text-base mb-1 line-clamp-2">
        {activity.name}
      </h4>
      <p className="text-white/50 text-sm mb-2">{activity.city}</p>
      <div className="flex flex-wrap gap-1 mb-2">
        <Badge className="text-sm bg-white/10 text-white/60 border-white/20">
          ${activity.cost}
        </Badge>
      </div>
    </div>
    <div className="space-y-1">
      <div className="flex items-center text-sm text-white/50">
        <Calendar className="h-3 w-3 mr-1" />
        {new Date(activity.date).toLocaleDateString()}
      </div>
      <p className="text-white/50 text-sm">{activity.duration}</p>
    </div>
  </>
);

// Reservation Card Renderer
export const ReservationCardRenderer = (reservation: any, index: number) => (
  <>
    <div>
      <div className="text-2xl mb-2 opacity-60">
        {reservation.type === 'restaurant' ? '🍽️' : '📅'}
      </div>
      <h4 className="font-bold text-[#171822] text-base mb-1 line-clamp-2">
        {reservation.name}
      </h4>
      <p className="text-white/50 text-sm mb-2">{reservation.city}</p>
      <div className="flex flex-wrap gap-1 mb-2">
        <Badge className="text-sm bg-white/10 text-white/60 border-white/20">
          {reservation.type}
        </Badge>
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