import { Calendar, Users, DollarSign } from "lucide-react";
import { ItineraryData } from "@/types/itinerary";

interface ItineraryInfoHeaderProps {
  itineraryData: ItineraryData;
}

export const ItineraryInfoHeader = ({ itineraryData }: ItineraryInfoHeaderProps) => {
  const peopleCount = itineraryData.attendees ? itineraryData.attendees.length : 1;

  return (
    <div className="text-center mb-8">
      <h1 className="text-4xl font-bold text-white mb-2">{itineraryData.itin_name}</h1>
      <div className="flex justify-center items-center space-x-6 text-white/70 flex-wrap gap-2">
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
          <DollarSign className="h-4 w-4" />
          <span>${Number(itineraryData.budget).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};