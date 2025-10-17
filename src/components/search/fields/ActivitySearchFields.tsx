import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ActivitySearchFieldsProps {
  destination: string;
  date: Date | undefined;
  participants: number;
  category: string;
  onDestinationChange: (value: string) => void;
  onDateChange: (date: Date | undefined) => void;
  onParticipantsChange: (value: number) => void;
  onCategoryChange: (value: string) => void;
}

export const ActivitySearchFields = ({
  destination,
  date,
  participants,
  category,
  onDestinationChange,
  onDateChange,
  onParticipantsChange,
  onCategoryChange,
}: ActivitySearchFieldsProps) => {
  return (
    <div className="space-y-4">
      {/* Destination */}
      <div>
        <label className="text-sm font-medium text-white mb-2 block">Destination *</label>
        <Input
          placeholder="City or region"
          value={destination}
          onChange={(e) => onDestinationChange(e.target.value)}
          className="bg-white/10 border-white/20 text-white"
        />
      </div>

      {/* Date */}
      <div>
        <label className="text-sm font-medium text-white mb-2 block">Date *</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal bg-white/10 border-white/20',
                !date && 'text-white/60'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, 'PPP') : 'Select date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={onDateChange}
              initialFocus
              disabled={(date) => date < new Date()}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Participants & Category */}
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-white mb-2 block">Participants *</label>
          <Select value={participants.toString()} onValueChange={(v) => onParticipantsChange(parseInt(v))}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                <SelectItem key={n} value={n.toString()}>{n} {n === 1 ? 'Person' : 'People'}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-white mb-2 block">Category</label>
          <Select value={category} onValueChange={onCategoryChange}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="adventure">Adventure</SelectItem>
              <SelectItem value="culture">Culture & History</SelectItem>
              <SelectItem value="food">Food & Drink</SelectItem>
              <SelectItem value="nightlife">Nightlife</SelectItem>
              <SelectItem value="shopping">Shopping</SelectItem>
              <SelectItem value="tours">Tours & Sightseeing</SelectItem>
              <SelectItem value="nature">Nature & Outdoors</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
