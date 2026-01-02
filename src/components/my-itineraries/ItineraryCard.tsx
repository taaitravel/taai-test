import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Users, MoreVertical } from 'lucide-react';
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
}

export const ItineraryCard: React.FC<ItineraryCardProps> = ({
  itinerary,
  onAddToCollection,
  onRemoveFromCollection,
  showCollectionActions = false,
  collectionId
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/itinerary?id=${itinerary.id}`);
  };

  const getStatusBadge = () => {
    const now = new Date();
    const startDate = new Date(itinerary.itin_date_start);
    const endDate = new Date(itinerary.itin_date_end);

    if (now < startDate) {
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Upcoming</Badge>;
    } else if (now >= startDate && now <= endDate) {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">In Progress</Badge>;
    } else {
      return <Badge className="bg-muted text-muted-foreground">Completed</Badge>;
    }
  };

  const locations = itinerary.itin_locations?.slice(0, 3) || [];
  const remainingLocations = (itinerary.itin_locations?.length || 0) - 3;

  return (
    <Card 
      className="w-[255px] h-[375px] flex flex-col cursor-pointer group transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 bg-[#1a1c2e] border-white/10"
      onClick={handleClick}
    >
      {/* Header with gradient */}
      <div className="h-24 bg-gradient-to-br from-primary/30 to-primary/10 rounded-t-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1c2e] to-transparent" />
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {getStatusBadge()}
          {showCollectionActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-6 w-6 bg-background/50 hover:bg-background/80">
                  <MoreVertical className="h-3 w-3" />
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
          )}
        </div>
      </div>

      <CardContent className="flex-1 flex flex-col p-4 pt-2">
        {/* Title */}
        <h3 className="font-semibold text-lg text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
          {itinerary.itin_name || 'Untitled Trip'}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {itinerary.itin_desc || 'No description'}
        </p>

        {/* Dates */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Calendar className="h-4 w-4 text-primary" />
          <span>
            {itinerary.itin_date_start && itinerary.itin_date_end
              ? `${format(new Date(itinerary.itin_date_start), 'MMM d')} - ${format(new Date(itinerary.itin_date_end), 'MMM d, yyyy')}`
              : 'Dates TBD'}
          </span>
        </div>

        {/* Locations */}
        <div className="flex items-start gap-2 text-sm text-muted-foreground mb-3">
          <MapPin className="h-4 w-4 text-primary mt-0.5" />
          <div className="flex flex-wrap gap-1">
            {locations.length > 0 ? (
              <>
                {locations.map((loc, idx) => (
                  <span key={idx} className="bg-muted/50 px-2 py-0.5 rounded text-xs">
                    {loc}
                  </span>
                ))}
                {remainingLocations > 0 && (
                  <span className="bg-muted/50 px-2 py-0.5 rounded text-xs">
                    +{remainingLocations} more
                  </span>
                )}
              </>
            ) : (
              <span>No locations set</span>
            )}
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{itinerary.attendees?.length || 1}</span>
          </div>
          {itinerary.budget && (
            <span className="text-sm font-medium text-primary">
              ${itinerary.budget.toLocaleString()}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
