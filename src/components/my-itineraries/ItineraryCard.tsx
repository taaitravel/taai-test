import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ItineraryData } from '@/types/itinerary';

interface ItineraryCardProps {
  itinerary: ItineraryData;
  onAddToCollection?: (itineraryId: number) => void;
  onRemoveFromCollection?: (itineraryId: number) => void;
  showCollectionActions?: boolean;
  collectionId?: string;
  isShared?: boolean;
  ownerName?: string;
  size?: 'responsive' | 'stack';
}

export const ItineraryCard: React.FC<ItineraryCardProps> = ({
  itinerary,
  onAddToCollection,
  onRemoveFromCollection,
  showCollectionActions = false,
  collectionId,
  isShared = false,
  ownerName,
  size = 'responsive',
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/itinerary?id=${itinerary.id}`);
  };

  const getStatus = () => {
    const now = new Date();
    const startDate = new Date(itinerary.itin_date_start);
    const endDate = new Date(itinerary.itin_date_end);

    if (now < startDate) return 'upcoming';
    if (now >= startDate && now <= endDate) return 'active';
    return 'completed';
  };

  const getEmoji = () => {
    const status = getStatus();
    const locations = itinerary.itin_locations || [];
    
    // Check for location-based emojis
    const locationStr = locations.join(' ').toLowerCase();
    if (locationStr.includes('japan') || locationStr.includes('tokyo') || locationStr.includes('kyoto')) return '🍜';
    if (locationStr.includes('paris') || locationStr.includes('france')) return '🗼';
    if (locationStr.includes('beach') || locationStr.includes('hawaii') || locationStr.includes('bali')) return '🌴';
    if (locationStr.includes('ski') || locationStr.includes('alps')) return '⛷️';
    if (locationStr.includes('london') || locationStr.includes('england')) return '🇬🇧';
    if (locationStr.includes('new york') || locationStr.includes('nyc')) return '🗽';
    if (locationStr.includes('singapore') || locationStr.includes('thailand') || locationStr.includes('bangkok')) return '🏯';
    if (locationStr.includes('europe') || locationStr.includes('amsterdam') || locationStr.includes('berlin')) return '❄️';
    
    // Default based on status
    if (status === 'completed') return '📸';
    return '✈️';
  };

  const formatDates = () => {
    if (!itinerary.itin_date_start || !itinerary.itin_date_end) return 'Dates TBD';
    return `${format(new Date(itinerary.itin_date_start), 'MMM d')} - ${format(new Date(itinerary.itin_date_end), 'MMM d, yyyy')}`;
  };

  const status = getStatus();
  const locations = itinerary.itin_locations?.slice(0, 2) || [];

  const isStack = size === 'stack';
  const cardSize = isStack
    ? 'w-[255px] h-[375px]'
    : 'w-[165px] h-[243px] sm:w-[191px] sm:h-[281px] lg:w-[255px] lg:h-[375px]';
  const contentPad = isStack ? 'p-4' : 'p-2 sm:p-3 lg:p-4';
  const emojiCls = isStack ? 'text-2xl mb-2 opacity-60' : 'text-base sm:text-xl lg:text-2xl mb-1 sm:mb-2 opacity-60';
  const titleCls = isStack
    ? 'font-bold text-white text-base mb-1 line-clamp-2 drop-shadow-sm'
    : 'font-bold text-white text-sm sm:text-base mb-0.5 sm:mb-1 line-clamp-2 drop-shadow-sm';
  const dateCls = isStack ? 'text-muted-foreground text-sm mb-2' : 'text-muted-foreground text-xs sm:text-sm mb-1 sm:mb-2';
  const badgeRow = isStack ? 'flex flex-wrap gap-1 mb-2' : 'flex flex-wrap gap-0.5 sm:gap-1 mb-1 sm:mb-2';
  const badgeCls = isStack
    ? 'text-sm bg-muted text-muted-foreground border-border px-2'
    : 'text-[10px] sm:text-xs lg:text-sm bg-muted text-muted-foreground border-border px-1 sm:px-2';
  const bottomWrap = isStack ? 'space-y-2' : 'space-y-1 sm:space-y-2';
  const attendeeCls = isStack ? 'flex items-center text-sm text-muted-foreground' : 'flex items-center text-xs sm:text-sm text-muted-foreground';
  const attendeeIcon = isStack ? 'h-3 w-3 mr-1' : 'h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1';
  const ownerCls = isStack ? 'text-xs text-muted-foreground truncate' : 'text-[10px] sm:text-xs text-muted-foreground truncate';

  return (
    <Card 
      className={`${cardSize} trip-card-past cursor-pointer hover:shadow-lg hover:shadow-foreground/5 transition-all duration-300 group`}
      onClick={handleClick}
    >
      <CardContent className={`${contentPad} h-full flex flex-col justify-between relative`}>
        {/* Collection Menu */}
        {showCollectionActions && (
          <div className="absolute top-2 right-2 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-6 w-6 bg-muted hover:bg-accent">
                  <MoreVertical className="h-3 w-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                {collectionId && onRemoveFromCollection && (
                  <DropdownMenuItem onClick={() => onRemoveFromCollection(itinerary.id)}>
                    Remove from Collection
                  </DropdownMenuItem>
                )}
                {onAddToCollection && (
                  <DropdownMenuItem onClick={() => onAddToCollection(itinerary.id)}>
                    Add to Collection
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Top Content */}
        <div>
          <div className={emojiCls}>{getEmoji()}</div>
          <h4 className={titleCls}>
            {itinerary.itin_name || 'Untitled Trip'}
          </h4>
          <p className={dateCls}>{formatDates()}</p>
          <div className={badgeRow}>
            {locations.slice(0, 1).map((location, idx) => (
              <Badge 
                key={idx} 
                variant="secondary" 
                className={badgeCls}
              >
                {location}
              </Badge>
            ))}
            {(itinerary.itin_locations?.length || 0) > 1 && (
              <Badge 
                variant="secondary" 
                className={badgeCls}
              >
                +{(itinerary.itin_locations?.length || 0) - 1}
              </Badge>
            )}
          </div>
        </div>

        {/* Bottom Content */}
        <div className={bottomWrap}>
          <div className={attendeeCls}>
            <Users className={attendeeIcon} />
            {itinerary.attendees?.length || 1}
          </div>
          <div className="flex flex-wrap gap-1">
            <Badge className={badgeCls}>
              {status}
            </Badge>
            {isShared && (
              <Badge variant="secondary" className={`${isStack ? 'text-xs' : 'text-[10px] sm:text-xs'} bg-primary/10 text-primary border-primary/20 px-1 sm:px-2`}>
                Shared
              </Badge>
            )}
          </div>
          {isShared && ownerName && (
            <p className={ownerCls}>
              by {ownerName}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
