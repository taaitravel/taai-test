import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { MapPin, Calendar, Users, MoreVertical, ChevronUp, ChevronDown, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

type SortField = 'name' | 'date' | 'locations' | 'attendees' | 'spending' | 'status';
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

  const getLocationString = (itinerary: ItineraryData) => {
    return itinerary.itin_locations?.join(', ') || '';
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
      case 'locations':
        comparison = getLocationString(a).localeCompare(getLocationString(b));
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

      {/* Table */}
      <div className="rounded-lg border border-white/10 overflow-hidden">
        <Table>
          <TableHeader className="bg-[#12131a]">
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="w-12">
                <Checkbox 
                  checked={selectedIds.length === itineraries.length && itineraries.length > 0}
                  onCheckedChange={toggleSelectAll}
                  className="border-white/30 data-[state=checked]:bg-primary"
                />
              </TableHead>
              <TableHead>
                <button 
                  className="flex items-center gap-1 hover:text-white transition-colors text-white/60"
                  onClick={() => handleSort('name')}
                >
                  Name <SortIcon field="name" />
                </button>
              </TableHead>
              <TableHead>
                <button 
                  className="flex items-center gap-1 hover:text-white transition-colors text-white/60"
                  onClick={() => handleSort('date')}
                >
                  <Calendar className="h-3 w-3" />
                  Dates <SortIcon field="date" />
                </button>
              </TableHead>
              <TableHead>
                <button 
                  className="flex items-center gap-1 hover:text-white transition-colors text-white/60"
                  onClick={() => handleSort('locations')}
                >
                  <MapPin className="h-3 w-3" />
                  Locations <SortIcon field="locations" />
                </button>
              </TableHead>
              <TableHead>
                <button 
                  className="flex items-center gap-1 hover:text-white transition-colors text-white/60"
                  onClick={() => handleSort('attendees')}
                >
                  <Users className="h-3 w-3" />
                  Attendees <SortIcon field="attendees" />
                </button>
              </TableHead>
              <TableHead>
                <button 
                  className="flex items-center gap-1 hover:text-white transition-colors text-white/60"
                  onClick={() => handleSort('spending')}
                >
                  <DollarSign className="h-3 w-3" />
                  Spending <SortIcon field="spending" />
                </button>
              </TableHead>
              <TableHead>
                <button 
                  className="flex items-center gap-1 hover:text-white transition-colors text-white/60"
                  onClick={() => handleSort('status')}
                >
                  Status <SortIcon field="status" />
                </button>
              </TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedItineraries.map((itinerary, index) => {
              const status = getStatus(itinerary);
              const locations = itinerary.itin_locations?.slice(0, 3) || [];
              const hasMoreLocations = (itinerary.itin_locations?.length || 0) > 3;
              const descriptionWords = (itinerary.itin_desc || 'No description').split(' ');
              const truncatedDesc = descriptionWords.length > 10 
                ? descriptionWords.slice(0, 10).join(' ') + '...'
                : descriptionWords.join(' ');
              const attendeeCount = getAttendeeCount(itinerary);
              const spending = getSpending(itinerary);

              return (
                <TableRow 
                  key={itinerary.id}
                  className={`border-white/10 hover:bg-[#252738] ${
                    index % 2 === 0 ? 'bg-[#1a1c2e]' : 'bg-[#1e2030]'
                  }`}
                >
                  <TableCell>
                    <Checkbox 
                      checked={selectedIds.includes(itinerary.id)}
                      onCheckedChange={() => toggleSelect(itinerary.id)}
                      className="border-white/30 data-[state=checked]:bg-primary"
                    />
                  </TableCell>
                  
                  <TableCell 
                    className="cursor-pointer"
                    onClick={() => navigate(`/itinerary?id=${itinerary.id}`)}
                  >
                    <p className="font-medium text-white hover:text-primary transition-colors line-clamp-1">
                      {itinerary.itin_name || 'Untitled Trip'}
                    </p>
                    <p className="text-xs text-white/50 line-clamp-1">
                      {truncatedDesc}
                    </p>
                  </TableCell>

                  <TableCell className="text-white/60 text-sm whitespace-nowrap">
                    {itinerary.itin_date_start && itinerary.itin_date_end
                      ? `${format(new Date(itinerary.itin_date_start), 'MMM d')} - ${format(new Date(itinerary.itin_date_end), 'MMM d, yyyy')}`
                      : 'TBD'}
                  </TableCell>

                  <TableCell className="text-white/60 text-sm">
                    <span className="line-clamp-1">
                      {locations.join(', ')}
                      {hasMoreLocations && '...'}
                    </span>
                  </TableCell>

                  <TableCell className="text-white/60 text-sm">
                    {attendeeCount}
                  </TableCell>

                  <TableCell>
                    <span className={`font-medium text-sm ${spending > 0 ? 'text-[#ffce87]' : 'text-white/40'}`}>
                      {spending > 0 ? formatCurrency(spending) : '-'}
                    </span>
                  </TableCell>

                  <TableCell>
                    <StatusBadge status={status} />
                  </TableCell>

                  <TableCell>
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
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
