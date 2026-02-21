import { Calendar, Users, Wallet } from "lucide-react";
import { ItineraryData } from "@/types/itinerary";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/hooks/useAuthenticatedItineraryData";

interface ItineraryInfoHeaderProps {
  itineraryData: ItineraryData;
  userRole?: UserRole;
}

export const ItineraryInfoHeader = ({ itineraryData, userRole }: ItineraryInfoHeaderProps) => {
  const peopleCount = itineraryData.attendees ? itineraryData.attendees.length : 1;

  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-center gap-3 mb-2">
        <h1 className="text-4xl font-bold text-foreground">{itineraryData.itin_name}</h1>
        {userRole === 'collaborator' && (
          <Badge variant="secondary" className="text-xs">
            Collaborator
          </Badge>
        )}
      </div>
      <div className="flex justify-center items-center space-x-6 text-muted-foreground flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4" />
          <span>
            {new Date(itineraryData.itin_date_start).toLocaleDateString()} - 
            {new Date(itineraryData.itin_date_end).toLocaleDateString()}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4" />
          <span>{peopleCount} {peopleCount === 1 ? 'Traveler' : 'Travelers'}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Wallet className="h-4 w-4" />
          <span>${Number(itineraryData.budget).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};
