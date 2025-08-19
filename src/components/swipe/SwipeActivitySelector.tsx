import React, { useState, useEffect } from 'react';
import { SwipeSelector } from './SwipeSelector';
import { SwipeActivityRenderer } from './SwipeCardRenderers';
import { ActivitySwipeItem } from './types';
import { Activity, Loader2 } from 'lucide-react';
import { useExpediaSwipe } from './ExpediaSwipeProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SwipeActivitySelectorProps {
  activities?: ActivitySwipeItem[];
  itineraryId: string;
  location?: string;
  onSwipeComplete?: (likedActivities: ActivitySwipeItem[], rejectedActivities: ActivitySwipeItem[]) => void;
  onActivityLiked?: (activity: ActivitySwipeItem) => void;
  onActivityRejected?: (activity: ActivitySwipeItem) => void;
  onBack?: () => void;
  onLocationAdded?: () => void;
}

export const SwipeActivitySelector: React.FC<SwipeActivitySelectorProps> = (props) => {
  const { fetchActivitiesForLocation, loading: expediaLoading } = useExpediaSwipe();
  const [activities, setActivities] = useState<ActivitySwipeItem[]>(props.activities || []);
  const [searchLocation, setSearchLocation] = useState(props.location || '');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (props.activities) {
      setActivities(props.activities);
    }
  }, [props.activities]);

  useEffect(() => {
    if (props.location && activities.length === 0) {
      handleSearchActivities(props.location);
    }
  }, [props.location]);

  const handleSearchActivities = async (location?: string) => {
    const searchLoc = location || searchLocation;
    if (!searchLoc.trim()) return;

    setIsSearching(true);
    try {
      const fetchedActivities = await fetchActivitiesForLocation(searchLoc);
      setActivities(fetchedActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setIsSearching(false);
    }
  };

  if (activities.length === 0 && !isSearching && !expediaLoading) {
    return (
      <div className="p-6 text-center space-y-4">
        <Activity className="h-12 w-12 mx-auto text-muted-foreground" />
        <h3 className="text-lg font-semibold">Search Activities</h3>
        <p className="text-muted-foreground">Enter a destination to find activities</p>
        
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
          
          <Button 
            onClick={() => handleSearchActivities()}
            disabled={!searchLocation.trim() || isSearching}
            className="w-full"
          >
            {isSearching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Search Activities
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
          <p>Searching for activities...</p>
        </div>
      </div>
    );
  }

  return (
    <SwipeSelector
      {...props}
      items={activities}
      type="activity"
      renderCard={SwipeActivityRenderer}
      emptyIcon={Activity}
      title="Swipe Activities"
      onLocationAdded={props.onLocationAdded}
      onItemLiked={props.onActivityLiked}
      onItemRejected={props.onActivityRejected}
    />
  );
};