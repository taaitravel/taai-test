import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ChevronLeft, ChevronRight, Star, Calendar, Users, Clock, MapPin } from "lucide-react";

interface ItineraryBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  items: any[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  title: string;
  type: 'flights' | 'hotels' | 'activities' | 'reservations';
  onEdit?: (index: number) => void;
}

export const ItineraryBrowser = ({ 
  isOpen, 
  onClose, 
  items, 
  currentIndex, 
  onIndexChange,
  title,
  type,
  onEdit
}: ItineraryBrowserProps) => {
  if (!isOpen || items.length === 0) return null;

  const currentItem = items[currentIndex];

  const renderItemDetails = () => {
    switch (type) {
      case 'flights':
        return (
          <>
            <div className="text-6xl mb-4 text-center">✈️</div>
            <h2 className="text-2xl font-bold text-white mb-2 text-center">
              {currentItem.airline} {currentItem.flight_number}
            </h2>
            <p className="text-white/70 text-center mb-4">
              {currentItem.from} → {currentItem.to}
            </p>
            
            <div className="space-y-3 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-white/70">Departure:</p>
                  <p className="text-white">{new Date(currentItem.departure).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-white/70">Arrival:</p>
                  <p className="text-white">{new Date(currentItem.arrival).toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              ${currentItem.cost}
            </Badge>
          </>
        );
        
      case 'hotels':
        return (
          <>
            <div className="text-6xl mb-4 text-center">🏨</div>
            <h2 className="text-2xl font-bold text-white mb-2 text-center">
              {currentItem.name}
            </h2>
            <p className="text-white/70 text-center mb-4">
              {currentItem.city}
            </p>
            
            <div className="space-y-3 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-white/70">Check-in:</p>
                  <p className="text-white">{new Date(currentItem.check_in).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-white/70">Check-out:</p>
                  <p className="text-white">{new Date(currentItem.check_out).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center text-white/70">
                <Clock className="h-4 w-4 mr-2" />
                <span className="text-sm">{currentItem.nights} nights</span>
              </div>
              <div className="flex items-center text-yellow-400">
                <Star className="h-4 w-4 fill-current mr-2" />
                <span className="text-sm">{currentItem.rating} stars</span>
              </div>
            </div>
            
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              ${currentItem.cost}
            </Badge>
          </>
        );
        
      case 'activities':
        return (
          <>
            <div className="text-6xl mb-4 text-center">🎯</div>
            <h2 className="text-2xl font-bold text-white mb-2 text-center">
              {currentItem.name}
            </h2>
            <p className="text-white/70 text-center mb-4">
              {currentItem.city}
            </p>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-white/70">
                <Calendar className="h-4 w-4 mr-2" />
                <span className="text-sm">{new Date(currentItem.date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center text-white/70">
                <Clock className="h-4 w-4 mr-2" />
                <span className="text-sm">{currentItem.duration}</span>
              </div>
            </div>
            
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
              ${currentItem.cost}
            </Badge>
          </>
        );
        
      case 'reservations':
        return (
          <>
            <div className="text-6xl mb-4 text-center">
              {currentItem.type === 'restaurant' ? '🍽️' : '📅'}
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 text-center">
              {currentItem.name}
            </h2>
            <p className="text-white/70 text-center mb-4">
              {currentItem.city}
            </p>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-white/70">
                <Calendar className="h-4 w-4 mr-2" />
                <span className="text-sm">
                  {new Date(currentItem.date).toLocaleDateString()} at {currentItem.time}
                </span>
              </div>
              <div className="flex items-center text-white/70">
                <Users className="h-4 w-4 mr-2" />
                <span className="text-sm">
                  {currentItem.party_size} {currentItem.party_size === 1 ? 'person' : 'people'}
                </span>
              </div>
              {currentItem.type === 'restaurant' && (
                <>
                  <div className="flex items-center text-white/70">
                    <span className="text-sm">🍴 Cuisine: Italian • Fine Dining</span>
                  </div>
                  <div className="flex items-center text-yellow-400">
                    <Star className="h-4 w-4 fill-current mr-1" />
                    <Star className="h-4 w-4 fill-current mr-1" />
                    <Star className="h-4 w-4 fill-current mr-1" />
                    <Star className="h-4 w-4 fill-current mr-1" />
                    <Star className="h-4 w-4 mr-2" />
                    <span className="text-sm text-white/70">4.2 • $$$ • 1,247 reviews</span>
                  </div>
                </>
              )}
            </div>
            
            <Badge className={`${
              currentItem.type === 'restaurant' 
                ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' 
                : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
            }`}>
              {currentItem.type}
            </Badge>
          </>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        {/* Close and Edit Buttons */}
        <div className="absolute -top-12 right-0 flex items-center gap-2 z-10">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10"
            onClick={() => onEdit && onEdit(currentIndex)}
            disabled={!onEdit}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Counter */}
        <div className="absolute -top-12 left-0 text-white/70 text-sm">
          {currentIndex + 1} of {items.length} {title}
        </div>

        {/* Main Card */}
        <Card className="w-full aspect-[3/4] bg-[#171821]/80 border-white/30 backdrop-blur-md animate-scale-in">
          <CardContent className="p-6 h-full flex flex-col justify-between">
            <div className="flex-1">
              {renderItemDetails()}
            </div>
          </CardContent>
        </Card>

        {/* Navigation Controls */}
        <div className="flex justify-center space-x-4 mt-6">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 p-3 rounded-full"
            onClick={() => onIndexChange(currentIndex > 0 ? currentIndex - 1 : items.length - 1)}
            disabled={items.length <= 1}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 p-3 rounded-full"
            onClick={() => onIndexChange(currentIndex < items.length - 1 ? currentIndex + 1 : 0)}
            disabled={items.length <= 1}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Indicators */}
        <div className="flex justify-center space-x-2 mt-4">
          {items.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentIndex ? 'bg-white' : 'bg-white/30'
              }`}
              onClick={() => onIndexChange(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};