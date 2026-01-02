import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FlightResultCard } from '@/components/search/cards/FlightResultCard';
import { HotelResultCard } from '@/components/search/cards/HotelResultCard';
import { ActivityResultCard } from '@/components/search/cards/ActivityResultCard';

interface ChatResultsCarouselProps {
  results: any[];
  resultType: 'hotels' | 'flights' | 'activities' | 'restaurants';
  constraintSummary?: string;
}

export const ChatResultsCarousel: React.FC<ChatResultsCarouselProps> = ({
  results,
  resultType,
  constraintSummary,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!results || results.length === 0) {
    return null;
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
  };

  const currentResult = results[currentIndex];

  const getDiversityLabelColor = (label: string) => {
    switch (label) {
      case 'Best Overall':
        return 'bg-gradient-to-r from-orange-500 to-red-500';
      case 'Best Value':
        return 'bg-gradient-to-r from-green-500 to-emerald-500';
      case 'Best Location':
        return 'bg-gradient-to-r from-blue-500 to-purple-500';
      case 'Fastest':
        return 'bg-gradient-to-r from-sky-500 to-blue-500';
      default:
        return 'bg-white/20';
    }
  };

  const renderCard = () => {
    switch (resultType) {
      case 'flights':
        return <FlightResultCard flight={currentResult} />;
      case 'hotels':
        return <HotelResultCard hotel={currentResult} />;
      case 'activities':
        return <ActivityResultCard activity={currentResult} />;
      case 'restaurants':
        // Render restaurant as activity for now
        return <ActivityResultCard activity={currentResult} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full py-4">
      {/* Constraint Summary */}
      {constraintSummary && (
        <p className="text-white/70 text-sm mb-3 italic">{constraintSummary}</p>
      )}

      {/* Card Container */}
      <div className="relative flex items-center justify-center">
        {/* Previous Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrevious}
          className="absolute left-0 z-10 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
          disabled={results.length <= 1}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        {/* Card with Diversity Label */}
        <div className="relative">
          {/* Diversity Label Badge */}
          {currentResult.diversityLabel && (
            <Badge 
              className={`absolute -top-2 left-4 z-20 ${getDiversityLabelColor(currentResult.diversityLabel)} text-white text-xs font-semibold px-3 py-1 shadow-lg`}
            >
              {currentResult.diversityLabel}
            </Badge>
          )}

          {/* Fixed-size Card Container */}
          <div 
            className="w-[255px] h-[375px] rounded-lg border border-white/20 overflow-hidden"
            style={{ 
              background: 'linear-gradient(to bottom right, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
              boxShadow: '0 4px 20px rgba(192,192,192,0.15)'
            }}
          >
            {renderCard()}
          </div>
        </div>

        {/* Next Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNext}
          className="absolute right-0 z-10 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
          disabled={results.length <= 1}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Position Indicator */}
      <div className="flex items-center justify-center mt-4 gap-2">
        <span className="text-white/60 text-sm">
          {currentIndex + 1} of {results.length}
        </span>
        
        {/* Dot indicators */}
        <div className="flex gap-1 ml-2">
          {results.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentIndex 
                  ? 'bg-orange-500 w-4' 
                  : 'bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
