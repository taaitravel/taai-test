import { useState } from 'react';
import { MobileNavigation } from '@/components/shared/MobileNavigation';
import { AdaptiveSearchForm, SearchType } from '@/components/search/AdaptiveSearchForm';
import { CardSwiper } from '@/components/search/CardSwiper';
import { HotelSearchCard } from '@/components/search/cards/HotelSearchCard';
import { FlightSearchCard } from '@/components/search/cards/FlightSearchCard';
import { ActivitySearchCard } from '@/components/search/cards/ActivitySearchCard';
import { CarSearchCard } from '@/components/search/cards/CarSearchCard';
import { PackageSearchCard } from '@/components/search/cards/PackageSearchCard';
import { ItineraryMatcherModal } from '@/components/search/ItineraryMatcherModal';
import { useSearchOrchestrator } from '@/hooks/useSearchOrchestrator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const Search = () => {
  const [searchParams, setSearchParams] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showItineraryModal, setShowItineraryModal] = useState(false);
  const { results, loading, searchType, executeSearch } = useSearchOrchestrator();
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSearch = async (type: SearchType, params: any) => {
    setSearchParams({ ...params, searchType: type });
    await executeSearch(type, params);
  };

  const handleAddToItinerary = (item: any) => {
    setSelectedItem(item);
    setShowItineraryModal(true);
  };

  const handleAddToWishlist = async (item: any) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('wishlist').insert({
        user_id: user.id,
        item_type: searchType || 'hotel',
        item_data: item,
      });

      if (error) throw error;

      toast({
        title: 'Added to Wishlist!',
        description: 'Item saved for later',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error adding to wishlist:', error);
    }
  };

  const handleConfirmItinerary = async (itineraryId: string, newItineraryName?: string) => {
    if (!user || !selectedItem) return;

    try {
      let targetItineraryId = itineraryId;

      // Create new itinerary if needed
      if (itineraryId === 'new') {
        const { data: newItin, error: createError } = await supabase
          .from('itinerary')
          .insert({
            userid: user.id,
            itin_name: newItineraryName || `Trip to ${searchParams.destination}`,
            itin_date_start: searchParams.checkin,
            itin_date_end: searchParams.checkout,
            itin_locations: [searchParams.destination],
            flights: [],
            hotels: [],
            activities: [],
            reservations: [],
          })
          .select()
          .single();

        if (createError) throw createError;
        targetItineraryId = newItin.id.toString();
      }

      // Get existing itinerary
      const { data: itin, error: fetchError } = await supabase
        .from('itinerary')
        .select('*')
        .eq('id', parseInt(targetItineraryId))
        .single();

      if (fetchError) throw fetchError;

      // Determine which array to update
      let updateField = '';
      let newArray: any[] = [];

      if (searchType === 'hotels') {
        updateField = 'hotels';
        const existingHotels = Array.isArray(itin.hotels) ? itin.hotels : [];
        newArray = [...existingHotels, {
          ...selectedItem,
          check_in: searchParams.checkin,
          check_out: searchParams.checkout,
          booking_state: 'planned',
        }];
      } else if (searchType === 'flights') {
        updateField = 'flights';
        const existingFlights = Array.isArray(itin.flights) ? itin.flights : [];
        newArray = [...existingFlights, {
          ...selectedItem,
          booking_state: 'planned',
        }];
      } else if (searchType === 'activities') {
        updateField = 'activities';
        const existingActivities = Array.isArray(itin.activities) ? itin.activities : [];
        newArray = [...existingActivities, {
          ...selectedItem,
          date: searchParams.checkin,
          booking_state: 'planned',
        }];
      } else if (searchType === 'packages') {
        // Add all package components
        const existingHotels = Array.isArray(itin.hotels) ? itin.hotels : [];
        const existingFlights = Array.isArray(itin.flights) ? itin.flights : [];
        const existingReservations = Array.isArray(itin.reservations) ? itin.reservations : [];
        
        const { error: updateError } = await supabase
          .from('itinerary')
          .update({
            hotels: [...existingHotels, selectedItem.hotel],
            flights: [...existingFlights, selectedItem.flight],
            reservations: [...existingReservations, {
              type: 'car',
              ...selectedItem.car,
            }],
          })
          .eq('id', parseInt(targetItineraryId));

        if (updateError) throw updateError;

        toast({
          title: '✓ Package Added!',
          description: `Complete package added to your itinerary`,
          variant: 'default',
        });
        return;
      }

      // Update itinerary
      const { error: updateError } = await supabase
        .from('itinerary')
        .update({ [updateField]: newArray })
        .eq('id', parseInt(targetItineraryId));

      if (updateError) throw updateError;

      toast({
        title: '✓ Added to Itinerary!',
        description: `${selectedItem.name} has been added to your trip`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Error adding to itinerary:', error);
      toast({
        title: 'Failed to add',
        description: 'Could not add item to itinerary. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const renderCard = (item: any, onExpand: () => void) => {
    switch (searchType) {
      case 'hotels':
        return <HotelSearchCard hotel={item} onExpand={onExpand} />;
      case 'flights':
        return <FlightSearchCard flight={item} onExpand={onExpand} />;
      case 'activities':
        return <ActivitySearchCard activity={item} onExpand={onExpand} />;
      case 'cars':
        return <CarSearchCard car={item} onExpand={onExpand} />;
      case 'packages':
        return <PackageSearchCard package={item} onExpand={onExpand} />;
      default:
        return null;
    }
  };

  const getSearchSummary = () => {
    if (!searchParams || !searchType) return null;

    const typeLabels: Record<SearchType, string> = {
      flights: 'Flights',
      hotels: 'Hotels',
      cars: 'Rental Cars',
      activities: 'Activities',
      packages: 'Package Deals',
    };

    let summary = `${typeLabels[searchType]}`;
    
    if (searchParams.destination) {
      summary += ` in ${searchParams.destination}`;
    }
    
    if (searchParams.checkin && searchParams.checkout) {
      summary += ` • ${format(new Date(searchParams.checkin), 'MMM dd')} - ${format(new Date(searchParams.checkout), 'MMM dd')}`;
    } else if (searchParams.checkin) {
      summary += ` • ${format(new Date(searchParams.checkin), 'MMM dd')}`;
    }
    
    if (searchParams.adults) {
      summary += ` • ${searchParams.adults} adult${searchParams.adults > 1 ? 's' : ''}`;
    }

    return summary;
  };

  return (
    <div className="min-h-screen bg-[#171821]">
      <MobileNavigation
        travelerLevel="Explorer"
        showBackButton={true}
        backPath="/dashboard"
        backLabel="Back to Dashboard"
        showProfileButton={true}
        showTripButtons={false}
      />

      <div className="min-h-screen bg-[#171821] pb-20">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
              Search Travel Options
            </h1>
            <p className="text-white/70 text-lg">
              Find flights, hotels, activities, and packages for your next adventure
            </p>
          </div>

          {/* Search Form */}
          <div className="bg-[#171821]/95 backdrop-blur-md border border-white/30 rounded-lg shadow-2xl shadow-white/20 mb-8">
            <AdaptiveSearchForm onSearch={handleSearch} />
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-white text-lg">Searching for the best options...</p>
              <p className="text-white/60 text-sm">This may take a few moments</p>
            </div>
          )}

          {/* Results */}
          {!loading && results.length > 0 && (
            <div className="bg-[#171821]/95 backdrop-blur-md border border-white/30 rounded-lg shadow-2xl shadow-white/20 p-6">
              {/* Search Summary */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">{getSearchSummary()}</h2>
                <p className="text-white/60">{results.length} result{results.length !== 1 ? 's' : ''} found</p>
              </div>

              {/* Card Swiper */}
              <CardSwiper
                results={results}
                renderCard={renderCard}
                onAddToItinerary={handleAddToItinerary}
                onAddToWishlist={handleAddToWishlist}
                searchType={searchType || 'hotels'}
              />
            </div>
          )}

          {/* No Results */}
          {!loading && searchParams && results.length === 0 && (
            <div className="text-center py-20">
              <p className="text-white/70 text-lg mb-4">No results found</p>
              <p className="text-white/50">Try adjusting your search criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Itinerary Matcher Modal */}
      {searchParams && (
        <ItineraryMatcherModal
          open={showItineraryModal}
          onOpenChange={setShowItineraryModal}
          searchDates={{ checkin: searchParams.checkin, checkout: searchParams.checkout }}
          item={selectedItem}
          onConfirm={handleConfirmItinerary}
        />
      )}
    </div>
  );
};

export default Search;
