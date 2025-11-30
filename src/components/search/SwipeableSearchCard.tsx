import { useState, useRef, ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Heart, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SwipeableSearchCardProps {
  item: any;
  type: 'hotel' | 'flight' | 'activity' | 'car' | 'package';
  children: ReactNode;
  onSwipe?: (direction: 'left' | 'right') => void;
}

export const SwipeableSearchCard = ({
  item,
  type,
  children,
  onSwipe
}: SwipeableSearchCardProps) => {
  const { user } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  
  const startX = useRef(0);
  const currentX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    currentX.current = e.touches[0].clientX - startX.current;
    
    if (cardRef.current) {
      const rotation = currentX.current * 0.05;
      cardRef.current.style.transform = `translateX(${currentX.current}px) rotate(${rotation}deg)`;
      
      // Visual feedback
      if (Math.abs(currentX.current) > 50) {
        setSwipeDirection(currentX.current > 0 ? 'right' : 'left');
      } else {
        setSwipeDirection(null);
      }
    }
  };

  const handleTouchEnd = async () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    const threshold = 100;
    
    if (Math.abs(currentX.current) > threshold && user) {
      const direction = currentX.current > 0 ? 'right' : 'left';
      
      // Save to wishlist/cart
      try {
        await supabase.from('wishlist').insert({
          user_id: user.id,
          item_type: type,
          item_data: {
            ...item,
            liked: direction === 'right'
          }
        });
        
        toast.success(direction === 'right' ? '💚 Added to favorites!' : '👋 Passed');
        onSwipe?.(direction);
      } catch (error) {
        console.error('Error saving swipe:', error);
      }
    }
    
    // Reset
    if (cardRef.current) {
      cardRef.current.style.transform = '';
    }
    setSwipeDirection(null);
    currentX.current = 0;
  };

  return (
    <div className="relative">
      <Card
        ref={cardRef}
        className="touch-pan-y transition-transform"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
        
        {/* Swipe Indicators */}
        {swipeDirection === 'right' && (
          <div className="absolute top-4 left-4 bg-green-500/90 rounded-full p-3">
            <Heart className="h-6 w-6 text-white" />
          </div>
        )}
        {swipeDirection === 'left' && (
          <div className="absolute top-4 right-4 bg-red-500/90 rounded-full p-3">
            <X className="h-6 w-6 text-white" />
          </div>
        )}
      </Card>
    </div>
  );
};
