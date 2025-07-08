import { DashboardNavigation } from "./DashboardNavigation";
import { DashboardContent } from "./DashboardContent";
import { useDashboard } from "@/hooks/useDashboard";

export const DashboardLayout = () => {
  const { fullUserStats } = useDashboard();

  return (
    <div className="min-h-screen bg-[#171821]">
      <DashboardNavigation travelerLevel={fullUserStats.travelerLevel} />
      <DashboardContent />
    </div>
  );
};