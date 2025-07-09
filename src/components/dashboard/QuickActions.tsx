import { TravelHub } from "./sections/TravelHub";

interface QuickActionsProps {
  activeItineraries: any[];
  onBrowseTrips: () => void;
}

export const QuickActions = ({ activeItineraries, onBrowseTrips }: QuickActionsProps) => {
  return <TravelHub activeItineraries={activeItineraries} onBrowseTrips={onBrowseTrips} />;
};