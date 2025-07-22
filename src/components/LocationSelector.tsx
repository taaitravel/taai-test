import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Location {
  city: string;
  lat: number;
  lng: number;
}

interface LocationSelectorProps {
  onLocationsChange: (locations: Location[]) => void;
  placeholder?: string;
  maxLocations?: number;
}

export const LocationSelector = ({ 
  onLocationsChange, 
  placeholder = "Search for cities...",
  maxLocations = 10
}: LocationSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const searchLocations = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('search-cities', {
        body: { query }
      });

      if (error) throw error;

      if (data?.locations?.length > 0) {
        const locations = data.locations.map((location: any) => ({
          city: location.fullName,
          lat: location.lat,
          lng: location.lng
        }));
        setSearchResults(locations);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching locations:', error);
      toast({
        title: "Search Error",
        description: "Failed to search locations. Please try again.",
        variant: "destructive"
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchLocations(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleLocationSelect = (location: Location) => {
    if (selectedLocations.find(loc => loc.city === location.city)) {
      toast({
        title: "Already Added",
        description: "This location is already in your list.",
        variant: "destructive"
      });
      return;
    }

    if (selectedLocations.length >= maxLocations) {
      toast({
        title: "Maximum Reached",
        description: `You can only add up to ${maxLocations} locations.`,
        variant: "destructive"
      });
      return;
    }

    const newLocations = [...selectedLocations, location];
    setSelectedLocations(newLocations);
    onLocationsChange(newLocations);
    setSearchTerm("");
    setSearchResults([]);
  };

  const handleLocationRemove = (cityToRemove: string) => {
    const newLocations = selectedLocations.filter(loc => loc.city !== cityToRemove);
    setSelectedLocations(newLocations);
    onLocationsChange(newLocations);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-[#1f1f27] border-white/30 text-white placeholder:text-white/50 focus:border-white pr-10"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-white/50" />
        )}
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-[#1f1f27] border border-white/30 rounded-md max-h-40 overflow-y-auto">
          {searchResults.map((location, index) => (
            <Button
              key={`${location.city}-${index}`}
              variant="ghost"
              className="w-full justify-start text-white hover:bg-white/10 px-3 py-2 h-auto"
              onClick={() => handleLocationSelect(location)}
            >
              <MapPin className="h-4 w-4 mr-2 text-white/70" />
              <span>{location.city}</span>
              <span className="ml-auto text-xs text-white/50">
                {location.lat.toFixed(2)}, {location.lng.toFixed(2)}
              </span>
            </Button>
          ))}
        </div>
      )}

      {/* Selected Locations */}
      {selectedLocations.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-white/70">Selected Destinations:</p>
          <div className="flex flex-wrap gap-2">
            {selectedLocations.map((location, index) => (
              <Badge
                key={`${location.city}-selected-${index}`}
                variant="secondary"
                className="bg-white/10 text-white border-white/30 pr-1"
              >
                <MapPin className="h-3 w-3 mr-1" />
                {location.city}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1 hover:bg-white/20"
                  onClick={() => handleLocationRemove(location.city)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};