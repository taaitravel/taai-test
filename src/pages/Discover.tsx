import { useEffect } from 'react';
import { useBrightTheme } from '@/hooks/useBrightTheme';
import { PublicNavigation } from '@/components/shared/PublicNavigation';
import { PublicFooter } from '@/components/shared/PublicFooter';
import { DiscoverRow } from '@/components/social/DiscoverRow';
import { DISCOVER_ROWS } from '@/lib/social/mock-discover';
import { MINERVA_SOCIAL_EVENT_IDS, buildSocialEvent, emitSocialEvent } from '@/lib/taai/minerva/social-events';
import { Badge } from '@/components/ui/badge';

/**
 * Discover — synthetic fixtures only (Phase 2 mock).
 * Loads lightweight card projections; never full itinerary JSON, attendees,
 * chats, bookings or provider payloads.
 */
const Discover = () => {
  useBrightTheme();

  useEffect(() => {
    document.title = 'Discover trips | taai travel';
  }, []);

  useEffect(() => {
    emitSocialEvent(
      buildSocialEvent(MINERVA_SOCIAL_EVENT_IDS.publicItineraryViewed, 'discover', {})
    );
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <PublicNavigation />

      <main className="mx-auto w-full max-w-6xl px-4 pt-24 pb-24 space-y-10">
        <header className="space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-xs uppercase tracking-[0.2em] text-primary">Discover</p>
            <Badge variant="outline">Preview itineraries</Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-foreground">
            Trip inspiration you can make your own
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Save anything for later, or clone a trip into your own private, editable itinerary.
            Prices and availability are always searched fresh. These preview itineraries are
            synthetic and authored by fictional creators.
          </p>
        </header>

        {DISCOVER_ROWS.map(row => (
          <DiscoverRow key={row.id} row={row} />
        ))}
      </main>

      <PublicFooter />
    </div>
  );
};

export default Discover;
