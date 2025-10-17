import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PlaceSearch } from '@/components/inputs/PlaceSearch';
import { CalendarIcon, Search, Users } from 'lucide-react';
import { format } from 'date-fns';

interface SearchFormProps {
  searchType: 'hotel' | 'flight' | 'activity' | 'package';
  onSearch: (params: any) => void;
}

export const SearchForm = ({ searchType, onSearch }: SearchFormProps) => {
  const [destination, setDestination] = useState('');
  const [origin, setOrigin] = useState('');
  const [checkinDate, setCheckinDate] = useState<Date>();
  const [checkoutDate, setCheckoutDate] = useState<Date>();
  const [adults, setAdults] = useState(2);
  const [rooms, setRooms] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const baseParams = {
      destination,
      checkin: checkinDate ? format(checkinDate, 'yyyy-MM-dd') : '',
      checkout: checkoutDate ? format(checkoutDate, 'yyyy-MM-dd') : '',
      adults,
      rooms,
    };

    if (searchType === 'flight' || searchType === 'package') {
      onSearch({ ...baseParams, origin });
    } else {
      onSearch(baseParams);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(searchType === 'flight' || searchType === 'package') && (
          <div>
            <PlaceSearch
              id="origin"
              label="From"
              mode="city"
              defaultQuery={origin}
              onSelect={(place) => setOrigin(place.name)}
              placeholder="Origin city or airport"
            />
          </div>
        )}

        <div>
          <PlaceSearch
            id="destination"
            label={searchType === 'flight' ? 'To' : 'Destination'}
            mode="city"
            defaultQuery={destination}
            onSelect={(place) => setDestination(place.name)}
            placeholder="Destination city"
          />
        </div>

        <div>
          <Label className="text-white">Check-in</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal mt-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {checkinDate ? format(checkinDate, 'PPP') : 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={checkinDate}
                onSelect={setCheckinDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label className="text-white">Check-out</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal mt-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {checkoutDate ? format(checkoutDate, 'PPP') : 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={checkoutDate}
                onSelect={setCheckoutDate}
                initialFocus
                disabled={(date) => checkinDate ? date < checkinDate : false}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label htmlFor="adults" className="text-white flex items-center gap-2">
            <Users className="h-4 w-4" />
            Adults
          </Label>
          <Input
            id="adults"
            type="number"
            min="1"
            max="10"
            value={adults}
            onChange={(e) => setAdults(parseInt(e.target.value))}
            className="mt-1 bg-white/10 border-white/20 text-white"
          />
        </div>

        {(searchType === 'hotel' || searchType === 'package') && (
          <div>
            <Label htmlFor="rooms" className="text-white">Rooms</Label>
            <Input
              id="rooms"
              type="number"
              min="1"
              max="5"
              value={rooms}
              onChange={(e) => setRooms(parseInt(e.target.value))}
              className="mt-1 bg-white/10 border-white/20 text-white"
            />
          </div>
        )}
      </div>

      <Button 
        type="submit" 
        className="w-full"
        disabled={!destination || !checkinDate || !checkoutDate}
      >
        <Search className="mr-2 h-4 w-4" />
        Search {searchType === 'package' ? 'Packages' : `${searchType}s`}
      </Button>
    </form>
  );
};
