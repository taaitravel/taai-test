import { HeroWelcome } from "./sections/HeroWelcome";
import { UpcomingTravel } from "./sections/UpcomingTravel";
import { useDashboardSections } from "@/hooks/useDashboardSections";

interface HeroSectionProps {
  userProfile: any;
  activeItineraries?: any[];
}

export const HeroSection = ({ userProfile, activeItineraries = [] }: HeroSectionProps) => {
  const { nextTrip } = useDashboardSections(activeItineraries);

  return (
    <div className="mb-6">
      <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent p-4 sm:p-6 rounded-2xl border border-white/30 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-0">
          <HeroWelcome userProfile={userProfile} nextTrip={nextTrip} />
          <UpcomingTravel nextTrip={nextTrip} />
        </div>
      </div>
    </div>
  );
};