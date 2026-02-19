import { DateRangePicker } from '../DateRangePicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlaceSearch } from '@/components/inputs/PlaceSearch';

interface FlightSearchFieldsProps {
  origin: string;
  destination: string;
  departDate: Date | undefined;
  returnDate: Date | undefined;
  adults: number;
  children: number;
  flightClass: string;
  tripType: 'roundtrip' | 'oneway';
  onOriginChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
  onDepartDateChange: (date: Date | undefined) => void;
  onReturnDateChange: (date: Date | undefined) => void;
  onAdultsChange: (value: number) => void;
  onChildrenChange: (value: number) => void;
  onFlightClassChange: (value: string) => void;
  onTripTypeChange: (value: 'roundtrip' | 'oneway') => void;
}

export const FlightSearchFields = ({
  origin,
  destination,
  departDate,
  returnDate,
  adults,
  children,
  flightClass,
  tripType,
  onOriginChange,
  onDestinationChange,
  onDepartDateChange,
  onReturnDateChange,
  onAdultsChange,
  onChildrenChange,
  onFlightClassChange,
  onTripTypeChange,
}: FlightSearchFieldsProps) => {
  const handleSwapLocations = () => {
    const temp = origin;
    onOriginChange(destination);
    onDestinationChange(temp);
  };

  return (
    <div className="space-y-3">
      {/* Trip Type */}
      <RadioGroup value={tripType} onValueChange={onTripTypeChange} className="flex gap-4">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="roundtrip" id="roundtrip" />
          <Label htmlFor="roundtrip" className="text-foreground dark:text-white cursor-pointer text-sm">Round-trip</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="oneway" id="oneway" />
          <Label htmlFor="oneway" className="text-foreground dark:text-white cursor-pointer text-sm">One-way</Label>
        </div>
      </RadioGroup>

      {/* From/To with Swap */}
      <div className="grid md:grid-cols-[1fr_auto_1fr] gap-2 items-end">
        <div>
          <label className="text-xs font-medium text-foreground/60 dark:text-white/60 mb-1.5 block">From (Airport Code) *</label>
          <input
            type="text"
            value={origin}
            onChange={(e) => onOriginChange(e.target.value.toUpperCase())}
            placeholder="e.g., JFK"
            maxLength={3}
            className="w-full px-3 py-1.5 h-9 bg-background/50 dark:bg-white/5 border border-border dark:border-white/10 rounded-md text-foreground dark:text-white text-sm placeholder:text-muted-foreground dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-foreground/40 dark:text-white/30 mt-1">3-letter code</p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleSwapLocations}
          className="mb-5 hover:bg-accent dark:hover:bg-white/10 h-9 w-9"
        >
          <ArrowLeftRight className="h-4 w-4 text-foreground/60 dark:text-white/50" />
        </Button>

        <div>
          <label className="text-xs font-medium text-foreground/60 dark:text-white/60 mb-1.5 block">To (Airport Code) *</label>
          <input
            type="text"
            value={destination}
            onChange={(e) => onDestinationChange(e.target.value.toUpperCase())}
            placeholder="e.g., LAX"
            maxLength={3}
            className="w-full px-3 py-1.5 h-9 bg-background/50 dark:bg-white/5 border border-border dark:border-white/10 rounded-md text-foreground dark:text-white text-sm placeholder:text-muted-foreground dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-foreground/40 dark:text-white/30 mt-1">3-letter code</p>
        </div>
      </div>

      {/* Dates */}
      <DateRangePicker
        startDate={departDate}
        endDate={tripType === 'roundtrip' ? returnDate : undefined}
        onStartDateChange={onDepartDateChange}
        onEndDateChange={onReturnDateChange}
        startLabel="Depart"
        endLabel={tripType === 'roundtrip' ? 'Return' : 'N/A'}
        showNights={false}
      />

      {/* Travelers & Class */}
      <div className="grid md:grid-cols-3 gap-2">
        <div>
          <label className="text-xs font-medium text-foreground/60 dark:text-white/60 mb-1.5 block">Adults *</label>
          <Select value={adults.toString()} onValueChange={(v) => onAdultsChange(parseInt(v))}>
            <SelectTrigger className="bg-background/50 dark:bg-white/5 border-border dark:border-white/10 text-foreground dark:text-white h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <SelectItem key={n} value={n.toString()}>{n} Adult{n > 1 ? 's' : ''}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-medium text-foreground/60 dark:text-white/60 mb-1.5 block">Children</label>
          <Select value={children.toString()} onValueChange={(v) => onChildrenChange(parseInt(v))}>
            <SelectTrigger className="bg-background/50 dark:bg-white/5 border-border dark:border-white/10 text-foreground dark:text-white h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[0, 1, 2, 3, 4].map((n) => (
                <SelectItem key={n} value={n.toString()}>{n} {n === 1 ? 'Child' : 'Children'}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-medium text-foreground/60 mb-1.5 block">Class</label>
          <Select value={flightClass} onValueChange={onFlightClassChange}>
            <SelectTrigger className="bg-background/50 border-border text-foreground h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="economy">Economy</SelectItem>
              <SelectItem value="premium">Premium Economy</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="first">First Class</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
