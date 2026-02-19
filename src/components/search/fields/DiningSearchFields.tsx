import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { PlaceSearch } from '@/components/inputs/PlaceSearch';

interface DiningSearchFieldsProps {
  location: string;
  date: Date | undefined;
  time: string;
  partySize: number;
  cuisine: string;
  onLocationChange: (value: string) => void;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (value: string) => void;
  onPartySizeChange: (value: number) => void;
  onCuisineChange: (value: string) => void;
}

export const DiningSearchFields = ({
  location,
  date,
  time,
  partySize,
  cuisine,
  onLocationChange,
  onDateChange,
  onTimeChange,
  onPartySizeChange,
  onCuisineChange,
}: DiningSearchFieldsProps) => {
  return (
    <div className="space-y-4">
      {/* Location */}
      <PlaceSearch
        id="dining-location"
        label="Location *"
        placeholder="City or neighborhood"
        mode="restaurant"
        defaultQuery={location}
        onSelect={(place) => onLocationChange(place.name)}
      />

      {/* Date & Time */}
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Date *</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal bg-background/50 border-border',
                  !date && 'text-muted-foreground'
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

        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Time *</label>
          <Select value={time} onValueChange={onTimeChange}>
            <SelectTrigger className="bg-background/50 border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="17:00">5:00 PM</SelectItem>
              <SelectItem value="17:30">5:30 PM</SelectItem>
              <SelectItem value="18:00">6:00 PM</SelectItem>
              <SelectItem value="18:30">6:30 PM</SelectItem>
              <SelectItem value="19:00">7:00 PM</SelectItem>
              <SelectItem value="19:30">7:30 PM</SelectItem>
              <SelectItem value="20:00">8:00 PM</SelectItem>
              <SelectItem value="20:30">8:30 PM</SelectItem>
              <SelectItem value="21:00">9:00 PM</SelectItem>
              <SelectItem value="21:30">9:30 PM</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Party Size & Cuisine */}
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Party Size *</label>
          <Select value={partySize.toString()} onValueChange={(v) => onPartySizeChange(parseInt(v))}>
            <SelectTrigger className="bg-background/50 border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <SelectItem key={n} value={n.toString()}>{n} {n === 1 ? 'Guest' : 'Guests'}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Cuisine</label>
          <Select value={cuisine} onValueChange={onCuisineChange}>
            <SelectTrigger className="bg-background/50 border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cuisines</SelectItem>
              <SelectItem value="italian">Italian</SelectItem>
              <SelectItem value="japanese">Japanese</SelectItem>
              <SelectItem value="mexican">Mexican</SelectItem>
              <SelectItem value="american">American</SelectItem>
              <SelectItem value="french">French</SelectItem>
              <SelectItem value="chinese">Chinese</SelectItem>
              <SelectItem value="indian">Indian</SelectItem>
              <SelectItem value="thai">Thai</SelectItem>
              <SelectItem value="mediterranean">Mediterranean</SelectItem>
              <SelectItem value="seafood">Seafood</SelectItem>
              <SelectItem value="steakhouse">Steakhouse</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
