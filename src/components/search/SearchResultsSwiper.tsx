import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Heart, Plus } from 'lucide-react';
import { HotelResultCard } from './cards/HotelResultCard';
import { FlightResultCard } from './cards/FlightResultCard';
import { ActivityResultCard } from './cards/ActivityResultCard';
import { PackageResultCard } from './cards/PackageResultCard';

interface SearchResultsSwiperProps {
  results: any[];
  searchType: 'hotel' | 'flight' | 'activity' | 'package';
  searchParams: any;
}

export const SearchResultsSwiper = ({ results, searchType, searchParams }: SearchResultsSwiperProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % results.length);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + results.length) % results.length);
  };

  const toggleFavorite = () => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(currentIndex)) {
        newFavorites.delete(currentIndex);
      } else {
        newFavorites.add(currentIndex);
      }
      return newFavorites;
    });
  };

  const currentResult = results[currentIndex];
  const isFavorite = favorites.has(currentIndex);

  const renderCard = () => {
    switch (searchType) {
      case 'hotel':
        return <HotelResultCard hotel={currentResult} />;
      case 'flight':
        return <FlightResultCard flight={currentResult} />;
      case 'activity':
        return <ActivityResultCard activity={currentResult} />;
      case 'package':
        return <PackageResultCard package={currentResult} />;
      default:
        return null;
    }
  };

  return (
    <div className="relative">
      {/* Results counter */}
      <div className="text-center mb-4">
        <p className="text-white/60">
          {currentIndex + 1} of {results.length} results
        </p>
      </div>

      {/* Card stack */}
      <div className="relative min-h-[500px] flex items-center justify-center">
        {/* Background cards for depth effect */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Card className="w-full max-w-2xl h-[480px] bg-white/5 border-white/10 blur-sm opacity-50" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Card className="w-full max-w-2xl h-[490px] bg-white/5 border-white/10 blur-sm opacity-30" />
        </div>

        {/* Main card */}
        <Card className="relative w-full max-w-2xl bg-gradient-to-br from-white/10 to-white/5 border-white/20 backdrop-blur-lg overflow-hidden z-10">
          {renderCard()}
        </Card>
      </div>

      {/* Navigation controls */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevious}
          className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
          disabled={results.length <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={toggleFavorite}
          className={`${
            isFavorite ? 'bg-red-500/20 border-red-500/50 text-red-500' : 'bg-white/10 border-white/20 text-white'
          } hover:bg-red-500/30`}
        >
          <Heart className={isFavorite ? 'fill-current' : ''} />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="bg-primary/20 border-primary/50 text-primary hover:bg-primary/30"
        >
          <Plus className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
          disabled={results.length <= 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
