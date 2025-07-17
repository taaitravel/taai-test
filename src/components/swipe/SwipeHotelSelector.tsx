import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, X, Star, MapPin, Calendar, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Hotel {
  id: string;
  name: string;
  price: number;
  rating: number;
  location: string;
  checkIn: string;
  checkOut: string;
  amenities: string[];
  image: string;
  description: string;
  coordinates: { lat: number; lng: number };
  source: string;
}

interface SwipeHotelSelectorProps {
  hotels: Hotel[];
  itineraryId: string;
  onSwipeComplete?: (likedHotels: Hotel[], rejectedHotels: Hotel[]) => void;
  onHotelLiked?: (hotel: Hotel) => void;
  onHotelRejected?: (hotel: Hotel) => void;
}

export const SwipeHotelSelector: React.FC<SwipeHotelSelectorProps> = ({
  hotels,
  itineraryId,
  onSwipeComplete,
  onHotelLiked,
  onHotelRejected
}) => {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedHotels, setLikedHotels] = useState<Hotel[]>([]);
  const [rejectedHotels, setRejectedHotels] = useState<Hotel[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number>(0);
  const startY = useRef<number>(0);
  const currentX = useRef<number>(0);
  const currentY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  const currentHotel = hotels[currentIndex];
  const isComplete = currentIndex >= hotels.length;

  useEffect(() => {
    if (isComplete && onSwipeComplete) {
      onSwipeComplete(likedHotels, rejectedHotels);
    }
  }, [isComplete, likedHotels, rejectedHotels, onSwipeComplete]);

  const saveToCart = async (hotel: Hotel, action: 'liked' | 'rejected') => {
    if (!user || !itineraryId) {
      toast.error('User not authenticated or itinerary not found');
      return;
    }

    try {
      const { error } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          itinerary_id: itineraryId,
          type: action === 'liked' ? 'hotel_liked' : 'hotel_rejected',
          external_ref: hotel.id,
          price: hotel.price,
          item_data: {
            name: hotel.name,
            rating: hotel.rating,
            location: hotel.location,
            checkIn: hotel.checkIn,
            checkOut: hotel.checkOut,
            amenities: hotel.amenities,
            image: hotel.image,
            description: hotel.description,
            coordinates: hotel.coordinates,
            source: hotel.source,
            action: action
          }
        });

      if (error) throw error;

      if (action === 'liked') {
        toast.success(`${hotel.name} added to your preferences!`);
      }
    } catch (error) {
      console.error('Error saving hotel preference:', error);
      toast.error('Failed to save hotel preference');
    }
  };

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (isAnimating || !currentHotel) return;

    setIsAnimating(true);
    setSwipeDirection(direction);

    if (direction === 'right') {
      // Liked
      const updatedLiked = [...likedHotels, currentHotel];
      setLikedHotels(updatedLiked);
      await saveToCart(currentHotel, 'liked');
      onHotelLiked?.(currentHotel);
    } else {
      // Rejected
      const updatedRejected = [...rejectedHotels, currentHotel];
      setRejectedHotels(updatedRejected);
      await saveToCart(currentHotel, 'rejected');
      onHotelRejected?.(currentHotel);
    }

    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setSwipeDirection(null);
      setIsAnimating(false);
    }, 300);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAnimating) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || isAnimating) return;
    
    currentX.current = e.touches[0].clientX - startX.current;
    currentY.current = e.touches[0].clientY - startY.current;
    
    if (cardRef.current) {
      const rotation = currentX.current * 0.1;
      cardRef.current.style.transform = `translateX(${currentX.current}px) rotate(${rotation}deg)`;
      
      // Add visual feedback
      const opacity = 1 - Math.abs(currentX.current) / 300;
      cardRef.current.style.opacity = Math.max(0.7, opacity).toString();
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current || isAnimating) return;
    
    isDragging.current = false;
    
    if (cardRef.current) {
      cardRef.current.style.transform = '';
      cardRef.current.style.opacity = '1';
    }
    
    // Determine swipe direction based on distance
    const threshold = 100;
    if (Math.abs(currentX.current) > threshold) {
      handleSwipe(currentX.current > 0 ? 'right' : 'left');
    }
    
    currentX.current = 0;
    currentY.current = 0;
  };

  if (!hotels.length) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-white/70">
        <MapPin className="h-12 w-12 mb-4" />
        <p>No hotels available for swiping</p>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-white space-y-4">
        <Heart className="h-16 w-16 text-green-500" />
        <h3 className="text-2xl font-bold">Swipe Complete!</h3>
        <p className="text-white/70 text-center">
          You liked {likedHotels.length} hotels out of {hotels.length}
        </p>
        <div className="flex gap-2 flex-wrap justify-center max-w-md">
          {likedHotels.map((hotel, index) => (
            <Badge key={index} variant="secondary" className="bg-green-500/20 text-green-300">
              {hotel.name}
            </Badge>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6 max-w-md mx-auto">
      {/* Progress indicator */}
      <div className="w-full bg-white/20 rounded-full h-2">
        <div 
          className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex) / hotels.length) * 100}%` }}
        />
      </div>
      
      <div className="text-center text-white/70">
        {currentIndex + 1} of {hotels.length} hotels
      </div>

      {/* Hotel Card */}
      <div className="relative w-full max-w-sm h-96">
        <Card 
          ref={cardRef}
          className={`absolute inset-0 cursor-grab active:cursor-grabbing bg-white/10 border-white/20 text-white overflow-hidden transition-transform duration-300 ${
            swipeDirection === 'right' ? 'animate-slide-out-right' : 
            swipeDirection === 'left' ? 'animate-slide-out-left' : ''
          }`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="relative h-48 overflow-hidden">
            <img 
              src={currentHotel.image} 
              alt={currentHotel.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2">
              <Badge className="bg-black/50 text-white">
                ${currentHotel.price}/night
              </Badge>
            </div>
            <div className="absolute top-2 left-2 flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-white text-sm font-semibold">{currentHotel.rating}</span>
            </div>
          </div>
          
          <CardContent className="p-4 space-y-3">
            <div>
              <h3 className="font-bold text-lg">{currentHotel.name}</h3>
              <div className="flex items-center gap-1 text-white/70 text-sm">
                <MapPin className="h-3 w-3" />
                {currentHotel.location}
              </div>
            </div>
            
            <p className="text-white/80 text-sm line-clamp-2">
              {currentHotel.description}
            </p>
            
            <div className="flex items-center gap-4 text-xs text-white/60">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{currentHotel.checkIn}</span>
              </div>
              <span>→</span>
              <span>{currentHotel.checkOut}</span>
            </div>
            
            <div className="flex flex-wrap gap-1">
              {currentHotel.amenities.slice(0, 3).map((amenity, index) => (
                <Badge key={index} variant="outline" className="text-xs border-white/30 text-white/70">
                  {amenity}
                </Badge>
              ))}
              {currentHotel.amenities.length > 3 && (
                <Badge variant="outline" className="text-xs border-white/30 text-white/70">
                  +{currentHotel.amenities.length - 3}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action buttons */}
      <div className="flex gap-6">
        <Button
          onClick={() => handleSwipe('left')}
          disabled={isAnimating}
          size="lg"
          className="rounded-full w-16 h-16 bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500 text-red-400"
        >
          <X className="h-6 w-6" />
        </Button>
        
        <Button
          onClick={() => handleSwipe('right')}
          disabled={isAnimating}
          size="lg"
          className="rounded-full w-16 h-16 bg-green-500/20 hover:bg-green-500/30 border-2 border-green-500 text-green-400"
        >
          <Heart className="h-6 w-6" />
        </Button>
      </div>
      
      <div className="text-center text-white/50 text-sm">
        <p>Swipe right to like • Swipe left to pass</p>
      </div>
    </div>
  );
};