import { Button } from '@/components/ui/button';
import { LayoutGrid, Map } from 'lucide-react';

interface SearchViewToggleProps {
  viewMode: 'grid' | 'map';
  onViewModeChange: (mode: 'grid' | 'map') => void;
  showMapView: boolean;
}

export const SearchViewToggle = ({ viewMode, onViewModeChange, showMapView }: SearchViewToggleProps) => {
  if (!showMapView) return null;

  return (
    <div className="flex gap-2">
      <Button
        variant={viewMode === 'grid' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewModeChange('grid')}
        className="h-9"
      >
        <LayoutGrid className="h-4 w-4 mr-2" />
        Grid
      </Button>
      <Button
        variant={viewMode === 'map' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewModeChange('map')}
        className="h-9"
      >
        <Map className="h-4 w-4 mr-2" />
        Map
      </Button>
    </div>
  );
};
