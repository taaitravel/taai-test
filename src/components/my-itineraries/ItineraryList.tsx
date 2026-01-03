import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { GripVertical, MapPin, Calendar, Users, MoreVertical, ChevronUp, ChevronDown, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ItineraryData } from '@/types/itinerary';

interface ItineraryListProps {
  itineraries: ItineraryData[];
  onAddToCollection?: (itineraryId: number) => void;
  onRemoveFromCollection?: (itineraryId: number) => void;
  onBulkAddToCollection?: (itineraryIds: number[]) => void;
  collectionId?: string;
}

type SortField = 'name' | 'date' | 'status' | 'attendees' | 'spending';
type SortDirection = 'asc' | 'desc';

export const ItineraryList: React.FC<ItineraryListProps> = ({
  itineraries,
  onAddToCollection,
  onRemoveFromCollection,
  onBulkAddToCollection,
  collectionId
}) => {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const getStatus = (itinerary: ItineraryData) => {
    const now = new Date();
    const startDate = new Date(itinerary.itin_date_start);
    const endDate = new Date(itinerary.itin_date_end);

    if (now < startDate) return 'upcoming';
    if (now >= startDate && now <= endDate) return 'active';
    return 'completed';
  };

  const getAttendeeCount = (itinerary: ItineraryData) => {
    return itinerary.attendees?.length || 1;
  };

  const getSpending = (itinerary: ItineraryData) => {
    return itinerary.spending || 0;
  };

  const sortedItineraries = [...itineraries].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'name':
        comparison = (a.itin_name || '').localeCompare(b.itin_name || '');
        break;
      case 'date':
        comparison = new Date(a.itin_date_start).getTime() - new Date(b.itin_date_start).getTime();
        break;
      case 'status':
        const statusOrder = { upcoming: 0, active: 1, completed: 2 };
        comparison = statusOrder[getStatus(a)] - statusOrder[getStatus(b)];
        break;
      case 'attendees':
        comparison = getAttendeeCount(a) - getAttendeeCount(b);
        break;
      case 'spending':
        comparison = getSpending(a) - getSpending(b);
        break;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === itineraries.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(itineraries.map(i => i.id));
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const variants = {
      upcoming: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      completed: 'bg-white/10 text-white/60 border-white/20'
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || variants.completed}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (itineraries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
          <span className="text-2xl">✈️</span>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">No itineraries found</h3>
        <p className="text-white/60">Create a new itinerary to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
          <span className="text-sm font-medium text-white">{selectedIds.length} selected</span>
          {onBulkAddToCollection && (
            <Button 
              size="sm" 
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => onBulkAddToCollection(selectedIds)}
            >
              Add to Collection
            </Button>
          )}
          <Button 
            size="sm" 
            variant="ghost"
            className="text-white/60 hover:text-white hover:bg-white/10"
            onClick={() => setSelectedIds([])}
          >
            Clear Selection
          </Button>
        </div>
      )}

      {/* List Table */}
      <div className="rounded-lg border border-white/10 overflow-hidden overflow-x-auto">
        {/* Header */}
        <div className="grid grid-cols-16 gap-2 md:gap-4 p-4 bg-[#12131a] border-b border-white/10 text-sm font-medium text-white/60 min-w-[800px]">
          <div className="col-span-1 flex items-center">
            <Checkbox 
              checked={selectedIds.length === itineraries.length && itineraries.length > 0}
              onCheckedChange={toggleSelectAll}
              className="border-white/30 data-[state=checked]:bg-primary"
            />
          </div>
          <button 
            className="col-span-3 flex items-center gap-1 hover:text-white transition-colors text-left"
            onClick={() => handleSort('name')}
          >
            Name <SortIcon field="name" />
          </button>
          <button 
            className="col-span-3 flex items-center gap-1 hover:text-white transition-colors text-left"
            onClick={() => handleSort('date')}
          >
            Dates <SortIcon field="date" />
          </button>
          <div className="col-span-2">Locations</div>
          <button 
            className="col-span-2 flex items-center gap-1 hover:text-white transition-colors text-left"
            onClick={() => handleSort('attendees')}
          >
            <Users className="h-3 w-3" />
            Attendees <SortIcon field="attendees" />
          </button>
          <button 
            className="col-span-2 flex items-center gap-1 hover:text-white transition-colors text-left"
            onClick={() => handleSort('spending')}
          >
            <DollarSign className="h-3 w-3" />
            Spending <SortIcon field="spending" />
          </button>
          <button 
            className="col-span-2 flex items-center gap-1 hover:text-white transition-colors text-left"
            onClick={() => handleSort('status')}
          >
            Status <SortIcon field="status" />
          </button>
          <div className="col-span-1"></div>
        </div>

        {/* Rows */}
        {sortedItineraries.map((itinerary, index) => {
          const status = getStatus(itinerary);
          const locations = itinerary.itin_locations?.slice(0, 2) || [];
          const remainingLocations = (itinerary.itin_locations?.length || 0) - 2;
          const attendeeCount = getAttendeeCount(itinerary);
          const spending = getSpending(itinerary);

          return (
            <div 
              key={itinerary.id}
              className={`grid grid-cols-16 gap-2 md:gap-4 p-4 border-b border-white/10 last:border-b-0 hover:bg-[#252738] transition-colors items-center min-w-[800px] ${
                index % 2 === 0 ? 'bg-[#1a1c2e]' : 'bg-[#1e2030]'
              }`}
            >
              <div className="col-span-1 flex items-center gap-2">
                <Checkbox 
                  checked={selectedIds.includes(itinerary.id)}
                  onCheckedChange={() => toggleSelect(itinerary.id)}
                  className="border-white/30 data-[state=checked]:bg-primary"
                />
                <GripVertical className="h-4 w-4 text-white/30 cursor-grab hidden md:block" />
              </div>
              
              <div 
                className="col-span-3 cursor-pointer"
                onClick={() => navigate(`/itinerary?id=${itinerary.id}`)}
              >
                <p className="font-medium text-white hover:text-primary transition-colors line-clamp-1">
                  {itinerary.itin_name || 'Untitled Trip'}
                </p>
                <p className="text-xs text-white/50 line-clamp-1 hidden md:block">
                  {itinerary.itin_desc || 'No description'}
                </p>
              </div>

              <div className="col-span-3 flex items-center gap-2 text-sm text-white/60">
                <Calendar className="h-4 w-4 hidden md:block" />
                <span className="text-xs md:text-sm">
                  {itinerary.itin_date_start && itinerary.itin_date_end
                    ? `${format(new Date(itinerary.itin_date_start), 'MMM d')} - ${format(new Date(itinerary.itin_date_end), 'MMM d, yyyy')}`
                    : 'TBD'}
                </span>
              </div>

              <div className="col-span-2 flex items-center gap-1 text-sm">
                <MapPin className="h-4 w-4 text-white/40 hidden md:block" />
                <span className="text-white/60 line-clamp-1 text-xs md:text-sm">
                  {locations.join(', ')}
                  {remainingLocations > 0 && ` +${remainingLocations}`}
                </span>
              </div>

              <div className="col-span-2 flex items-center gap-1 text-sm text-white/60">
                <Users className="h-4 w-4 text-white/40" />
                <span>{attendeeCount}</span>
              </div>

              <div className="col-span-2 text-sm">
                <span className={`font-medium ${spending > 0 ? 'text-[#ffce87]' : 'text-white/40'}`}>
                  {spending > 0 ? formatCurrency(spending) : '-'}
                </span>
              </div>

              <div className="col-span-2">
                <StatusBadge status={status} />
              </div>

              <div className="col-span-1 flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/itinerary?id=${itinerary.id}`)}>
                      View Details
                    </DropdownMenuItem>
                    {onAddToCollection && (
                      <DropdownMenuItem onClick={() => onAddToCollection(itinerary.id)}>
                        Add to Collection
                      </DropdownMenuItem>
                    )}
                    {collectionId && onRemoveFromCollection && (
                      <DropdownMenuItem onClick={() => onRemoveFromCollection(itinerary.id)}>
                        Remove from Collection
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
