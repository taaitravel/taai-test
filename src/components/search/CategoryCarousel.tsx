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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -600 : 600;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      
      // Update arrow visibility after scroll
      setTimeout(checkScrollPosition, 300);
    }
  };

  const checkScrollPosition = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
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

  return (
    <div className="mb-8">
      {/* Category Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <span className="text-2xl">{categoryIcon}</span>
          {categoryName}
          <span className="text-sm text-white/50 font-normal ml-2">
            ({items.length} {items.length === 1 ? 'result' : 'results'})
          </span>
        </h3>
      </div>

      {/* Carousel Container */}
      <div className="relative">
        {/* Left Arrow */}
        {showLeftArrow && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white/10 border-white/20 hover:bg-white/20 backdrop-blur-sm"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}

        {/* Scrollable Cards */}
        <div
          ref={scrollRef}
          onScroll={checkScrollPosition}
          className="flex gap-8 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.filter(item => item && (item.hotel_id || item.id)).map((item, index) => renderCard(item, index))}
        </div>

        {/* Right Arrow */}
        {showRightArrow && items.length > 3 && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white/10 border-white/20 hover:bg-white/20 backdrop-blur-sm"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
};
