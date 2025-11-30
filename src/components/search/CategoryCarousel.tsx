import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HotelSearchCard } from './cards/HotelSearchCard';
import { FlightSearchCard } from './cards/FlightSearchCard';
import { ActivitySearchCard } from './cards/ActivitySearchCard';
import { PackageSearchCard } from './cards/PackageSearchCard';
import { CarSearchCard } from './cards/CarSearchCard';
import { SearchType } from './AdaptiveSearchForm';

interface CategoryCarouselProps {
  categoryName: string;
  categoryIcon: string;
  items: any[];
  searchType: SearchType;
  searchParams: any;
}

export const CategoryCarousel = ({
  categoryName,
  categoryIcon,
  items,
  searchType,
  searchParams
}: CategoryCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const capitalizeTitle = (title: string) => {
    return title.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const renderCard = (item: any, index: number) => {
    const key = item.hotel_id || item.id || index;

    switch (searchType) {
      case 'hotels':
        return <HotelSearchCard key={key} hotel={item} />;
      case 'flights':
        return <FlightSearchCard key={key} {...item} searchParams={searchParams} />;
      case 'activities':
        return <ActivitySearchCard key={key} {...item} searchParams={searchParams} />;
      case 'cars':
        return <CarSearchCard key={key} {...item} searchParams={searchParams} />;
      case 'packages':
        return <PackageSearchCard key={key} {...item} searchParams={searchParams} />;
      default:
        return null;
    }
  };

  if (items.length === 0) return null;

  const validItems = items.filter(item => item && (item.hotel_id || item.id));
  if (validItems.length === 0) return null;

  return (
    <div className="mb-12">
      {/* Category Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <span className="text-2xl">{categoryIcon}</span>
          {capitalizeTitle(categoryName)}
          <span className="text-sm text-white/50 font-normal ml-2">
            ({validItems.length} {validItems.length === 1 ? 'result' : 'results'})
          </span>
        </h3>
      </div>

      {/* Stacked Cards Container */}
      <div className="flex flex-col items-center">
        {/* Card Stack */}
        <div className="relative w-[270px] h-[385px] mb-6">
          {validItems.slice(Math.max(0, currentIndex - 2), currentIndex + 1).map((item, idx) => {
            const actualIndex = Math.max(0, currentIndex - 2) + idx;
            const offset = currentIndex - actualIndex;
            const isVisible = offset <= 2;
            
            return (
              <div
                key={item.hotel_id || item.id || actualIndex}
                className="absolute top-0 left-0 transition-all duration-300 ease-out"
                style={{
                  transform: `translateY(${offset * -8}px) translateX(${offset * -8}px) scale(${1 - offset * 0.05})`,
                  zIndex: 10 - offset,
                  opacity: isVisible ? 1 : 0,
                  pointerEvents: offset === 0 ? 'auto' : 'none'
                }}
              >
                {renderCard(item, actualIndex)}
              </div>
            );
          })}
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="h-10 w-10 rounded-full bg-white/10 border-white/20 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <span className="text-white/70 text-sm font-medium min-w-[60px] text-center">
            {currentIndex + 1} / {validItems.length}
          </span>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            disabled={currentIndex === validItems.length - 1}
            className="h-10 w-10 rounded-full bg-white/10 border-white/20 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
