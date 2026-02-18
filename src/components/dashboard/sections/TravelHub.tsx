import { Button } from "@/components/ui/button";
import { Plus, Plane, Hotel, Car, Activity, Package, UtensilsCrossed, FolderOpen, Clock } from "lucide-react";
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
      className: "gold-gradient text-background hover:opacity-90"
    },
    {
      icon: Hotel,
      label: "Properties",
      onClick: () => navigate('/search?tab=hotels'),
      className: "border-border text-foreground hover:bg-accent bg-transparent"
    },
    {
      icon: Plane,
      label: "Flights",
      onClick: () => navigate('/search?tab=flights'),
      className: "border-border text-foreground hover:bg-accent bg-transparent"
    },
    {
      icon: Activity,
      label: "Activities",
      onClick: () => navigate('/search?tab=activities'),
      className: "border-border text-foreground hover:bg-accent bg-transparent"
    },
    {
      icon: Car,
      label: "Cars",
      onClick: () => navigate('/search?tab=cars'),
      className: "border-border text-foreground hover:bg-accent bg-transparent"
    },
    {
      icon: Package,
      label: "Packages",
      onClick: () => navigate('/search?tab=packages'),
      className: "border-border text-foreground hover:bg-accent bg-transparent"
    },
    {
      icon: UtensilsCrossed,
      label: "Dining",
      onClick: () => navigate('/search?tab=dining'),
      className: "border-border text-foreground hover:bg-accent bg-transparent"
    }
  ];

  const recentActivities = [
    { action: "Updated Singapore budget", time: "2h" },
    { action: "Added hotel", time: "1d" },
    { action: "New itinerary", time: "3d" }
  ];

  return (
    <div className="w-full space-y-3">
      {/* Compact Header with Browse */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground/60">Quick Actions</h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={onBrowseTrips}
          className="h-7 text-foreground/60 hover:text-foreground hover:bg-accent gap-1.5 text-xs px-2"
        >
          <FolderOpen className="h-3.5 w-3.5" />
          {upcomingCount} upcoming · {completedCount} past
        </Button>
      </div>

      {/* 6-Column Action Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {actions.map((action, index) => (
          <Button
            key={index}
            size="sm"
            variant="outline"
            onClick={action.onClick}
            className={`h-9 flex items-center justify-center gap-1.5 text-xs font-medium border ${action.className}`}
          >
            <action.icon className="h-3.5 w-3.5" />
            {action.label}
          </Button>
        ))}
      </div>

      {/* Inline Recent Activity */}
      <div className="flex items-center gap-3 text-xs text-foreground/60 pt-1">
        <Clock className="h-3 w-3 shrink-0" />
        {recentActivities.map((activity, index) => (
          <span key={index} className="shrink-0">
            {activity.action} <span className="text-foreground/40">({activity.time})</span>
            {index < recentActivities.length - 1 && <span className="ml-3">·</span>}
          </span>
        ))}
      </div>
    </div>
  );
};
