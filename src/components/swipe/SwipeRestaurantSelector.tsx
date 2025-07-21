import React from 'react';
import { SwipeSelector } from './SwipeSelector';
import { SwipeRestaurantRenderer } from './SwipeCardRenderers';
import { RestaurantSwipeItem } from './types';
import { Utensils } from 'lucide-react';

interface SwipeRestaurantSelectorProps {
  restaurants: RestaurantSwipeItem[];
  itineraryId: string;
  onSwipeComplete?: (likedRestaurants: RestaurantSwipeItem[], rejectedRestaurants: RestaurantSwipeItem[]) => void;
  onRestaurantLiked?: (restaurant: RestaurantSwipeItem) => void;
  onRestaurantRejected?: (restaurant: RestaurantSwipeItem) => void;
  onBack?: () => void;
  onLocationAdded?: () => void;
}

export const SwipeRestaurantSelector: React.FC<SwipeRestaurantSelectorProps> = (props) => {
  return (
    <SwipeSelector
      {...props}
      items={props.restaurants}
      type="restaurant"
      renderCard={SwipeRestaurantRenderer}
      emptyIcon={Utensils}
      title="Swipe Restaurants"
      onLocationAdded={props.onLocationAdded}
      onItemLiked={props.onRestaurantLiked}
      onItemRejected={props.onRestaurantRejected}
    />
  );
};