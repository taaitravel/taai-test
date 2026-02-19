import { DateRangePicker } from '../DateRangePicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlaceSearch } from '@/components/inputs/PlaceSearch';

interface PackageSearchFieldsProps {
  origin: string;
  destination: string;
  departDate: Date | undefined;
  returnDate: Date | undefined;
  adults: number;
  children: number;
  rooms: number;
  flightClass: string;
  includeCar: boolean;
  onOriginChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
  onDepartDateChange: (date: Date | undefined) => void;
  onReturnDateChange: (date: Date | undefined) => void;
  onAdultsChange: (value: number) => void;
  onChildrenChange: (value: number) => void;
  onRoomsChange: (value: number) => void;
  onFlightClassChange: (value: string) => void;
  onIncludeCarChange: (value: boolean) => void;
}

export const PackageSearchFields = ({
  origin,
  destination,
  departDate,
  returnDate,
  adults,
  children,
  rooms,
  flightClass,
  includeCar,
  onOriginChange,
  onDestinationChange,
  onDepartDateChange,
  onReturnDateChange,
  onAdultsChange,
  onChildrenChange,
  onRoomsChange,
  onFlightClassChange,
  onIncludeCarChange,
}: PackageSearchFieldsProps) => {
  const handleSwapLocations = () => {
    const temp = origin;
    onOriginChange(destination);
    onDestinationChange(temp);
  };

  return (
    <div className="space-y-4">
      {/* Package Includes */}
      <div className="bg-background/50 border border-border rounded-lg p-3">
        <p className="text-sm text-foreground/60 mb-2">Package includes:</p>
        <div className="flex flex-wrap gap-3">
          <span className="text-sm text-foreground">✓ Flight</span>
          <span className="text-sm text-foreground">✓ Hotel</span>
          {includeCar && <span className="text-sm text-foreground">✓ Car</span>}
        </div>
      </div>

      {/* From/To with Swap */}
      <div className="grid md:grid-cols-[1fr_auto_1fr] gap-3 items-end">
        <PlaceSearch
          id="package-origin"
          label="From *"
          placeholder="Departure city"
          mode="city"
          defaultQuery={origin}
          onSelect={(place) => onOriginChange(place.name)}
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleSwapLocations}
          className="mb-0 hover:bg-white/10"
        >
          <ArrowLeftRight className="h-5 w-5 text-white/60" />
        </Button>

        <PlaceSearch
          id="package-destination"
          label="To *"
          placeholder="Destination city"
          mode="city"
          defaultQuery={destination}
          onSelect={(place) => onDestinationChange(place.name)}
        />
      </div>

      {/* Dates */}
      <DateRangePicker
        startDate={departDate}
        endDate={returnDate}
        onStartDateChange={onDepartDateChange}
        onEndDateChange={onReturnDateChange}
        startLabel="Depart"
        endLabel="Return"
        showNights={true}
      />

      {/* Travelers, Rooms, Flight Class */}
      <div className="grid md:grid-cols-4 gap-3">
        <div>
          <label className="text-sm font-medium text-white mb-2 block">Adults *</label>
          <Select value={adults.toString()} onValueChange={(v) => onAdultsChange(parseInt(v))}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-white mb-2 block">Children</label>
          <Select value={children.toString()} onValueChange={(v) => onChildrenChange(parseInt(v))}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[0, 1, 2, 3, 4].map((n) => (
                <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-white mb-2 block">Rooms *</label>
          <Select value={rooms.toString()} onValueChange={(v) => onRoomsChange(parseInt(v))}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-white mb-2 block">Class</label>
          <Select value={flightClass} onValueChange={onFlightClassChange}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="economy">Economy</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="first">First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Include Car */}
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="includeCar" 
          checked={includeCar}
          onCheckedChange={onIncludeCarChange}
        />
        <Label htmlFor="includeCar" className="text-white cursor-pointer">
          Include car rental
        </Label>
      </div>
    </div>
  );
};
