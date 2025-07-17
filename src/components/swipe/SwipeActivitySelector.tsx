import React from 'react';
import { SwipeSelector } from './SwipeSelector';
import { SwipeActivityRenderer } from './SwipeCardRenderers';
import { ActivitySwipeItem } from './types';
import { Activity } from 'lucide-react';

interface SwipeActivitySelectorProps {
  activities: ActivitySwipeItem[];
  itineraryId: string;
  onSwipeComplete?: (likedActivities: ActivitySwipeItem[], rejectedActivities: ActivitySwipeItem[]) => void;
  onActivityLiked?: (activity: ActivitySwipeItem) => void;
  onActivityRejected?: (activity: ActivitySwipeItem) => void;
  onBack?: () => void;
}

export const SwipeActivitySelector: React.FC<SwipeActivitySelectorProps> = (props) => {
  return (
    <SwipeSelector
      {...props}
      items={props.activities}
      type="activity"
      renderCard={SwipeActivityRenderer}
      emptyIcon={Activity}
      title="Swipe Activities"
    />
  );
};