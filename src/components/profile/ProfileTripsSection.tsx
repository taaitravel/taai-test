import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Globe, Lock, MapPin } from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { evaluateSlots, FREE_ACTIVE_ITINERARY_LIMIT, LIMIT_REACHED_ACTIONS, ACTIVE_LIMIT_MESSAGE } from '@/lib/social/active-slots';

/**
 * Profile → Trips.
 * Reads only the lightweight dashboard summary projection (no attendees,
 * bookings, provider payloads or contact details). Every owned trip is private
 * unless the traveler has published it; publishing is not enabled yet.
 */
export const ProfileTripsSection = () => {
  const { activeItineraries, loading } = useDashboardData();

  const trips = activeItineraries ?? [];
  const slots = useMemo(() => evaluateSlots(trips.map(() => ({ lifecycle: 'active' as const }))), [trips]);

  return (
    <div className="space-y-6">
      <section className="bright-card p-4 sm:p-5 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-mono-label">Active trips</p>
            <h2 className="font-display text-lg font-semibold text-foreground">
              {slots.used} of {FREE_ACTIVE_ITINERARY_LIMIT} in use
            </h2>
          </div>
          {!slots.ok && (
            <div className="flex gap-2">
              {LIMIT_REACHED_ACTIONS.map(action => (
                action.disabled ? (
                  <Button key={action.id} size="sm" variant="default" disabled className="rounded-full" title="More active trips are coming soon">
                    {action.label}
                  </Button>
                ) : (
                  <Button key={action.id} asChild size="sm" variant="outline" className="rounded-full">
                    <Link to={action.to}>{action.label}</Link>
                  </Button>
                )
              ))}
            </div>
          )}
        </div>
        {!slots.ok && <p className="text-sm text-muted-foreground">{ACTIVE_LIMIT_MESSAGE}</p>}
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-base font-semibold text-foreground">Private trips</h3>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading your trips…</p>
        ) : trips.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No trips yet. Start one from Discover or plan a new trip.
          </p>
        ) : (
          <ul className="space-y-2">
            {trips.map(trip => (
              <li key={trip.id}>
                <Link
                  to={`/itinerary/${trip.id}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 min-h-[56px]"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-foreground">{trip.itin_name}</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {(trip.itin_locations ?? []).join(' → ') || 'No destinations yet'}
                    </span>
                  </span>
                  <Badge variant="outline" className="shrink-0 text-[10px]">Private</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-base font-semibold text-foreground">Public trips</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          You have not shared any trips publicly. Sharing opens once public profiles and review
          are switched on — until then every trip here stays private.
        </p>
      </section>
    </div>
  );
};

export default ProfileTripsSection;
