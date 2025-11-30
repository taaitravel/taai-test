import { useState } from 'react';
import { MobileNavigation } from '@/components/shared/MobileNavigation';
import { AdaptiveSearchForm, SearchType } from '@/components/search/AdaptiveSearchForm';
import { SearchResults } from '@/components/search/SearchResults';
import { SearchViewToggle } from '@/components/search/SearchViewToggle';
import { ItineraryMatcherModal } from '@/components/search/ItineraryMatcherModal';
import { HotelFilters } from '@/components/search/HotelFilters';
import { useSearchOrchestrator } from '@/hooks/useSearchOrchestrator';
import { useHotelFilters } from '@/hooks/useHotelFilters';
import { useSearchActions } from '@/hooks/useSearchActions';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const Search = () => {
  const [searchParams, setSearchParams] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const { results, loading, searchType, executeSearch } = useSearchOrchestrator();
  const { filters, setFilters, maxPrice, filteredResults } = useHotelFilters(results);
  const {
    selectedItem,
    showItineraryModal,
    setShowItineraryModal,
    handleAddToItinerary,
    handleAddToWishlist,
    handleAddToCart,
    handleViewDetails,
  } = useSearchActions();

  const handleSearch = async (type: SearchType, params: any) => {
    setSearchParams({ ...params, searchType: type });
    await executeSearch(type, params);
  };

  const handleConfirmItinerary = async (itineraryId: string | 'new', newItineraryName?: string) => {
    // This will be handled by the ItineraryMatcherModal's internal logic
    // Close the modal after confirmation
    setShowItineraryModal(false);
  };

  const showMapView = searchType === 'hotels' || searchType === 'activities';
  const displayResults = searchType === 'hotels' ? filteredResults : results;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f1221] via-[#1a1c2e] to-[#0f1221]">
      <MobileNavigation />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Search Form */}
        <div className="bg-white/5 backdrop-blur-sm rounded-lg px-5 py-2.5 border border-white/10">
          <AdaptiveSearchForm onSearch={handleSearch} />
        </div>

        {/* Results Controls */}
        {!loading && displayResults.length > 0 && (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-white/70 text-sm">
              {displayResults.length} result{displayResults.length !== 1 ? 's' : ''} found
            </p>

            <div className="flex items-center gap-2">
              <SearchViewToggle
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                showMapView={showMapView}
              />

              {searchType === 'hotels' && (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Refine Your Search</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <HotelFilters 
                        filters={filters} 
                        onFiltersChange={setFilters}
                        maxPrice={maxPrice}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              )}
            </div>
          </div>
        )}

        {/* Results Section */}
        <SearchResults
          results={displayResults}
          loading={loading}
          viewMode={viewMode}
          searchType={searchType as SearchType}
          searchParams={searchParams}
          showMapView={showMapView}
        />

        {/* Itinerary Modal */}
        {showItineraryModal && selectedItem && searchParams && (
          <ItineraryMatcherModal
            open={showItineraryModal}
            onOpenChange={setShowItineraryModal}
            searchDates={{
              checkin: searchParams.checkin || '',
              checkout: searchParams.checkout || '',
            }}
            item={selectedItem}
            onConfirm={handleConfirmItinerary}
          />
        )}
      </div>
    </div>
  );
};

export default Search;
