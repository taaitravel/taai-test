import { MobileNavigation } from "@/components/shared/MobileNavigation";
import { Button } from "@/components/ui/button";
import { Edit, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ItineraryHeaderProps {
  itineraryId: number;
}

export const ItineraryHeader = ({ itineraryId }: ItineraryHeaderProps) => {
  const navigate = useNavigate();

  return (
    <MobileNavigation 
      travelerLevel="Master Traveler"
      showBackButton={true}
      backPath="/dashboard"
      backLabel="Back to Dashboard"
      showProfileButton={false}
      showTripButtons={false}
      customActions={
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-10 h-10 p-0 rounded-full bg-white text-[#171821] border-white hover:bg-gradient-to-r hover:from-[hsl(351,85%,75%)] hover:via-[hsl(15,80%,70%)] hover:to-[hsl(25,75%,65%)] hover:text-white active:bg-gradient-to-r active:from-[hsl(351,85%,75%)] active:via-[hsl(15,80%,70%)] active:to-[hsl(25,75%,65%)] active:text-white transition-all duration-300"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            className="w-10 h-10 p-0 rounded-full gold-gradient hover:opacity-90 text-[#171821] font-semibold"
            onClick={() => navigate(`/edit-itinerary?id=${itineraryId}`)}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      }
    />
  );
};