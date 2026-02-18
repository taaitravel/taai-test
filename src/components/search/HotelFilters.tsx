import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Star, Wifi, Car, Coffee, Waves, Utensils, Dumbbell, Wind, Home } from 'lucide-react';

export interface HotelFilterState {
  priceRange: [number, number];
  starRatings: number[];
  amenities: string[];
  guestRating: number;
  propertyType: 'all' | 'hotel' | 'rental';
}

interface HotelFiltersProps {
  filters: HotelFilterState;
  onFiltersChange: (filters: HotelFilterState) => void;
  maxPrice?: number;
}

const AMENITIES = [
  { id: 'wifi', label: 'WiFi', icon: Wifi },
  { id: 'parking', label: 'Parking', icon: Car },
  { id: 'breakfast', label: 'Breakfast', icon: Coffee },
  { id: 'pool', label: 'Pool', icon: Waves },
  { id: 'restaurant', label: 'Restaurant', icon: Utensils },
  { id: 'gym', label: 'Gym', icon: Dumbbell },
  { id: 'ac', label: 'Air Conditioning', icon: Wind },
];

const STAR_RATINGS = [5, 4, 3, 2, 1];
const GUEST_RATINGS = [9, 8, 7, 6];

export const HotelFilters = ({ filters, onFiltersChange, maxPrice = 1000 }: HotelFiltersProps) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const updateFilters = (partial: Partial<HotelFilterState>) => {
    const newFilters = { ...localFilters, ...partial };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handlePriceChange = (value: number[]) => {
    updateFilters({ priceRange: [value[0], value[1]] as [number, number] });
  };

  const handleStarRatingToggle = (rating: number) => {
    const newRatings = localFilters.starRatings.includes(rating)
      ? localFilters.starRatings.filter(r => r !== rating)
      : [...localFilters.starRatings, rating];
    updateFilters({ starRatings: newRatings });
  };

  const handleAmenityToggle = (amenity: string) => {
    const newAmenities = localFilters.amenities.includes(amenity)
      ? localFilters.amenities.filter(a => a !== amenity)
      : [...localFilters.amenities, amenity];
    updateFilters({ amenities: newAmenities });
  };

  const handleGuestRatingChange = (rating: number) => {
    updateFilters({ guestRating: rating });
  };

  const handleReset = () => {
    const resetFilters: HotelFilterState = {
      priceRange: [0, maxPrice],
      starRatings: [],
      amenities: [],
      guestRating: 0,
      propertyType: 'all',
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  return (
    <Card className="bg-background/95 backdrop-blur-md border-border p-6 space-y-6">
      {/* Property Type */}
      <div className="space-y-3">
        <Label className="text-foreground font-semibold">Property Type</Label>
        <RadioGroup
          value={localFilters.propertyType}
          onValueChange={(val) => updateFilters({ propertyType: val as HotelFilterState['propertyType'] })}
          className="space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="all" id="pt-all" />
            <label htmlFor="pt-all" className="text-sm cursor-pointer text-foreground">All Properties</label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="hotel" id="pt-hotel" />
            <label htmlFor="pt-hotel" className="text-sm cursor-pointer text-foreground flex items-center gap-1.5">
              🏨 Hotels Only
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="rental" id="pt-rental" />
            <label htmlFor="pt-rental" className="text-sm cursor-pointer text-foreground flex items-center gap-1.5">
              <Home className="h-3.5 w-3.5 text-rental" />
              <span>Vacation Rentals</span>
              <span className="inline-block w-2 h-2 rounded-full bg-rental" />
            </label>
          </div>
        </RadioGroup>
      </div>

      {/* Price Range */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-foreground font-semibold">Price Range</Label>
          <span className="text-sm text-muted-foreground">
            ${localFilters.priceRange[0]} - ${localFilters.priceRange[1]}
          </span>
        </div>
        <Slider
          value={localFilters.priceRange}
          onValueChange={handlePriceChange}
          max={maxPrice}
          step={10}
          className="w-full"
        />
      </div>

      {/* Star Rating */}
      <div className="space-y-3">
        <Label className="text-foreground font-semibold">Star Rating</Label>
        <div className="space-y-2">
          {STAR_RATINGS.map((rating) => (
            <div key={rating} className="flex items-center space-x-2">
              <Checkbox
                id={`star-${rating}`}
                checked={localFilters.starRatings.includes(rating)}
                onCheckedChange={() => handleStarRatingToggle(rating)}
              />
              <label htmlFor={`star-${rating}`} className="flex items-center gap-1 text-sm cursor-pointer text-foreground">
                {Array.from({ length: rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                ))}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Amenities */}
      <div className="space-y-3">
        <Label className="text-foreground font-semibold">Amenities</Label>
        <div className="grid grid-cols-1 gap-2">
          {AMENITIES.map((amenity) => {
            const Icon = amenity.icon;
            return (
              <div key={amenity.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`amenity-${amenity.id}`}
                  checked={localFilters.amenities.includes(amenity.id)}
                  onCheckedChange={() => handleAmenityToggle(amenity.id)}
                />
                <label htmlFor={`amenity-${amenity.id}`} className="flex items-center gap-2 text-sm cursor-pointer text-foreground">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {amenity.label}
                </label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Guest Rating */}
      <div className="space-y-3">
        <Label className="text-foreground font-semibold">Guest Rating</Label>
        <div className="space-y-2">
          {GUEST_RATINGS.map((rating) => (
            <div key={rating} className="flex items-center space-x-2">
              <Checkbox
                id={`guest-${rating}`}
                checked={localFilters.guestRating === rating}
                onCheckedChange={() => handleGuestRatingChange(rating)}
              />
              <label htmlFor={`guest-${rating}`} className="text-sm cursor-pointer text-foreground">
                {rating}+ Excellent
              </label>
            </div>
          ))}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="guest-any"
              checked={localFilters.guestRating === 0}
              onCheckedChange={() => handleGuestRatingChange(0)}
            />
            <label htmlFor="guest-any" className="text-sm cursor-pointer text-foreground">
              Any rating
            </label>
          </div>
        </div>
      </div>

      {/* Reset Button */}
      <Button variant="outline" onClick={handleReset} className="w-full bg-background hover:bg-muted">
        Reset Filters
      </Button>
    </Card>
  );
};
