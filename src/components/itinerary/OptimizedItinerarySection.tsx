import React, { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { OptimizedItineraryCard } from './OptimizedItineraryCard';

interface SectionItem {
  name?: string;
  airline?: string;
  flight_number?: string;
  location?: string;
  address?: string;
  city?: string;
  country?: string;
  images?: string[];
  rating?: number;
  cost?: number;
  price?: string | number;
  booking_status?: string;
  [key: string]: any;
}

interface OptimizedItinerarySectionProps {
  title: string;
  items: SectionItem[];
  type: 'hotel' | 'activity' | 'flight' | 'reservation';
  onAdd?: () => void;
  onEdit?: (index: number) => void;
  onDelete?: (index: number) => void;
  emptyMessage?: string;
  icon?: React.ReactNode;
}

const OptimizedItinerarySection = memo(({ 
  title, 
  items, 
  type, 
  onAdd, 
  onEdit, 
  onDelete, 
  emptyMessage,
  icon 
}: OptimizedItinerarySectionProps) => {
  const itemsWithType = useMemo(() => 
    items.map(item => ({ ...item, type })), 
    [items, type]
  );

  const handleEdit = (index: number) => {
    onEdit?.(index);
  };

  const handleDelete = (index: number) => {
    onDelete?.(index);
  };

  return (
    <Card className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border-white/10">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-white text-lg">
            {title} ({items.length})
          </CardTitle>
        </div>
        {onAdd && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAdd}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add {title.slice(0, -1)}
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {itemsWithType.length > 0 ? (
          itemsWithType.map((item, index) => (
            <OptimizedItineraryCard
              key={`${type}-${index}`}
              item={item as any}
              onEdit={() => handleEdit(index)}
              onDelete={() => handleDelete(index)}
            />
          ))
        ) : (
          <div className="text-center py-8 text-white/60">
            <p>{emptyMessage || `No ${title.toLowerCase()} added yet`}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

OptimizedItinerarySection.displayName = 'OptimizedItinerarySection';

export { OptimizedItinerarySection };