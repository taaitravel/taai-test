import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlaceSearch, PlaceResult } from "@/components/inputs/PlaceSearch";

interface AddDestinationDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (cityName: string, lat: number, lng: number) => void;
}

export const AddDestinationDialog = ({
  open,
  onClose,
  onAdd,
}: AddDestinationDialogProps) => {
  const [selectedPlace, setSelectedPlace] = useState<{
    city: string;
    lat: number;
    lng: number;
  } | null>(null);

  const handlePlaceSelect = (place: PlaceResult) => {
    setSelectedPlace({
      city: place.name,
      lat: place.lat,
      lng: place.lng,
    });
  };

  const handleAdd = () => {
    if (selectedPlace) {
      onAdd(selectedPlace.city, selectedPlace.lat, selectedPlace.lng);
      setSelectedPlace(null);
      onClose();
    }
  };

  const handleCancel = () => {
    setSelectedPlace(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[500px] bg-[#171821]/95 border-white/30 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="text-white">Add Destination</DialogTitle>
          <DialogDescription className="text-white/70">
            Search for a city or location to add to your itinerary.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <PlaceSearch
            id="destination-search"
            label="Search Destination"
            mode="city"
            placeholder="Search for a destination..."
            onSelect={handlePlaceSelect}
          />
          {selectedPlace && (
            <div className="p-3 bg-white/10 rounded-lg border border-white/20">
              <p className="text-sm text-white font-medium">Selected:</p>
              <p className="text-white">{selectedPlace.city}</p>
            </div>
          )}
        </div>
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="border-white/30 text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={!selectedPlace}
            className="gold-gradient hover:opacity-90 text-[#171821] font-semibold"
          >
            Add Destination
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
