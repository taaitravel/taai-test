import { useState } from 'react';
import { MobileNavigation } from '@/components/shared/MobileNavigation';
import { ComprehensiveSearchForm } from '@/components/search/ComprehensiveSearchForm';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Hotel, Plane, Activity, Package, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Search = () => {
  const [searchParams, setSearchParams] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showItineraryModal, setShowItineraryModal] = useState(false);
  const [activeTab, setActiveTab] = useState('hotels');
  const { results, loading, executeSearch } = useSearchOrchestrator();
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSearch = async (params: any) => {
    setSearchParams(params);
    await executeSearch(params);

    // Auto-select first available tab with results
    if (results.hotels.length > 0) setActiveTab('hotels');
    else if (results.flights.length > 0) setActiveTab('flights');
    else if (results.activities.length > 0) setActiveTab('activities');
    else if (results.packages.length > 0) setActiveTab('packages');
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
        item_type: activeTab.slice(0, -1), // Remove 's' from end
        item_data: item,
      });

      if (error) throw error;
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

      if (activeTab === 'hotels') {
        updateField = 'hotels';
        const existingHotels = Array.isArray(itin.hotels) ? itin.hotels : [];
        newArray = [...existingHotels, {
          ...selectedItem,
          check_in: searchParams.checkin,
          check_out: searchParams.checkout,
          booking_state: 'planned',
        }];
      } else if (activeTab === 'flights') {
        updateField = 'flights';
        const existingFlights = Array.isArray(itin.flights) ? itin.flights : [];
        newArray = [...existingFlights, {
          ...selectedItem,
          booking_state: 'planned',
        }];
      } else if (activeTab === 'activities') {
        updateField = 'activities';
        const existingActivities = Array.isArray(itin.activities) ? itin.activities : [];
        newArray = [...existingActivities, {
          ...selectedItem,
          date: searchParams.checkin,
          booking_state: 'planned',
        }];
      } else if (activeTab === 'packages') {
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

  const renderCard = (type: string) => (item: any, onExpand: () => void) => {
    switch (type) {
      case 'hotels':
        return <HotelSearchCard hotel={item} onExpand={onExpand} />;
      case 'flights':
        return <FlightSearchCard flight={item} onExpand={onExpand} />;
      case 'activities':
        return <ActivitySearchCard activity={item} onExpand={onExpand} />;
      case 'packages':
        return <PackageSearchCard package={item} onExpand={onExpand} />;
      default:
        return null;
    }
  };

  const hasResults = results.hotels.length + results.flights.length + results.activities.length + results.packages.length > 0;

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
            <ComprehensiveSearchForm onSearch={handleSearch} />
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
          {!loading && hasResults && (
            <div className="bg-[#171821]/95 backdrop-blur-md border border-white/30 rounded-lg shadow-2xl shadow-white/20 p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-4 bg-white/5 mb-6">
                  <TabsTrigger
                    value="hotels"
                    className="flex items-center gap-2"
                    disabled={results.hotels.length === 0}
                  >
                    <Hotel className="h-4 w-4" />
                    <span className="hidden sm:inline">Hotels</span>
                    <span className="text-xs">({results.hotels.length})</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="flights"
                    className="flex items-center gap-2"
                    disabled={results.flights.length === 0}
                  >
                    <Plane className="h-4 w-4" />
                    <span className="hidden sm:inline">Flights</span>
                    <span className="text-xs">({results.flights.length})</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="activities"
                    className="flex items-center gap-2"
                    disabled={results.activities.length === 0}
                  >
                    <Activity className="h-4 w-4" />
                    <span className="hidden sm:inline">Activities</span>
                    <span className="text-xs">({results.activities.length})</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="packages"
                    className="flex items-center gap-2"
                    disabled={results.packages.length === 0}
                  >
                    <Package className="h-4 w-4" />
                    <span className="hidden sm:inline">Packages</span>
                    <span className="text-xs">({results.packages.length})</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="hotels">
                  <CardSwiper
                    results={results.hotels}
                    renderCard={renderCard('hotels')}
                    onAddToItinerary={handleAddToItinerary}
                    onAddToWishlist={handleAddToWishlist}
                    searchType="hotels"
                  />
                </TabsContent>

                <TabsContent value="flights">
                  <CardSwiper
                    results={results.flights}
                    renderCard={renderCard('flights')}
                    onAddToItinerary={handleAddToItinerary}
                    onAddToWishlist={handleAddToWishlist}
                    searchType="flights"
                  />
                </TabsContent>

                <TabsContent value="activities">
                  <CardSwiper
                    results={results.activities}
                    renderCard={renderCard('activities')}
                    onAddToItinerary={handleAddToItinerary}
                    onAddToWishlist={handleAddToWishlist}
                    searchType="activities"
                  />
                </TabsContent>

                <TabsContent value="packages">
                  <CardSwiper
                    results={results.packages}
                    renderCard={renderCard('packages')}
                    onAddToItinerary={handleAddToItinerary}
                    onAddToWishlist={handleAddToWishlist}
                    searchType="packages"
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* No Results */}
          {!loading && searchParams && !hasResults && (
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
