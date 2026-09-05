import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, CalendarDays, UserPlus } from 'lucide-react';
import { cloneItinerary, type CloneResult } from '@/lib/social/clone';
import type { PublicItineraryDetail } from '@/lib/social/types';
import { Link } from 'react-router-dom';
import { ACTIVE_LIMIT_MESSAGE, LIMIT_REACHED_ACTIONS } from '@/lib/social/active-slots';
import {
  MINERVA_SOCIAL_EVENT_IDS,
  buildSocialEvent,
  emitSocialEvent,
} from '@/lib/taai/minerva/social-events';

interface CloneTripDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itinerary: PublicItineraryDetail;
  /** When false the limit state is shown instead of the date step. */
  hasAvailableSlot: boolean;
}

/**
 * "Make this trip mine" — asks for dates before cloning, shifts the whole
 * sequence, and offers invitations for the NEW private copy only.
 * Synthetic preview: nothing is written while the migration is unapplied.
 */
export const CloneTripDialog = ({ open, onOpenChange, itinerary, hasAvailableSlot }: CloneTripDialogProps) => {
  const [startDate, setStartDate] = useState('');
  const [result, setResult] = useState<CloneResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClone = () => {
    setError(null);
    emitSocialEvent(
      buildSocialEvent(MINERVA_SOCIAL_EVENT_IDS.cloneDatesSelected, 'clone_flow', {
        itinerarySlug: itinerary.publicSlug,
        dayCount: itinerary.dayCount,
      })
    );
    try {
      const cloned = cloneItinerary(itinerary, { startDate });
      setResult(cloned);
      emitSocialEvent(
        buildSocialEvent(MINERVA_SOCIAL_EVENT_IDS.cloned, 'clone_flow', {
          itinerarySlug: itinerary.publicSlug,
        })
      );
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] flex flex-col gap-4 overflow-hidden">
        <DialogHeader>
          <DialogTitle>Make this trip mine</DialogTitle>
          <DialogDescription>
            Creates a new private, editable itinerary. Bookings, travelers, chats and old prices
            are never copied — availability and pricing are searched fresh.
          </DialogDescription>
        </DialogHeader>

        {!hasAvailableSlot ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
              <AlertTriangle className="h-4 w-4" /> Active trip limit reached
            </p>
            <p className="text-sm text-muted-foreground">{ACTIVE_LIMIT_MESSAGE}</p>
            <div className="flex gap-2">
              {LIMIT_REACHED_ACTIONS.map(action => (
                action.disabled ? (
                  <Button
                    key={action.id}
                    size="sm"
                    variant="default"
                    disabled
                    className="flex-1 rounded-full"
                    title="More active trips are coming soon"
                  >
                    {action.label}
                  </Button>
                ) : (
                  <Button key={action.id} asChild size="sm" variant="outline" className="flex-1 rounded-full">
                    <Link to={action.to}>{action.label}</Link>
                  </Button>
                )
              ))}
            </div>
          </div>
        ) : !result ? (
          <div className="space-y-4 overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="clone-start">When do you want to travel?</Label>
              <Input
                id="clone-start"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {itinerary.dayCount} days. Day order is preserved and every date shifts to your start.
              </p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        ) : (
          <div className="space-y-3 overflow-y-auto">
            <p className="text-sm text-foreground">
              <CalendarDays className="inline h-4 w-4 mr-1 text-primary" />
              {result.startDate} → {result.endDate} · private copy
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              {result.days.slice(0, 5).map(d => (
                <li key={d.day}>
                  Day {d.day} · {d.date} · {d.city}
                </li>
              ))}
              {result.days.length > 5 && <li>+ {result.days.length - 5} more days</li>}
            </ul>
            <p className="text-xs text-muted-foreground">{result.attribution}</p>
            <p className="text-xs text-muted-foreground">
              Not copied: {result.excluded.join(', ').replace(/_/g, ' ')}.
            </p>
            <p className="text-xs text-muted-foreground">
              Inviting friends to your new copy is coming next — the original travelers are never
              carried over.
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 rounded-full" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {hasAvailableSlot && !result && (
            <Button className="flex-1 rounded-full" disabled={!startDate} onClick={handleClone}>
              Clone with these dates
            </Button>
          )}
          {hasAvailableSlot && result && (
            <Button className="flex-1 rounded-full" disabled title="Invitations open once sharing is switched on">
              <UserPlus className="mr-2 h-4 w-4" /> Invite friends
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CloneTripDialog;
