import { SearchResultsGrid } from './SearchResultsGrid';
import { SearchResultsMap } from './SearchResultsMap';
import { SearchResultsTree } from './SearchResultsTree';
import { SearchType } from './AdaptiveSearchForm';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export interface SearchNotice {
  title: string;
  message: string;
  kind: 'info' | 'error';
}

interface SearchResultsProps {
  results: any[];
  loading: boolean;
  viewMode: 'grid' | 'tree' | 'map';
  searchType: SearchType;
  searchParams: any;
  showMapView: boolean;
  notice?: SearchNotice | null;
}

export const SearchResults = ({
  results,
  loading,
  viewMode,
  searchType,
  searchParams,
  showMapView,
  notice,
}: SearchResultsProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-foreground">Searching for the best options...</span>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="py-12 sm:py-20">
        {notice ? (
          <Alert variant={notice.kind === 'error' ? 'destructive' : 'default'} className="mx-auto max-w-2xl bg-card">
            <AlertTitle>{notice.title}</AlertTitle>
            <AlertDescription>{notice.message}</AlertDescription>
          </Alert>
        ) : (
          <div className="text-center">
            <p className="text-muted-foreground text-lg">No results found</p>
            <p className="text-muted-foreground/60 text-sm mt-2">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    );
  }

  if (viewMode === 'tree') {
    return (
      <SearchResultsTree
        results={results}
        searchType={searchType}
        searchParams={searchParams}
      />
    );
  }

  if (viewMode === 'map' && showMapView) {
    return <SearchResultsMap results={results} searchType={searchType} />;
  }

  return (
    <SearchResultsGrid
      results={results}
      searchType={searchType}
      searchParams={searchParams}
    />
  );
};
