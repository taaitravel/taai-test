import { MobileNavigation } from "@/components/shared/MobileNavigation";

interface DashboardNavigationProps {
  travelerLevel: string;
}

export const DashboardNavigation = ({ travelerLevel }: DashboardNavigationProps) => {
  return (
    <MobileNavigation 
      travelerLevel={travelerLevel}
      showProfileButton={true}
      showTripButtons={true}
    />
  );
};