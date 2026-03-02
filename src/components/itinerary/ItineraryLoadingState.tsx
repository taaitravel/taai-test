import { Plane } from "lucide-react";

interface ItineraryLoadingStateProps {
  message: string;
}

export const ItineraryLoadingState = ({ message }: ItineraryLoadingStateProps) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Plane className="h-12 w-12 text-foreground mx-auto mb-4 animate-pulse" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};