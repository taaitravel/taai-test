import { Button } from "@/components/ui/button";
import { Plus, Plane, Hotel, Car, Activity, Package, UtensilsCrossed, FolderOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TravelHubProps {
  activeItineraries: any[];
  onBrowseTrips: () => void;
}

export const TravelHub = ({ activeItineraries, onBrowseTrips }: TravelHubProps) => {
  const navigate = useNavigate();

  const upcomingCount = activeItineraries.filter(trip => 
    ['planning', 'upcoming', 'active'].includes(trip.status)
  ).length;
  const completedCount = activeItineraries.filter(trip => trip.status === 'completed').length;

  const actions = [
    {
      icon: Plus,
      label: "New Itinerary",
      onClick: () => navigate('/new-manual-itinerary'),
      className: "bright-btn-grad"
    },
    {
      icon: Hotel,
      label: "Properties",
      onClick: () => navigate('/search?tab=hotels'),
      className: "bright-btn-ghost"
    },
    {
      icon: Plane,
      label: "Flights",
      onClick: () => navigate('/search?tab=flights'),
      className: "bright-btn-ghost"
    },
    {
      icon: Activity,
      label: "Activities",
      onClick: () => navigate('/search?tab=activities'),
      className: "bright-btn-ghost"
    },
    {
      icon: Car,
      label: "Cars",
      onClick: () => navigate('/search?tab=cars'),
      className: "bright-btn-ghost"
    },
    {
      icon: Package,
      label: "Packages",
      onClick: () => navigate('/search?tab=packages'),
      className: "bright-btn-ghost"
    },
    {
      icon: UtensilsCrossed,
      label: "Dining",
      onClick: () => navigate('/search?tab=dining'),
      className: "bright-btn-ghost"
    }
  ];


  return (
    <div className="w-full space-y-3">
      {/* Compact Header with Browse */}
      <div className="flex items-center justify-between">
        <h3 className="font-mono-label">Quick Actions</h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={onBrowseTrips}
          className="h-7 text-muted-foreground hover:text-foreground hover:bg-accent gap-1.5 text-xs px-2 rounded-full"
        >
          <FolderOpen className="h-3.5 w-3.5" />
          {upcomingCount} upcoming · {completedCount} past
        </Button>
      </div>

      {/* Action pills */}
      <div className="flex flex-wrap gap-2">
        {actions.map((action, index) => (
          <Button
            key={index}
            size="sm"
            variant="outline"
            onClick={action.onClick}
            className={`h-10 rounded-full px-4 flex items-center justify-center gap-1.5 text-xs font-medium whitespace-nowrap transition-all duration-300 ${action.className}`}
          >
            <action.icon className="h-3.5 w-3.5 shrink-0" />
            {action.label}
          </Button>
        ))}
      </div>

    </div>
  );
};

