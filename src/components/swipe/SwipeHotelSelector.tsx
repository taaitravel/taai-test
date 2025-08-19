import React, { useState, useEffect } from 'react';
import { SwipeSelector } from './SwipeSelector';
import { SwipeHotelRenderer } from './SwipeCardRenderers';
import { HotelSwipeItem } from './types';
import { MapPin, Loader2 } from 'lucide-react';
import { useExpediaSwipe } from './ExpediaSwipeProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SwipeHotelSelectorProps {
  hotels?: HotelSwipeItem[];
  itineraryId: string;
  location?: string;
  onSwipeComplete?: (likedHotels: HotelSwipeItem[], rejectedHotels: HotelSwipeItem[]) => void;
  onHotelLiked?: (hotel: HotelSwipeItem) => void;
  onHotelRejected?: (hotel: HotelSwipeItem) => void;
  onBack?: () => void;
  onLocationAdded?: () => void;
}

export const SwipeHotelSelector: React.FC<SwipeHotelSelectorProps> = (props) => {
  const { fetchHotelsForLocation, loading: expediaLoading } = useExpediaSwipe();
  const [hotels, setHotels] = useState<HotelSwipeItem[]>(props.hotels || []);
  const [searchLocation, setSearchLocation] = useState(props.location || '');
  const [checkinDate, setCheckinDate] = useState('');
  const [checkoutDate, setCheckoutDate] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (props.hotels) {
      setHotels(props.hotels);
    }
  }, [props.hotels]);

  useEffect(() => {
    if (props.location && hotels.length === 0) {
      handleSearchHotels(props.location);
    }
  }, [props.location]);

  const handleSearchHotels = async (location?: string) => {
    const searchLoc = location || searchLocation;
    if (!searchLoc.trim()) return;

    setIsSearching(true);
    try {
      const fetchedHotels = await fetchHotelsForLocation(searchLoc, checkinDate, checkoutDate);
      setHotels(fetchedHotels);
    } catch (error) {
      console.error('Error fetching hotels:', error);
    } finally {
      setIsSearching(false);
    }
  };

  if (hotels.length === 0 && !isSearching && !expediaLoading) {
    return (
      <div className="p-6 text-center space-y-4">
        <MapPin className="h-12 w-12 mx-auto text-muted-foreground" />
        <h3 className="text-lg font-semibold">Search Hotels</h3>
        <p className="text-muted-foreground">Enter a destination to find hotels</p>
        
        <div className="max-w-md mx-auto space-y-4">
          <div>
            <Label htmlFor="location">Destination</Label>
            <Input
              id="location"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              placeholder="Enter city or location"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="checkin">Check-in</Label>
              <Input
                id="checkin"
                type="date"
                value={checkinDate}
                onChange={(e) => setCheckinDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="checkout">Check-out</Label>
              <Input
                id="checkout"
                type="date"
                value={checkoutDate}
                onChange={(e) => setCheckoutDate(e.target.value)}
              />
            </div>
          </div>
          
          <Button 
            onClick={() => handleSearchHotels()}
            disabled={!searchLocation.trim() || isSearching}
            className="w-full"
          >
            {isSearching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Search Hotels
          </Button>
        </div>
      </div>
    );
  }

  if (isSearching || expediaLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p>Searching for hotels...</p>
        </div>
      </div>
    );
  }

  return (
    <SwipeSelector
      {...props}
      items={hotels}
      type="hotel"
      renderCard={SwipeHotelRenderer}
      emptyIcon={MapPin}
      title="Swipe Hotels"
      onLocationAdded={props.onLocationAdded}
      onItemLiked={props.onHotelLiked}
      onItemRejected={props.onHotelRejected}
    />
  );
};