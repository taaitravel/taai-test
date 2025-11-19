import { SearchResultsGrid } from './SearchResultsGrid';
import { SearchResultsMap } from './SearchResultsMap';
import { SearchType } from './AdaptiveSearchForm';
import { Loader2 } from 'lucide-react';

interface SearchResultsProps {
  results: any[];
  loading: boolean;
  viewMode: 'grid' | 'map';
  searchType: SearchType;
  searchParams: any;
  showMapView: boolean;
}

export const SearchResults = ({
  results,
  loading,
  viewMode,
  searchType,
  searchParams,
  showMapView,
}: SearchResultsProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-white">Searching for the best options...</span>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-white/60 text-lg">No results found</p>
        <p className="text-white/40 text-sm mt-2">Try adjusting your search criteria</p>
      </div>
    );
  }

  if (viewMode === 'map' && showMapView) {
    return <SearchResultsMap results={results} />;
  }

  return (
    <SearchResultsGrid
      results={results}
      searchType={searchType}
      searchParams={searchParams}
    />
  );
};
