import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type GridSortField = 'date' | 'spending' | 'name' | 'attendees';
export type GridSortDirection = 'asc' | 'desc';

interface GridFiltersProps {
  sortField: GridSortField;
  sortDirection: GridSortDirection;
  onSortChange: (field: GridSortField, direction: GridSortDirection) => void;
}

const sortOptions: { field: GridSortField; label: string; ascLabel: string; descLabel: string }[] = [
  { field: 'date', label: 'Date', ascLabel: 'Oldest First', descLabel: 'Newest First' },
  { field: 'spending', label: 'Spending', ascLabel: 'Low to High', descLabel: 'High to Low' },
  { field: 'name', label: 'Name', ascLabel: 'A to Z', descLabel: 'Z to A' },
  { field: 'attendees', label: 'Attendees', ascLabel: 'Fewest First', descLabel: 'Most First' },
];

export const GridFilters: React.FC<GridFiltersProps> = ({
  sortField,
  sortDirection,
  onSortChange,
}) => {
  const currentOption = sortOptions.find(o => o.field === sortField);
  const currentLabel = sortDirection === 'asc' ? currentOption?.ascLabel : currentOption?.descLabel;

  const handleSelect = (field: GridSortField, direction: GridSortDirection) => {
    onSortChange(field, direction);
  };

  return (
    <div className="flex items-center gap-3 mb-4 p-3 bg-[#12131a] rounded-lg border border-white/10">
      <span className="text-sm font-medium text-white/60">Sort by:</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            {sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {currentOption?.label}: {currentLabel}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {sortOptions.map((option) => (
            <React.Fragment key={option.field}>
              <DropdownMenuItem 
                onClick={() => handleSelect(option.field, 'desc')}
                className={sortField === option.field && sortDirection === 'desc' ? 'bg-primary/20' : ''}
              >
                <ArrowDown className="h-3 w-3 mr-2" />
                {option.label}: {option.descLabel}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleSelect(option.field, 'asc')}
                className={sortField === option.field && sortDirection === 'asc' ? 'bg-primary/20' : ''}
              >
                <ArrowUp className="h-3 w-3 mr-2" />
                {option.label}: {option.ascLabel}
              </DropdownMenuItem>
            </React.Fragment>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
