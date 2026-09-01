import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Bookmark, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBrightTheme } from '@/hooks/useBrightTheme';
import { PublicNavigation } from '@/components/shared/PublicNavigation';
import { PublicFooter } from '@/components/shared/PublicFooter';
import { CloneTripDialog } from '@/components/social/CloneTripDialog';
import { getMockItineraryDetail } from '@/lib/social/mock-discover';
import {
  MINERVA_SOCIAL_EVENT_IDS,
  buildSocialEvent,
  emitSocialEvent,
} from '@/lib/taai/minerva/social-events';

/** Public itinerary view — planning structure only, no bookings or PII. */
const PublicItinerary = () => {
  useBrightTheme();
  const { slug = '' } = useParams();
  const detail = useMemo(() => getMockItineraryDetail(slug), [slug]);
  const [cloneOpen, setCloneOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!detail) return;
    document.title = `${detail.title} | taai travel`;
    emitSocialEvent(
      buildSocialEvent(MINERVA_SOCIAL_EVENT_IDS.publicItineraryViewed, 'public_itinerary', {
        itinerarySlug: detail.publicSlug,
        dayCount: detail.dayCount,
      })
    );
  }, [detail]);

  if (!detail) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNavigation />
        <main className="mx-auto max-w-3xl px-4 pt-28 pb-24 text-center space-y-4">
          <h1 className="text-2xl font-semibold text-foreground">Itinerary not available</h1>
          <p className="text-sm text-muted-foreground">
            This trip is private or no longer shared.
          </p>
          <Button asChild className="rounded-full">
            <Link to="/discover">Back to Discover</Link>
          </Button>
        </main>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicNavigation />

      <main className="mx-auto w-full max-w-4xl px-4 pt-24 pb-24 space-y-6">
        <Link
          to="/discover"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground min-h-[44px]"
          aria-label="Back to Discover"
        >
          <ArrowLeft className="h-4 w-4" /> Discover
        </Link>

        <div className="rounded-3xl overflow-hidden border border-border bg-card shadow-sm">
          <div className="h-36 sm:h-48" style={{ background: detail.coverGradient }} aria-hidden />
          <div className="p-5 space-y-3">
            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">{detail.title}</h1>
            <p className="text-sm text-muted-foreground">{detail.summary}</p>
            <p className="text-xs text-muted-foreground">
              {detail.dayCount} days · {detail.destinations.join(' → ')} ·{' '}
              <Link to={`/p/${detail.author.slug}`} className="text-primary">
                {detail.author.displayName}
              </Link>
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button className="rounded-full" onClick={() => { setCloneOpen(true); emitSocialEvent(buildSocialEvent(MINERVA_SOCIAL_EVENT_IDS.cloneStarted, 'public_itinerary', { itinerarySlug: detail.publicSlug })); }}>
                <Copy className="mr-2 h-4 w-4" /> Make this trip mine
              </Button>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => {
                  setSaved(true);
                  emitSocialEvent(
                    buildSocialEvent(MINERVA_SOCIAL_EVENT_IDS.inspirationSaved, 'public_itinerary', {
                      itinerarySlug: detail.publicSlug,
                    })
                  );
                }}
              >
                <Bookmark className="mr-2 h-4 w-4" /> {saved ? 'Saved for later' : 'Save for later'}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Saving is a bookmark only — it does not count against your active trip limit.
            </p>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Day by day</h2>
          {detail.days.map(day => (
            <div key={day.day} className="rounded-2xl border border-border bg-card p-4 space-y-2">
              <p className="text-sm font-semibold text-foreground">
                Day {day.day} · {day.city}
              </p>
              <ul className="space-y-1">
                {day.places.map(place => (
                  <li key={place.name} className="text-xs text-muted-foreground">
                    <span className="text-foreground">{place.name}</span> — {place.note}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <p className="text-xs text-muted-foreground">{detail.attribution}</p>
      </main>

      <CloneTripDialog
        open={cloneOpen}
        onOpenChange={setCloneOpen}
        itinerary={detail}
        hasAvailableSlot
      />

      <PublicFooter />
    </div>
  );
};

export default PublicItinerary;
