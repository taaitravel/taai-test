import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LocationSelector } from '@/components/LocationSelector';
import { Calendar, Users, Plane, Hotel, Car, Activity, Package } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ComprehensiveSearchFormProps {
  onSearch: (params: any) => void;
}

export const ComprehensiveSearchForm = ({ onSearch }: ComprehensiveSearchFormProps) => {
  const [origin, setOrigin] = useState<Array<{ city: string; lat: number; lng: number }>>([]);
  const [destination, setDestination] = useState<Array<{ city: string; lat: number; lng: number }>>([]);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState('2');
  const [children, setChildren] = useState('0');
  const [rooms, setRooms] = useState('1');
  const [searchTypes, setSearchTypes] = useState({
    flights: true,
    hotels: true,
    cars: false,
    activities: false,
  });
  const [flightClass, setFlightClass] = useState('economy');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearchTypeToggle = (type: keyof typeof searchTypes) => {
    setSearchTypes(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const handlePackageToggle = (checked: boolean) => {
    if (checked) {
      setSearchTypes({ flights: true, hotels: true, cars: true, activities: false });
    }
  };

  const handleSearch = () => {
    if (destination.length === 0 || !checkIn || !checkOut) {
      return;
    }

    const searchParams = {
      origin: origin[0]?.city || '',
      destination: destination[0]?.city || '',
      checkin: checkIn,
      checkout: checkOut,
      adults: parseInt(adults),
      children: parseInt(children),
      rooms: parseInt(rooms),
      searchTypes,
      flightClass,
    };

    onSearch(searchParams);
  };

  const isPackageSearch = searchTypes.flights && searchTypes.hotels && searchTypes.cars;
  const isValid = destination.length > 0 && checkIn && checkOut;

  return (
    <div className="space-y-6 p-6">
      {/* Search Type Toggles */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Button
          variant={searchTypes.flights ? "default" : "outline"}
          onClick={() => handleSearchTypeToggle('flights')}
          className="flex items-center gap-2 bg-white/5 border-white/20 text-white hover:bg-white/10"
        >
          <Plane className="h-4 w-4" />
          Flights
        </Button>
        <Button
          variant={searchTypes.hotels ? "default" : "outline"}
          onClick={() => handleSearchTypeToggle('hotels')}
          className="flex items-center gap-2 bg-white/5 border-white/20 text-white hover:bg-white/10"
        >
          <Hotel className="h-4 w-4" />
          Hotels
        </Button>
        <Button
          variant={searchTypes.cars ? "default" : "outline"}
          onClick={() => handleSearchTypeToggle('cars')}
          className="flex items-center gap-2 bg-white/5 border-white/20 text-white hover:bg-white/10"
        >
          <Car className="h-4 w-4" />
          Cars
        </Button>
        <Button
          variant={searchTypes.activities ? "default" : "outline"}
          onClick={() => handleSearchTypeToggle('activities')}
          className="flex items-center gap-2 bg-white/5 border-white/20 text-white hover:bg-white/10"
        >
          <Activity className="h-4 w-4" />
          Activities
        </Button>
        <div className="flex items-center space-x-2 p-3 bg-white/5 border border-white/20 rounded-md">
          <Checkbox 
            id="package" 
            checked={isPackageSearch}
            onCheckedChange={handlePackageToggle}
            className="border-white/30"
          />
          <label htmlFor="package" className="text-sm text-white flex items-center gap-1">
            <Package className="h-4 w-4" />
            Package
          </label>
        </div>
      </div>

      {/* Main Search Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Origin (for flights) */}
        {searchTypes.flights && (
          <div className="space-y-2">
            <Label className="text-white flex items-center gap-2">
              <Plane className="h-4 w-4" />
              From (Origin)
            </Label>
            <LocationSelector
              onLocationsChange={setOrigin}
              placeholder="Departure city..."
              maxLocations={1}
            />
          </div>
        )}

        {/* Destination */}
        <div className="space-y-2">
          <Label className="text-white flex items-center gap-2">
            <Activity className="h-4 w-4" />
            To (Destination) *
          </Label>
          <LocationSelector
            onLocationsChange={setDestination}
            placeholder="Search destination..."
            maxLocations={1}
          />
        </div>

        {/* Check-in Date */}
        <div className="space-y-2">
          <Label htmlFor="checkin" className="text-white flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Check-in / Departure *
          </Label>
          <Input
            id="checkin"
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="bg-[#1f1f27] border-white/30 text-white"
          />
        </div>

        {/* Check-out Date */}
        <div className="space-y-2">
          <Label htmlFor="checkout" className="text-white flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Check-out / Return *
          </Label>
          <Input
            id="checkout"
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="bg-[#1f1f27] border-white/30 text-white"
          />
        </div>

        {/* Travelers */}
        <div className="space-y-2">
          <Label htmlFor="adults" className="text-white flex items-center gap-2">
            <Users className="h-4 w-4" />
            Adults
          </Label>
          <Input
            id="adults"
            type="number"
            min="1"
            max="20"
            value={adults}
            onChange={(e) => setAdults(e.target.value)}
            className="bg-[#1f1f27] border-white/30 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="children" className="text-white flex items-center gap-2">
            <Users className="h-4 w-4" />
            Children
          </Label>
          <Input
            id="children"
            type="number"
            min="0"
            max="10"
            value={children}
            onChange={(e) => setChildren(e.target.value)}
            className="bg-[#1f1f27] border-white/30 text-white"
          />
        </div>

        {/* Rooms (for hotels) */}
        {searchTypes.hotels && (
          <div className="space-y-2">
            <Label htmlFor="rooms" className="text-white flex items-center gap-2">
              <Hotel className="h-4 w-4" />
              Rooms
            </Label>
            <Input
              id="rooms"
              type="number"
              min="1"
              max="10"
              value={rooms}
              onChange={(e) => setRooms(e.target.value)}
              className="bg-[#1f1f27] border-white/30 text-white"
            />
          </div>
        )}
      </div>

      {/* Advanced Options */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="text-white/70 hover:text-white">
            {showAdvanced ? '▼' : '▶'} Advanced Options
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-4">
          {searchTypes.flights && (
            <div className="space-y-2">
              <Label className="text-white">Flight Class</Label>
              <Select value={flightClass} onValueChange={setFlightClass}>
                <SelectTrigger className="bg-[#1f1f27] border-white/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="economy">Economy</SelectItem>
                  <SelectItem value="premium_economy">Premium Economy</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="first">First Class</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Search Button */}
      <Button
        onClick={handleSearch}
        disabled={!isValid}
        className="w-full gold-gradient hover:opacity-90 text-[#171821] font-semibold text-lg py-6"
      >
        Search
      </Button>
    </div>
  );
};
