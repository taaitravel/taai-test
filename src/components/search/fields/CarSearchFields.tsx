import { useState } from 'react';
import { DateRangePicker } from '../DateRangePicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { PlaceSearch } from '@/components/inputs/PlaceSearch';

interface CarSearchFieldsProps {
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: Date | undefined;
  dropoffDate: Date | undefined;
  pickupTime: string;
  dropoffTime: string;
  driverAge: string;
  carType: string;
  onPickupLocationChange: (value: string) => void;
  onDropoffLocationChange: (value: string) => void;
  onPickupDateChange: (date: Date | undefined) => void;
  onDropoffDateChange: (date: Date | undefined) => void;
  onPickupTimeChange: (value: string) => void;
  onDropoffTimeChange: (value: string) => void;
  onDriverAgeChange: (value: string) => void;
  onCarTypeChange: (value: string) => void;
}

export const CarSearchFields = ({
  pickupLocation,
  dropoffLocation,
  pickupDate,
  dropoffDate,
  pickupTime,
  dropoffTime,
  driverAge,
  carType,
  onPickupLocationChange,
  onDropoffLocationChange,
  onPickupDateChange,
  onDropoffDateChange,
  onPickupTimeChange,
  onDropoffTimeChange,
  onDriverAgeChange,
  onCarTypeChange,
}: CarSearchFieldsProps) => {
  const [sameLocation, setSameLocation] = useState(true);

  const handleSameLocationToggle = (checked: boolean) => {
    setSameLocation(checked);
    if (checked) {
      onDropoffLocationChange(pickupLocation);
    }
  };

  return (
    <div className="space-y-4">
      {/* Pick-up Location */}
      <PlaceSearch
        id="car-pickup"
        label="Pick-up Location *"
        placeholder="City or airport"
        mode="city"
        defaultQuery={pickupLocation}
        onSelect={(place) => {
          onPickupLocationChange(place.name);
          if (sameLocation) onDropoffLocationChange(place.name);
        }}
      />

      {/* Same Location Checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="sameLocation" 
          checked={sameLocation}
          onCheckedChange={handleSameLocationToggle}
        />
        <Label htmlFor="sameLocation" className="text-foreground cursor-pointer">
          Return to same location
        </Label>
      </div>

      {/* Drop-off Location */}
      {!sameLocation && (
        <PlaceSearch
          id="car-dropoff"
          label="Drop-off Location *"
          placeholder="City or airport"
          mode="city"
          defaultQuery={dropoffLocation}
          onSelect={(place) => onDropoffLocationChange(place.name)}
        />
      )}

      {/* Dates */}
      <DateRangePicker
        startDate={pickupDate}
        endDate={dropoffDate}
        onStartDateChange={onPickupDateChange}
        onEndDateChange={onDropoffDateChange}
        startLabel="Pick-up"
        endLabel="Drop-off"
        showNights={false}
      />

      {/* Times */}
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Pick-up Time *</label>
          <Select value={pickupTime} onValueChange={onPickupTimeChange}>
            <SelectTrigger className="bg-background/50 border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'].map((time) => (
                <SelectItem key={time} value={time}>{time}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Drop-off Time *</label>
          <Select value={dropoffTime} onValueChange={onDropoffTimeChange}>
            <SelectTrigger className="bg-background/50 border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'].map((time) => (
                <SelectItem key={time} value={time}>{time}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Driver Age & Car Type */}
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Driver Age *</label>
          <Select value={driverAge} onValueChange={onDriverAgeChange}>
            <SelectTrigger className="bg-background/50 border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25-65">25-65</SelectItem>
              <SelectItem value="18-24">18-24</SelectItem>
              <SelectItem value="65+">65+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Car Type</label>
          <Select value={carType} onValueChange={onCarTypeChange}>
            <SelectTrigger className="bg-background/50 border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="economy">Economy</SelectItem>
              <SelectItem value="suv">SUV</SelectItem>
              <SelectItem value="luxury">Luxury</SelectItem>
              <SelectItem value="van">Van</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
