import { useState } from 'react';
import { SearchForm } from './SearchForm';
import { SearchResultsSwiper } from './SearchResultsSwiper';
import { useUnifiedSearch } from '@/hooks/useUnifiedSearch';
import { Loader2 } from 'lucide-react';

interface UnifiedSearchInterfaceProps {
  searchType: 'hotel' | 'flight' | 'activity' | 'package';
}

export const UnifiedSearchInterface = ({ searchType }: UnifiedSearchInterfaceProps) => {
  const [searchParams, setSearchParams] = useState<any>(null);
  const { results, loading, executeSearch } = useUnifiedSearch(searchType);

  const handleSearch = async (params: any) => {
    setSearchParams(params);
    await executeSearch(params);
  };

  return (
    <div className="space-y-6 p-4">
      <SearchForm searchType={searchType} onSearch={handleSearch} />
      
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-white">Searching for the best options...</span>
        </div>
      )}

      {!loading && results.length > 0 && (
        <SearchResultsSwiper 
          results={results} 
          searchType={searchType}
          searchParams={searchParams}
        />
      )}

      {!loading && searchParams && results.length === 0 && (
        <div className="text-center py-12 text-white/60">
          No results found. Try adjusting your search criteria.
        </div>
      )}
    </div>
  );
};
