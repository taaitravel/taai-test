import { Calendar, Users, Wallet } from "lucide-react";
import { ItineraryData } from "@/types/itinerary";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/hooks/useAuthenticatedItineraryData";
import { formatDateOnlyRange } from '@/lib/date-time';

interface ItineraryInfoHeaderProps {
  itineraryData: ItineraryData;
  userRole?: UserRole;
  acceptedTravelerCount: number;
}

export const ItineraryInfoHeader = ({ itineraryData, userRole, acceptedTravelerCount }: ItineraryInfoHeaderProps) => {
  const plannedTravelerCount = itineraryData.planned_traveler_count
    ?? (itineraryData.attendees?.length || 1);

  return (
    <div className="text-center mb-8 px-2">
      <div className="flex items-center justify-center gap-3 mb-2">
        <h1 className="text-2xl sm:text-4xl font-bold text-foreground">{itineraryData.itin_name}</h1>
        {userRole === 'collaborator' && (
          <Badge variant="secondary" className="text-xs">
            Collaborator
          </Badge>
        )}
      </div>
      <div className="flex justify-center items-center text-muted-foreground flex-wrap gap-2 sm:gap-6">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 flex-shrink-0" />
          <span className="text-xs sm:text-base">
            {formatDateOnlyRange(itineraryData.itin_date_start, itineraryData.itin_date_end) || 'Dates TBD'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 flex-shrink-0" />
          <span className="text-xs sm:text-base">
            {plannedTravelerCount} planned · {acceptedTravelerCount} {acceptedTravelerCount === 1 ? 'member' : 'members'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Wallet className="h-4 w-4 flex-shrink-0" />
          <span className="text-xs sm:text-base">${Number(itineraryData.budget).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};
