import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, X, ArrowLeft, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SwipeItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  description?: string;
  [key: string]: any;
}

interface SwipeSelectorProps<T extends SwipeItem> {
  items: T[];
  type: 'hotel' | 'flight' | 'activity' | 'restaurant';
  itineraryId: string;
  onSwipeComplete?: (likedItems: T[], rejectedItems: T[]) => void;
  onItemLiked?: (item: T) => void;
  onItemRejected?: (item: T) => void;
  onBack?: () => void;
  renderCard: (item: T, isTop: boolean) => React.ReactNode;
  emptyIcon: React.ComponentType<any>;
  title: string;
}

export function SwipeSelector<T extends SwipeItem>({
  items,
  type,
  itineraryId,
  onSwipeComplete,
  onItemLiked,
  onItemRejected,
  onBack,
  renderCard,
  emptyIcon: EmptyIcon,
  title
}: SwipeSelectorProps<T>) {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedItems, setLikedItems] = useState<T[]>([]);
  const [rejectedItems, setRejectedItems] = useState<T[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number>(0);
  const startY = useRef<number>(0);
  const currentX = useRef<number>(0);
  const currentY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  const currentItem = items[currentIndex];
  const isComplete = currentIndex >= items.length;

  useEffect(() => {
    if (isComplete && onSwipeComplete) {
      onSwipeComplete(likedItems, rejectedItems);
    }
  }, [isComplete, likedItems, rejectedItems, onSwipeComplete]);

  const saveToCart = async (item: T, action: 'liked' | 'rejected') => {
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
          type: action === 'liked' ? `${type}_liked` : `${type}_rejected`,
          external_ref: item.id,
          price: item.price,
          item_data: {
            ...item,
            action: action
          }
        });

      if (error) throw error;

      if (action === 'liked') {
        toast.success(`${item.name} added to your preferences!`);
      }
    } catch (error) {
      console.error(`Error saving ${type} preference:`, error);
      toast.error(`Failed to save ${type} preference`);
    }
  };

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (isAnimating || !currentItem) return;

    setIsAnimating(true);
    setSwipeDirection(direction);

    if (direction === 'right') {
      const updatedLiked = [...likedItems, currentItem];
      setLikedItems(updatedLiked);
      await saveToCart(currentItem, 'liked');
      onItemLiked?.(currentItem);
    } else {
      const updatedRejected = [...rejectedItems, currentItem];
      setRejectedItems(updatedRejected);
      await saveToCart(currentItem, 'rejected');
      onItemRejected?.(currentItem);
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
    
    const threshold = 100;
    if (Math.abs(currentX.current) > threshold) {
      handleSwipe(currentX.current > 0 ? 'right' : 'left');
    }
    
    currentX.current = 0;
    currentY.current = 0;
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setLikedItems([]);
    setRejectedItems([]);
    setSwipeDirection(null);
    setIsAnimating(false);
  };

  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-white/70 space-y-4">
        <EmptyIcon className="h-12 w-12" />
        <p>No {type}s available for swiping</p>
        {onBack && (
          <Button onClick={onBack} variant="outline" className="border-white/20 text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        )}
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-white space-y-4">
        <Heart className="h-16 w-16 text-green-500" />
        <h3 className="text-2xl font-bold">Swipe Complete!</h3>
        <p className="text-white/70 text-center">
          You liked {likedItems.length} {type}s out of {items.length}
        </p>
        
        {likedItems.length > 0 && (
          <div className="flex gap-2 flex-wrap justify-center max-w-md">
            {likedItems.map((item, index) => (
              <Badge key={index} variant="secondary" className="bg-green-500/20 text-green-300">
                {item.name}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex gap-4">
          <Button onClick={handleRestart} variant="outline" className="border-white/20 text-white">
            <RotateCcw className="h-4 w-4 mr-2" />
            Swipe Again
          </Button>
          {onBack && (
            <Button onClick={onBack} variant="outline" className="border-white/20 text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        {onBack && (
          <Button onClick={onBack} variant="ghost" size="sm" className="text-white/70 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <h2 className="text-xl font-semibold text-white flex-1 text-center">{title}</h2>
        <div className="w-8" />
      </div>

      {/* Progress indicator */}
      <div className="w-full bg-white/20 rounded-full h-2">
        <div 
          className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex) / items.length) * 100}%` }}
        />
      </div>
      
      <div className="text-center text-white/70">
        {currentIndex + 1} of {items.length} {type}s
      </div>

      {/* Stacked Cards Container */}
      <div className="relative w-full max-w-sm h-96">
        {/* Background cards for stack effect */}
        {items.slice(currentIndex + 1, currentIndex + 4).map((item, index) => (
          <Card 
            key={`bg-${currentIndex + 1 + index}`}
            className="absolute inset-0 bg-white/5 border-white/10 text-white"
            style={{
              transform: `translateY(${(index + 1) * 8}px) translateX(${(index + 1) * 4}px) scale(${1 - (index + 1) * 0.02})`,
              zIndex: 10 - (index + 1),
              opacity: 0.6 - index * 0.2
            }}
          >
            <CardContent className="p-4 h-full flex flex-col justify-between">
              {renderCard(item, false)}
            </CardContent>
          </Card>
        ))}

        {/* Top interactive card */}
        <Card 
          ref={cardRef}
          className={`absolute inset-0 cursor-grab active:cursor-grabbing bg-white/10 border-white/20 text-white overflow-hidden transition-transform duration-300 ${
            swipeDirection === 'right' ? 'animate-slide-out-right' : 
            swipeDirection === 'left' ? 'animate-slide-out-left' : ''
          }`}
          style={{ zIndex: 20 }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <CardContent className="p-4 h-full flex flex-col justify-between">
            {renderCard(currentItem, true)}
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
}