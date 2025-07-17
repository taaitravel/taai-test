import React from 'react';
import { SwipeSelector } from './SwipeSelector';
import { SwipeHotelRenderer } from './SwipeCardRenderers';
import { HotelSwipeItem } from './types';
import { MapPin } from 'lucide-react';

interface SwipeHotelSelectorProps {
  hotels: HotelSwipeItem[];
  itineraryId: string;
  onSwipeComplete?: (likedHotels: HotelSwipeItem[], rejectedHotels: HotelSwipeItem[]) => void;
  onHotelLiked?: (hotel: HotelSwipeItem) => void;
  onHotelRejected?: (hotel: HotelSwipeItem) => void;
  onBack?: () => void;
}

export const SwipeHotelSelector: React.FC<SwipeHotelSelectorProps> = (props) => {
  return (
    <SwipeSelector
      {...props}
      items={props.hotels}
      type="hotel"
      renderCard={SwipeHotelRenderer}
      emptyIcon={MapPin}
      title="Swipe Hotels"
    />
  );
};