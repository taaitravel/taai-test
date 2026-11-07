import { Button } from "@/components/ui/button";
import { Plus, Plane, Hotel, Car, Activity, Package, UtensilsCrossed } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DASHBOARD_QUICK_ACTIONS } from "@/lib/dashboard/quick-actions";

interface TravelHubProps {
  counts: {
    active: number;
    upcoming: number;
    completed: number;
  };
}

const ICONS = {
  'New Itinerary': Plus,
  Properties: Hotel,
  Flights: Plane,
  Activities: Activity,
  Cars: Car,
  Packages: Package,
  Dining: UtensilsCrossed,
} as const;

export const TravelHub = ({ counts }: TravelHubProps) => {
  const navigate = useNavigate();

  return (
    <div className="w-full space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-mono-label">Quick Actions</h3>
        <p className="text-xs text-muted-foreground">
          {counts.active} in progress · {counts.upcoming} upcoming · {counts.completed} past
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {DASHBOARD_QUICK_ACTIONS.map((action) => {
          const Icon = ICONS[action.label];
          const primary = action.label === 'New Itinerary';
          return (
            <Button
              key={action.to}
              size="sm"
              variant="outline"
              onClick={() => navigate(action.to)}
              className={`h-10 rounded-full px-4 flex items-center justify-center gap-1.5 text-xs font-medium whitespace-nowrap ${primary ? 'bright-btn-grad' : 'bright-btn-ghost'}`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {action.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
};
