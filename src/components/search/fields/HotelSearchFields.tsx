import { DateRangePicker } from '../DateRangePicker';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    <div className="space-y-4">
      {/* Destination */}
      <div>
        <label className="text-sm font-medium text-white mb-2 block">Destination *</label>
        <Input
          placeholder="City, hotel, or landmark"
          value={destination}
          onChange={(e) => onDestinationChange(e.target.value)}
          className="bg-white/10 border-white/20 text-white"
        />
      </div>

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
      <div className="grid md:grid-cols-3 gap-3">
        <div>
          <label className="text-sm font-medium text-white mb-2 block">Adults *</label>
          <Select value={adults.toString()} onValueChange={(v) => onAdultsChange(parseInt(v))}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
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
          <label className="text-sm font-medium text-white mb-2 block">Children</label>
          <Select value={children.toString()} onValueChange={(v) => onChildrenChange(parseInt(v))}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
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
          <label className="text-sm font-medium text-white mb-2 block">Rooms *</label>
          <Select value={rooms.toString()} onValueChange={(v) => onRoomsChange(parseInt(v))}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
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
