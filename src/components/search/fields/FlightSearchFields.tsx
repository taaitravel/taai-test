import { useState } from 'react';
import { DateRangePicker } from '../DateRangePicker';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Plane, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <div className="space-y-4">
      {/* Trip Type */}
      <RadioGroup value={tripType} onValueChange={onTripTypeChange} className="flex gap-4">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="roundtrip" id="roundtrip" />
          <Label htmlFor="roundtrip" className="text-white cursor-pointer">Round-trip</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="oneway" id="oneway" />
          <Label htmlFor="oneway" className="text-white cursor-pointer">One-way</Label>
        </div>
      </RadioGroup>

      {/* From/To with Swap */}
      <div className="grid md:grid-cols-[1fr_auto_1fr] gap-3 items-end">
        <div>
          <label className="text-sm font-medium text-white mb-2 block">From *</label>
          <Input
            placeholder="City or airport"
            value={origin}
            onChange={(e) => onOriginChange(e.target.value)}
            className="bg-white/10 border-white/20 text-white"
          />
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleSwapLocations}
          className="mb-0 hover:bg-white/10"
        >
          <ArrowLeftRight className="h-5 w-5 text-white/60" />
        </Button>

        <div>
          <label className="text-sm font-medium text-white mb-2 block">To *</label>
          <Input
            placeholder="City or airport"
            value={destination}
            onChange={(e) => onDestinationChange(e.target.value)}
            className="bg-white/10 border-white/20 text-white"
          />
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
          <label className="text-sm font-medium text-white mb-2 block">Class</label>
          <Select value={flightClass} onValueChange={onFlightClassChange}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
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
