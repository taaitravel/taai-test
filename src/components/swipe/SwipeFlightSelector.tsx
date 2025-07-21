import React from 'react';
import { SwipeSelector } from './SwipeSelector';
import { SwipeFlightRenderer } from './SwipeCardRenderers';
import { FlightSwipeItem } from './types';
import { Plane } from 'lucide-react';

interface SwipeFlightSelectorProps {
  flights: FlightSwipeItem[];
  itineraryId: string;
  onSwipeComplete?: (likedFlights: FlightSwipeItem[], rejectedFlights: FlightSwipeItem[]) => void;
  onFlightLiked?: (flight: FlightSwipeItem) => void;
  onFlightRejected?: (flight: FlightSwipeItem) => void;
  onBack?: () => void;
  onLocationAdded?: () => void;
}

export const SwipeFlightSelector: React.FC<SwipeFlightSelectorProps> = (props) => {
  return (
    <SwipeSelector
      {...props}
      items={props.flights}
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