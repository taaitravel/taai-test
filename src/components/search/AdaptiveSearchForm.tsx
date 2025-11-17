import { useState } from 'react';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plane, Hotel, Car, Activity, Package, Search } from 'lucide-react';
import { FlightSearchFields } from './fields/FlightSearchFields';
import { HotelSearchFields } from './fields/HotelSearchFields';
import { CarSearchFields } from './fields/CarSearchFields';
import { ActivitySearchFields } from './fields/ActivitySearchFields';
import { PackageSearchFields } from './fields/PackageSearchFields';

export type SearchType = 'flights' | 'hotels' | 'cars' | 'activities' | 'packages';

interface AdaptiveSearchFormProps {
  onSearch: (type: SearchType, params: any) => void;
}

export const AdaptiveSearchForm = ({ onSearch }: AdaptiveSearchFormProps) => {
  const [searchType, setSearchType] = useState<SearchType>('hotels');

  // Flight fields
  const [tripType, setTripType] = useState<'roundtrip' | 'oneway'>('roundtrip');
  const [flightOrigin, setFlightOrigin] = useState('');
  const [flightDestination, setFlightDestination] = useState('');
  const [departDate, setDepartDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [flightAdults, setFlightAdults] = useState(1);
  const [flightChildren, setFlightChildren] = useState(0);
  const [flightClass, setFlightClass] = useState('economy');

  // Hotel fields
  const [hotelDestination, setHotelDestination] = useState('');
  const [checkinDate, setCheckinDate] = useState<Date>();
  const [checkoutDate, setCheckoutDate] = useState<Date>();
  const [hotelAdults, setHotelAdults] = useState(2);
  const [hotelChildren, setHotelChildren] = useState(0);
  const [rooms, setRooms] = useState(1);

  // Car fields
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [pickupDate, setPickupDate] = useState<Date>();
  const [dropoffDate, setDropoffDate] = useState<Date>();
  const [pickupTime, setPickupTime] = useState('10:00 AM');
  const [dropoffTime, setDropoffTime] = useState('10:00 AM');
  const [driverAge, setDriverAge] = useState('25-65');
  const [carType, setCarType] = useState('any');

  // Activity fields
  const [activityDestination, setActivityDestination] = useState('');
  const [activityDate, setActivityDate] = useState<Date>();
  const [participants, setParticipants] = useState(2);
  const [category, setCategory] = useState('all');

  // Package fields
  const [packageOrigin, setPackageOrigin] = useState('');
  const [packageDestination, setPackageDestination] = useState('');
  const [packageDepartDate, setPackageDepartDate] = useState<Date>();
  const [packageReturnDate, setPackageReturnDate] = useState<Date>();
  const [packageAdults, setPackageAdults] = useState(2);
  const [packageChildren, setPackageChildren] = useState(0);
  const [packageRooms, setPackageRooms] = useState(1);
  const [packageFlightClass, setPackageFlightClass] = useState('economy');
  const [includeCar, setIncludeCar] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let params: any = {};

    switch (searchType) {
      case 'flights':
        params = {
          tripType,
          origin: flightOrigin,
          destination: flightDestination,
          checkin: departDate ? format(departDate, 'yyyy-MM-dd') : undefined,
          checkout: tripType === 'roundtrip' && returnDate ? format(returnDate, 'yyyy-MM-dd') : undefined,
          adults: flightAdults,
          children: flightChildren,
          flightClass,
        };
        break;

      case 'hotels':
        params = {
          destination: hotelDestination,
          checkin: checkinDate ? format(checkinDate, 'yyyy-MM-dd') : undefined,
          checkout: checkoutDate ? format(checkoutDate, 'yyyy-MM-dd') : undefined,
          adults: hotelAdults,
          children: hotelChildren,
          rooms,
        };
        break;

      case 'cars':
        params = {
          pickupLocation,
          dropoffLocation,
          checkin: pickupDate ? format(pickupDate, 'yyyy-MM-dd') : undefined,
          checkout: dropoffDate ? format(dropoffDate, 'yyyy-MM-dd') : undefined,
          pickupTime,
          dropoffTime,
          driverAge,
          carType,
        };
        break;

      case 'activities':
        params = {
          destination: activityDestination,
          checkin: activityDate ? format(activityDate, 'yyyy-MM-dd') : undefined,
          participants,
          category,
        };
        break;

      case 'packages':
        params = {
          origin: packageOrigin,
          destination: packageDestination,
          checkin: packageDepartDate ? format(packageDepartDate, 'yyyy-MM-dd') : undefined,
          checkout: packageReturnDate ? format(packageReturnDate, 'yyyy-MM-dd') : undefined,
          adults: packageAdults,
          children: packageChildren,
          rooms: packageRooms,
          flightClass: packageFlightClass,
          includeCar,
        };
        break;
    }

    onSearch(searchType, params);
  };

  const isFormValid = () => {
    switch (searchType) {
      case 'flights':
        return flightOrigin && flightDestination && departDate && (tripType === 'oneway' || returnDate);
      case 'hotels':
        return hotelDestination && checkinDate && checkoutDate;
      case 'cars':
        return pickupLocation && dropoffLocation && pickupDate && dropoffDate;
      case 'activities':
        return activityDestination && activityDate;
      case 'packages':
        return packageOrigin && packageDestination && packageDepartDate && packageReturnDate;
      default:
        return false;
    }
  };

  const getSearchButtonText = () => {
    switch (searchType) {
      case 'flights': return 'Search Flights';
      case 'hotels': return 'Find Hotels';
      case 'cars': return 'Search Rental Cars';
      case 'activities': return 'Find Activities';
      case 'packages': return 'Search Package Deals';
      default: return 'Search';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <Tabs value={searchType} onValueChange={(v) => setSearchType(v as SearchType)}>
        <TabsList className="grid grid-cols-5 bg-[#1a1b26]/80 border border-white/10 mb-6 h-auto">
          <TabsTrigger 
            value="flights" 
            className="flex flex-col md:flex-row items-center gap-2 py-3 text-white/70 hover:text-white hover:bg-white/5 data-[state=active]:text-white data-[state=active]:bg-gradient-to-b data-[state=active]:from-primary/20 data-[state=active]:to-primary/10 data-[state=active]:border-b-2 data-[state=active]:border-primary"
          >
            <Plane className="h-5 w-5" />
            <span className="text-xs md:text-sm">Flights</span>
          </TabsTrigger>
          <TabsTrigger 
            value="hotels"
            className="flex flex-col md:flex-row items-center gap-2 py-3 text-white/70 hover:text-white hover:bg-white/5 data-[state=active]:text-white data-[state=active]:bg-gradient-to-b data-[state=active]:from-primary/20 data-[state=active]:to-primary/10 data-[state=active]:border-b-2 data-[state=active]:border-primary"
          >
            <Hotel className="h-5 w-5" />
            <span className="text-xs md:text-sm">Hotels</span>
          </TabsTrigger>
          <TabsTrigger 
            value="cars"
            className="flex flex-col md:flex-row items-center gap-2 py-3 text-white/70 hover:text-white hover:bg-white/5 data-[state=active]:text-white data-[state=active]:bg-gradient-to-b data-[state=active]:from-primary/20 data-[state=active]:to-primary/10 data-[state=active]:border-b-2 data-[state=active]:border-primary"
          >
            <Car className="h-5 w-5" />
            <span className="text-xs md:text-sm">Cars</span>
          </TabsTrigger>
          <TabsTrigger 
            value="activities"
            className="flex flex-col md:flex-row items-center gap-2 py-3 text-white/70 hover:text-white hover:bg-white/5 data-[state=active]:text-white data-[state=active]:bg-gradient-to-b data-[state=active]:from-primary/20 data-[state=active]:to-primary/10 data-[state=active]:border-b-2 data-[state=active]:border-primary"
          >
            <Activity className="h-5 w-5" />
            <span className="text-xs md:text-sm">Activities</span>
          </TabsTrigger>
          <TabsTrigger 
            value="packages"
            className="flex flex-col md:flex-row items-center gap-2 py-3 text-white/70 hover:text-white hover:bg-white/5 data-[state=active]:text-white data-[state=active]:bg-gradient-to-b data-[state=active]:from-primary/20 data-[state=active]:to-primary/10 data-[state=active]:border-b-2 data-[state=active]:border-primary"
          >
            <Package className="h-5 w-5" />
            <span className="text-xs md:text-sm">Packages</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flights" className="mt-0">
          <FlightSearchFields
            origin={flightOrigin}
            destination={flightDestination}
            departDate={departDate}
            returnDate={returnDate}
            adults={flightAdults}
            children={flightChildren}
            flightClass={flightClass}
            tripType={tripType}
            onOriginChange={setFlightOrigin}
            onDestinationChange={setFlightDestination}
            onDepartDateChange={setDepartDate}
            onReturnDateChange={setReturnDate}
            onAdultsChange={setFlightAdults}
            onChildrenChange={setFlightChildren}
            onFlightClassChange={setFlightClass}
            onTripTypeChange={setTripType}
          />
        </TabsContent>

        <TabsContent value="hotels" className="mt-0">
          <HotelSearchFields
            destination={hotelDestination}
            checkinDate={checkinDate}
            checkoutDate={checkoutDate}
            adults={hotelAdults}
            children={hotelChildren}
            rooms={rooms}
            onDestinationChange={setHotelDestination}
            onCheckinDateChange={setCheckinDate}
            onCheckoutDateChange={setCheckoutDate}
            onAdultsChange={setHotelAdults}
            onChildrenChange={setHotelChildren}
            onRoomsChange={setRooms}
          />
        </TabsContent>

        <TabsContent value="cars" className="mt-0">
          <CarSearchFields
            pickupLocation={pickupLocation}
            dropoffLocation={dropoffLocation}
            pickupDate={pickupDate}
            dropoffDate={dropoffDate}
            pickupTime={pickupTime}
            dropoffTime={dropoffTime}
            driverAge={driverAge}
            carType={carType}
            onPickupLocationChange={setPickupLocation}
            onDropoffLocationChange={setDropoffLocation}
            onPickupDateChange={setPickupDate}
            onDropoffDateChange={setDropoffDate}
            onPickupTimeChange={setPickupTime}
            onDropoffTimeChange={setDropoffTime}
            onDriverAgeChange={setDriverAge}
            onCarTypeChange={setCarType}
          />
        </TabsContent>

        <TabsContent value="activities" className="mt-0">
          <ActivitySearchFields
            destination={activityDestination}
            date={activityDate}
            participants={participants}
            category={category}
            onDestinationChange={setActivityDestination}
            onDateChange={setActivityDate}
            onParticipantsChange={setParticipants}
            onCategoryChange={setCategory}
          />
        </TabsContent>

        <TabsContent value="packages" className="mt-0">
          <PackageSearchFields
            origin={packageOrigin}
            destination={packageDestination}
            departDate={packageDepartDate}
            returnDate={packageReturnDate}
            adults={packageAdults}
            children={packageChildren}
            rooms={packageRooms}
            flightClass={packageFlightClass}
            includeCar={includeCar}
            onOriginChange={setPackageOrigin}
            onDestinationChange={setPackageDestination}
            onDepartDateChange={setPackageDepartDate}
            onReturnDateChange={setPackageReturnDate}
            onAdultsChange={setPackageAdults}
            onChildrenChange={setPackageChildren}
            onRoomsChange={setPackageRooms}
            onFlightClassChange={setPackageFlightClass}
            onIncludeCarChange={setIncludeCar}
          />
        </TabsContent>
      </Tabs>

      {/* Search Button */}
      <Button
        type="submit"
        className="w-full mt-6 h-12 text-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
        disabled={!isFormValid()}
      >
        <Search className="mr-2 h-5 w-5" />
        {getSearchButtonText()}
      </Button>
    </form>
  );
};
