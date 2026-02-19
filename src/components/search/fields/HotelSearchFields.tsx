import { DateRangePicker } from '../DateRangePicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlaceSearch } from '@/components/inputs/PlaceSearch';

interface HotelSearchFieldsProps {
  destination: string;
  checkinDate: Date | undefined;
  checkoutDate: Date | undefined;
  adults: number;
  children: number;
  rooms: number;
  onDestinationChange: (value: string) => void;
  onCheckinDateChange: (date: Date | undefined) => void;
  onCheckoutDateChange: (date: Date | undefined) => void;
  onAdultsChange: (value: number) => void;
  onChildrenChange: (value: number) => void;
  onRoomsChange: (value: number) => void;
}

export const HotelSearchFields = ({
  destination,
  checkinDate,
  checkoutDate,
  adults,
  children,
  rooms,
  onDestinationChange,
  onCheckinDateChange,
  onCheckoutDateChange,
  onAdultsChange,
  onChildrenChange,
  onRoomsChange,
}: HotelSearchFieldsProps) => {
  return (
    <div className="space-y-3">
      {/* Destination */}
      <PlaceSearch
        id="hotel-destination"
        label="Destination *"
        placeholder="City, hotel, or landmark"
        mode="hotel"
        defaultQuery={destination}
        onSelect={(place) => onDestinationChange(place.name)}
      />

      {/* Dates */}
      <DateRangePicker
        startDate={checkinDate}
        endDate={checkoutDate}
        onStartDateChange={onCheckinDateChange}
        onEndDateChange={onCheckoutDateChange}
        startLabel="Check-in"
        endLabel="Check-out"
        showNights={true}
      />

      {/* Guests & Rooms */}
      <div className="grid grid-cols-3 gap-2">
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
          <label className="text-xs font-medium text-foreground/60 mb-1.5 block">Children</label>
          <Select value={children.toString()} onValueChange={(v) => onChildrenChange(parseInt(v))}>
            <SelectTrigger className="bg-background/50 border-border text-foreground h-9 text-sm">
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
          <label className="text-xs font-medium text-foreground/60 mb-1.5 block">Rooms *</label>
          <Select value={rooms.toString()} onValueChange={(v) => onRoomsChange(parseInt(v))}>
            <SelectTrigger className="bg-background/50 border-border text-foreground h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={n.toString()}>{n} Room{n > 1 ? 's' : ''}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
