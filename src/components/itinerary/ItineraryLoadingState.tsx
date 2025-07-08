import { Plane } from "lucide-react";

interface ItineraryLoadingStateProps {
  message: string;
}

export const ItineraryLoadingState = ({ message }: ItineraryLoadingStateProps) => {
  return (
    <div className="min-h-screen bg-[#171821] flex items-center justify-center">
      <div className="text-center">
        <Plane className="h-12 w-12 text-white mx-auto mb-4 animate-pulse" />
        <p className="text-white/70">{message}</p>
      </div>
    </div>
  );
};