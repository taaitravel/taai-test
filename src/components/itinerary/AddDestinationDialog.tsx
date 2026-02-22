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
      <DialogContent className="sm:max-w-[500px] bg-card/95 border-border backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add Destination</DialogTitle>
          <DialogDescription className="text-muted-foreground">
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
            <div className="p-3 bg-muted rounded-lg border border-border">
              <p className="text-sm text-foreground font-medium">Selected:</p>
              <p className="text-foreground">{selectedPlace.city}</p>
            </div>
          )}
        </div>
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="border-border text-foreground hover:bg-accent"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={!selectedPlace}
            className="gold-gradient hover:opacity-90 text-background font-semibold"
          >
            Add Destination
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
