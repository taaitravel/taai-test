import { Button } from '@/components/ui/button';
import { LayoutGrid, Map, Network } from 'lucide-react';

interface SearchViewToggleProps {
  viewMode: 'grid' | 'tree' | 'map';
  onViewModeChange: (mode: 'grid' | 'tree' | 'map') => void;
  showMapView: boolean;
}

export const SearchViewToggle = ({ viewMode, onViewModeChange, showMapView }: SearchViewToggleProps) => {
  return (
    <div className="flex gap-2">
      <Button
        variant={viewMode === 'tree' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewModeChange('tree')}
        className="h-9"
      >
        <Network className="h-4 w-4 mr-2" />
        taaiTree
      </Button>
      <Button
        variant={viewMode === 'grid' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewModeChange('grid')}
        className="h-9"
      >
        <LayoutGrid className="h-4 w-4 mr-2" />
        Grid
      </Button>
      {showMapView && (
        <Button
          variant={viewMode === 'map' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange('map')}
          className="h-9"
        >
          <Map className="h-4 w-4 mr-2" />
          Map
        </Button>
      )}
    </div>
  );
};
