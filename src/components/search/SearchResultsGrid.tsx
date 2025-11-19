import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { HotelSearchCard } from './cards/HotelSearchCard';
import { FlightSearchCard } from './cards/FlightSearchCard';
import { ActivitySearchCard } from './cards/ActivitySearchCard';
import { CarSearchCard } from './cards/CarSearchCard';
import { PackageSearchCard } from './cards/PackageSearchCard';
import { SearchType } from './AdaptiveSearchForm';

interface SearchResultsGridProps {
  results: any[];
  searchType: SearchType;
  searchParams: any;
}

export const SearchResultsGrid = ({ results, searchType, searchParams }: SearchResultsGridProps) => {
  const [displayCount, setDisplayCount] = useState(12);
  
  const visibleResults = results.slice(0, displayCount);
  const hasMore = results.length > displayCount;
  
  return (
    <div className="space-y-6">
      {/* Grid layout */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {visibleResults.map((result, idx) => (
          <div key={result.id || idx} className="animate-fade-in">
            {searchType === 'hotels' && (
              <HotelSearchCard hotel={result} />
            )}
            {searchType === 'flights' && (
              <FlightSearchCard 
                flight={result}
                onExpand={() => {}}
              />
            )}
            {searchType === 'activities' && (
              <ActivitySearchCard 
                activity={result}
                onExpand={() => {}}
              />
            )}
            {searchType === 'cars' && (
              <CarSearchCard 
                car={result}
                onExpand={() => {}}
              />
            )}
            {searchType === 'packages' && (
              <PackageSearchCard 
                package={result}
                onExpand={() => {}}
              />
            )}
          </div>
        ))}
      </div>
      
      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button 
            onClick={() => setDisplayCount(prev => prev + 12)}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            Load More ({results.length - displayCount} remaining)
          </Button>
        </div>
      )}
    </div>
  );
};
