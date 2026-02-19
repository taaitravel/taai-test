import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Star, Sparkles, DollarSign, Building, Plane, MapPin, Crown, Gem, Hotel, Waves, TreePalm, Mountain, Heart } from 'lucide-react';
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

  const iconMap: Record<string, React.ComponentType<any>> = {
    star: Star,
    sparkles: Sparkles,
    dollar: DollarSign,
    building: Building,
    plane: Plane,
    mappin: MapPin,
    crown: Crown,
    gem: Gem,
    hotel: Hotel,
    waves: Waves,
    palm: TreePalm,
    mountain: Mountain,
    heart: Heart,
  };

  const isEmoji = (str: string) => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/u;
    return emojiRegex.test(str);
  };

  const renderIcon = () => {
    if (isEmoji(categoryIcon)) {
      return <span className="text-base">{categoryIcon}</span>;
    }
    const IconComponent = iconMap[categoryIcon.toLowerCase()];
    if (IconComponent) {
      return <IconComponent className="h-4 w-4 text-foreground/80" />;
    }
    return <Star className="h-4 w-4 text-foreground/80" />;
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
        return <HotelSearchCard key={key} hotel={item} searchParams={searchParams} />;
      case 'flights':
        return <FlightSearchCard key={key} flight={item} />;
      case 'activities':
        return <ActivitySearchCard key={key} activity={item} searchParams={searchParams} />;
      case 'cars':
        return <CarSearchCard key={key} car={item} />;
      case 'packages':
        return <PackageSearchCard key={key} package={item} />;
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
      <div className="flex items-center justify-center mb-6">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 truncate">
          {renderIcon()}
          <span className="truncate" title={capitalizeTitle(categoryName)}>
            {capitalizeTitle(categoryName)}
          </span>
        </h3>
      </div>

      {/* Stacked Cards Container */}
      <div className="flex flex-col items-center">
        {/* Card Stack */}
        <div className="relative w-[270px] h-[385px] mb-6">
          {[0, 1, 2].map((stackIndex) => {
            const actualIndex = (currentIndex + stackIndex) % validItems.length;
            const item = validItems[actualIndex];
            if (!item) return null;
            
            return (
              <div
                key={`${item.hotel_id || item.id}-${stackIndex}`}
                className="absolute top-0 left-0 transition-all duration-300 ease-out"
                style={{
                  transform: `translateY(${stackIndex * 12}px) translateX(${stackIndex * 6}px)`,
                  zIndex: 10 - stackIndex,
                  pointerEvents: stackIndex === 0 ? 'auto' : 'none',
                  boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.3)'
                }}
              >
                {renderCard(item, actualIndex)}
              </div>
            );
          })}
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-6">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="h-10 w-10 rounded-full bg-muted border-border hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <span className="text-muted-foreground text-sm font-medium min-w-[60px] text-center">
            {currentIndex + 1} / {validItems.length}
          </span>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            disabled={currentIndex === validItems.length - 1}
            className="h-10 w-10 rounded-full bg-muted border-border hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
