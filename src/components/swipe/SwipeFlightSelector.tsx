import React, { useState, useEffect } from 'react';
import { SwipeSelector } from './SwipeSelector';
import { SwipeFlightRenderer } from './SwipeCardRenderers';
import { FlightSwipeItem } from './types';
import { Plane, Loader2 } from 'lucide-react';
import { useExpediaSwipe } from './ExpediaSwipeProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SwipeFlightSelectorProps {
  flights?: FlightSwipeItem[];
  itineraryId: string;
  origin?: string;
  destination?: string;
  onSwipeComplete?: (likedFlights: FlightSwipeItem[], rejectedFlights: FlightSwipeItem[]) => void;
  onFlightLiked?: (flight: FlightSwipeItem) => void;
  onFlightRejected?: (flight: FlightSwipeItem) => void;
  onBack?: () => void;
  onLocationAdded?: () => void;
}

export const SwipeFlightSelector: React.FC<SwipeFlightSelectorProps> = (props) => {
  const { fetchFlightsForRoute, loading: expediaLoading } = useExpediaSwipe();
  const [flights, setFlights] = useState<FlightSwipeItem[]>(props.flights || []);
  const [origin, setOrigin] = useState(props.origin || '');
  const [destination, setDestination] = useState(props.destination || '');
  const [departureDate, setDepartureDate] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (props.flights) {
      setFlights(props.flights);
    }
  }, [props.flights]);

  useEffect(() => {
    if (props.origin && props.destination && flights.length === 0) {
      handleSearchFlights(props.origin, props.destination);
    }
  }, [props.origin, props.destination]);

  const handleSearchFlights = async (searchOrigin?: string, searchDestination?: string) => {
    const searchOrig = searchOrigin || origin;
    const searchDest = searchDestination || destination;
    if (!searchOrig.trim() || !searchDest.trim()) return;

    setIsSearching(true);
    try {
      const fetchedFlights = await fetchFlightsForRoute(searchOrig, searchDest, departureDate);
      setFlights(fetchedFlights);
    } catch (error) {
      console.error('Error fetching flights:', error);
    } finally {
      setIsSearching(false);
    }
  };

  if (flights.length === 0 && !isSearching && !expediaLoading) {
    return (
      <div className="p-6 text-center space-y-4">
        <Plane className="h-12 w-12 mx-auto text-muted-foreground" />
        <h3 className="text-lg font-semibold">Search Flights</h3>
        <p className="text-muted-foreground">Enter origin and destination to find flights</p>
        
        <div className="max-w-md mx-auto space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="origin">Origin</Label>
              <Input
                id="origin"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="NYC, LAX, etc."
              />
            </div>
            <div>
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Paris, Tokyo, etc."
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="departure">Departure Date</Label>
            <Input
              id="departure"
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
            />
          </div>
          
          <Button 
            onClick={() => handleSearchFlights()}
            disabled={!origin.trim() || !destination.trim() || isSearching}
            className="w-full"
          >
            {isSearching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Search Flights
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
          <p>Searching for flights...</p>
        </div>
      </div>
    );
  }

  return (
    <SwipeSelector
      {...props}
      items={flights}
      type="flight"
      renderCard={SwipeFlightRenderer}
      emptyIcon={Plane}
      title="Swipe Flights"
      onLocationAdded={props.onLocationAdded}
      onItemLiked={props.onFlightLiked}
      onItemRejected={props.onFlightRejected}
    />
  );
};