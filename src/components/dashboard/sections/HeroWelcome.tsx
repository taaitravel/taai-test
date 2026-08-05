import { Badge } from "@/components/ui/badge";
import { differenceInDays } from "date-fns";
import { AgentChip } from "@/components/agents/AgentChip";
import { formatDateOnly } from '@/lib/date-time';

interface HeroWelcomeProps {
  userProfile: any;
  nextTrip: any;
}

export const HeroWelcome = ({ userProfile, nextTrip }: HeroWelcomeProps) => {
  const daysAway = nextTrip ? differenceInDays(new Date(nextTrip.itin_date_start), new Date()) : null;

  return (
    <div className="flex-1 lg:pr-8">
      <div className="flex items-center justify-between gap-3 mb-2">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
          Welcome back, {userProfile?.first_name || 'Traveler'}!
        </h1>
        <AgentChip agent="miles" className="shrink-0" />
      </div>

      {/* Mobile next trip info */}
      <div className="lg:hidden mt-4">
        {nextTrip ? (
          <div className="text-left">
            <p className="text-sm text-muted-foreground mb-1">Upcoming Travel</p>
            <div className="text-xl font-bold text-foreground mb-1">
              {formatDateOnly(nextTrip.itin_date_start, 'MMM d')}
            </div>
            <p className="text-xs text-muted-foreground mb-2">{nextTrip.itin_name}</p>
            <Badge className="bg-muted text-foreground border-border text-xs">
              {daysAway === 1 ? '1 day away' : `${daysAway} days away`}
            </Badge>
          </div>
        ) : (
          <div className="text-left">
            <p className="text-sm text-muted-foreground mb-1">No Upcoming Trips</p>
            <div className="text-lg font-bold text-foreground mb-1">Plan One!</div>
            <p className="text-xs text-muted-foreground mb-2">Create your next adventure</p>
          </div>
        )}
      </div>
    </div>
  );
};
