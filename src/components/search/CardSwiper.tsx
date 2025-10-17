import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Heart, Plus, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CardSwiperProps {
  results: any[];
  renderCard: (item: any, onExpand: () => void) => React.ReactNode;
  onAddToItinerary: (item: any) => void;
  onAddToWishlist: (item: any) => void;
  searchType: string;
}

export const CardSwiper = ({
  results,
  renderCard,
  onAddToItinerary,
  onAddToWishlist,
  searchType,
}: CardSwiperProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    if (direction) {
      const timer = setTimeout(() => setDirection(null), 300);
      return () => clearTimeout(timer);
    }
  }, [direction]);

  if (results.length === 0) {
    return null;
  }

  const currentItem = results[currentIndex];
  const nextIndex = (currentIndex + 1) % results.length;
  const prevIndex = (currentIndex - 1 + results.length) % results.length;

  const handleNext = () => {
    setDirection('right');
    setCurrentIndex(nextIndex);
  };

  const handlePrev = () => {
    setDirection('left');
    setCurrentIndex(prevIndex);
  };

  const handleToggleFavorite = () => {
    const newFavorites = new Set(favorites);
    if (favorites.has(currentIndex)) {
      newFavorites.delete(currentIndex);
      toast({
        title: 'Removed from favorites',
        variant: 'default',
      });
    } else {
      newFavorites.add(currentIndex);
      onAddToWishlist(currentItem);
      toast({
        title: '♡ Added to favorites',
        variant: 'default',
      });
    }
    setFavorites(newFavorites);
  };

  const handleAddToItinerary = () => {
    onAddToItinerary(currentItem);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Enter') handleAddToItinerary();
      if (e.key === ' ') {
        e.preventDefault();
        setIsExpanded(!isExpanded);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isExpanded]);

  return (
    <div className="relative w-full max-w-3xl mx-auto px-4">
      {/* Results Counter */}
      <div className="text-center mb-4">
        <p className="text-white/70 text-sm">
          Viewing {currentIndex + 1} of {results.length} {searchType}
        </p>
      </div>

      {/* Card Stack */}
      <div className="relative h-[500px] md:h-[600px] mb-6">
        {/* Background cards for depth effect */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Card className="absolute w-[95%] h-[95%] bg-white/5 border-white/10 transform translate-y-2 scale-95 opacity-40 blur-sm" />
          <Card className="absolute w-[97%] h-[97%] bg-white/5 border-white/10 transform translate-y-1 scale-[0.97] opacity-60 blur-[1px]" />
        </div>

        {/* Main Card */}
        <div
          className={`absolute inset-0 transition-all duration-300 ${
            direction === 'right'
              ? 'transform translate-x-full opacity-0'
              : direction === 'left'
              ? 'transform -translate-x-full opacity-0'
              : 'transform translate-x-0 opacity-100'
          }`}
        >
          <Card className="w-full h-full bg-[#171821]/95 backdrop-blur-md border-white/30 shadow-2xl shadow-white/20 overflow-auto">
            <div className="p-6">
              {renderCard(currentItem, () => setIsExpanded(!isExpanded))}
            </div>
          </Card>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-center gap-4">
        <Button
          onClick={handlePrev}
          variant="outline"
          size="lg"
          className="bg-white/5 border-white/20 text-white hover:bg-white/10"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <Button
          onClick={handleToggleFavorite}
          variant="outline"
          size="lg"
          className={`bg-white/5 border-white/20 hover:bg-white/10 ${
            favorites.has(currentIndex) ? 'text-primary' : 'text-white'
          }`}
        >
          <Heart className={`h-5 w-5 ${favorites.has(currentIndex) ? 'fill-current' : ''}`} />
        </Button>

        <Button
          onClick={handleAddToItinerary}
          size="lg"
          className="gold-gradient hover:opacity-90 text-[#171821] font-semibold"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add to Trip
        </Button>

        <Button
          onClick={handleNext}
          variant="outline"
          size="lg"
          className="bg-white/5 border-white/20 text-white hover:bg-white/10"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Touch Swipe Instructions */}
      <p className="text-center text-white/50 text-xs mt-4 md:hidden">
        Swipe left or right to browse
      </p>
    </div>
  );
};
