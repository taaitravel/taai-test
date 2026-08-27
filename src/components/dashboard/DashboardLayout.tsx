import { DashboardNavigation } from "./DashboardNavigation";
import { DashboardContent } from "./DashboardContent";
import { useDashboard } from "@/hooks/useDashboard";

export const DashboardLayout = () => {
  const { fullUserStats } = useDashboard();

  return (
    <div className="relative min-h-screen bg-background">
      {/* Ambient bright orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="bright-orb bright-orb-a h-[420px] w-[420px] opacity-[0.18] -top-40 -right-24" />
        <div className="bright-orb bright-orb-b h-[360px] w-[360px] opacity-[0.12] top-[55%] -left-32" />
      </div>
      <div className="relative z-10">
      <DashboardNavigation travelerLevel={fullUserStats.travelerLevel} />
      <DashboardContent />
      </div>
    </div>
  );
};