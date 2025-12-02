import React from 'react';

interface MapLegendProps {
  searchType?: string;
  showAll?: boolean;
}

export const MapLegend = ({ searchType, showAll = false }: MapLegendProps) => {
  const legendItems = [
    { category: 'hotel', label: 'Properties', shape: 'square', color: 'hsl(280, 85%, 70%)' },
    { category: 'activity', label: 'Activities', shape: 'triangle', color: 'hsl(160, 80%, 55%)' },
    { category: 'flight', label: 'Flights', shape: 'circle', color: 'hsl(220, 90%, 65%)' },
    { category: 'reservation', label: 'Restaurants', shape: 'diamond', color: 'hsl(30, 95%, 65%)' },
    { category: 'car', label: 'Car Rentals', shape: 'rounded', color: 'hsl(140, 70%, 55%)' },
    { category: 'package', label: 'Packages', shape: 'star', color: '#ff849c' },
  ];

  // Filter to show only relevant item or all items
  const visibleItems = showAll 
    ? legendItems 
    : legendItems.filter(item => {
        if (searchType === 'hotels') return item.category === 'hotel';
        if (searchType === 'activities') return item.category === 'activity';
        if (searchType === 'flights') return item.category === 'flight';
        if (searchType === 'cars') return item.category === 'car';
        if (searchType === 'packages') return item.category === 'package';
        return true;
      });

  const renderShape = (shape: string, color: string) => {
    switch (shape) {
      case 'square':
        return (
          <div 
            className="w-4 h-4 rounded-sm border-2 border-white/50" 
            style={{ backgroundColor: color }}
          />
        );
      case 'triangle':
        return (
          <div 
            className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[14px] border-l-transparent border-r-transparent"
            style={{ borderBottomColor: color }}
          />
        );
      case 'circle':
        return (
          <div 
            className="w-4 h-4 rounded-full border-2 border-white/50" 
            style={{ backgroundColor: color }}
          />
        );
      case 'diamond':
        return (
          <div 
            className="w-3 h-3 transform rotate-45 border-2 border-white/50" 
            style={{ backgroundColor: color }}
          />
        );
      case 'rounded':
        return (
          <div 
            className="w-5 h-3 rounded-md border-2 border-white/50" 
            style={{ backgroundColor: color }}
          />
        );
      case 'star':
        return (
          <div className="text-sm" style={{ color }}>★</div>
        );
      default:
        return (
          <div 
            className="w-3 h-3 rounded-full border-2 border-white/50" 
            style={{ backgroundColor: color }}
          />
        );
    }
  };

  if (visibleItems.length <= 1 && !showAll) return null;

  return (
    <div className="absolute bottom-4 left-4 bg-[#1a1c2e]/90 backdrop-blur-sm p-3 rounded-lg border border-white/10 z-10">
      <div className="text-xs text-white/60 mb-2 font-medium">Legend</div>
      <div className="space-y-2">
        {visibleItems.map((item) => (
          <div key={item.category} className="flex items-center gap-2 text-xs text-white/80">
            {renderShape(item.shape, item.color)}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
