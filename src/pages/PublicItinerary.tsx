import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Bookmark, CalendarDays, Copy, ListOrdered, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useBrightTheme } from '@/hooks/useBrightTheme';
import { PublicNavigation } from '@/components/shared/PublicNavigation';
import { PublicFooter } from '@/components/shared/PublicFooter';
import { CloneTripDialog } from '@/components/social/CloneTripDialog';
import { PublicItineraryCalendar } from '@/components/social/PublicItineraryCalendar';
import { getMockItineraryDetail } from '@/lib/social/mock-discover';
import type { PublicPlaceKind } from '@/lib/social/types';
import { formatMoney } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  MINERVA_SOCIAL_EVENT_IDS,
  buildSocialEvent,
  emitSocialEvent,
} from '@/lib/taai/minerva/social-events';

const KIND_LABEL: Record<PublicPlaceKind, string> = {
  stay: 'Stay',
  dining: 'Dining',
  activity: 'Activity',
  transit: 'Transit',
};

const KIND_BADGE: Record<PublicPlaceKind, string> = {
  stay: 'bg-primary/10 text-primary border-primary/20',
  dining: 'bg-rental/15 text-rental-foreground border-rental/30',
  activity: 'bg-secondary text-foreground border-border',
  transit: 'bg-muted text-muted-foreground border-border',
};

const formatDay = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    timeZone: 'UTC',
  });

/** Public itinerary view — planning structure only, no bookings or PII. */
const PublicItinerary = () => {
  useBrightTheme();
  const { slug = '' } = useParams();
  const detail = useMemo(() => getMockItineraryDetail(slug), [slug]);
  const [cloneOpen, setCloneOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [view, setView] = useState<'schedule' | 'calendar'>('schedule');

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

  const counts = (['stay', 'dining', 'activity', 'transit'] as PublicPlaceKind[]).map(kind => ({
    kind,
    count: detail.days.reduce((sum, d) => sum + d.places.filter(p => p.kind === kind).length, 0),
    total: detail.budget[kind],
  }));
  const indicativeTotal = counts.reduce((sum, c) => sum + c.total, 0);

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

        {/* Header */}
        <div className="rounded-3xl overflow-hidden border border-rental/40 bg-card shadow-sm">
          <div className="relative h-36 sm:h-48" style={{ background: detail.coverGradient }}>
            <Badge className="absolute top-3 left-3 bg-rental text-rental-foreground border-0 text-[10px] font-bold">
              Inspiration · not added to your trips
            </Badge>
            <Badge className="absolute top-3 right-3 bg-black/50 text-white/85 border-0 text-[10px]">
              {detail.curatedBy === 'taai' ? 'Trip by taai' : 'Featured itinerary'}
            </Badge>
          </div>
          <div className="p-5 space-y-3">
            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">{detail.title}</h1>
            <p className="text-sm text-muted-foreground">{detail.summary}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div>
                <p className="font-mono-label">Sample dates</p>
                <p className="text-sm text-foreground">
                  {formatDay(detail.suggestedStartDate)} – {formatDay(detail.suggestedEndDate)}
                </p>
              </div>
              <div>
                <p className="font-mono-label">Length</p>
                <p className="text-sm text-foreground">{detail.dayCount} days</p>
              </div>
              <div>
                <p className="font-mono-label">Destinations</p>
                <p className="text-sm text-foreground truncate">{detail.destinations.join(' → ')}</p>
              </div>
              <div>
                <p className="font-mono-label">Estimated spend</p>
                <p className="text-sm font-semibold text-foreground">
                  {formatMoney(indicativeTotal, detail.currency, { showCode: true })}
                </p>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Estimates are past observations for planning only. They are not quotes and do not
              indicate current availability or price — every option is searched fresh when you plan.
            </p>


            <div className="flex flex-wrap gap-1.5">
              {detail.travelStyleTags.map(tag => (
                <Badge key={tag} variant="outline" className="text-[11px]">{tag}</Badge>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {/* Visual prototype only — disabled until the transactional clone
                  function and active-trip limit are approved. */}
              <Button className="rounded-full" disabled aria-disabled="true">
                <Copy className="mr-2 h-4 w-4" /> Add to your trips
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
              Adding to your trips is previewed only in this build. Saving is a bookmark and does not
              count against your active trip limit.
            </p>
          </div>
        </div>

        {/* Summary blocks */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {counts.map(({ kind, count, total }) => (
            <div key={kind} className="bright-card p-3">
              <p className="font-mono-label">{KIND_LABEL[kind]}</p>
              <p className="font-display text-lg font-semibold text-foreground">{count}</p>
              <p className="text-[11px] text-muted-foreground">
                {total > 0 ? formatMoney(total, detail.currency) : 'No cost reference'}
              </p>
            </div>
          ))}
        </section>

        {/* View toggle */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={view === 'schedule' ? 'default' : 'outline'}
            className="rounded-full h-9 text-xs gap-1.5"
            onClick={() => setView('schedule')}
          >
            <ListOrdered className="h-3.5 w-3.5" /> Daily schedule
          </Button>
          <Button
            size="sm"
            variant={view === 'calendar' ? 'default' : 'outline'}
            className="rounded-full h-9 text-xs gap-1.5"
            onClick={() => setView('calendar')}
          >
            <CalendarDays className="h-3.5 w-3.5" /> Calendar
          </Button>
        </div>

        {view === 'calendar' ? (
          <PublicItineraryCalendar days={detail.days} />
        ) : (
          <section className="space-y-3">
            {detail.days.map(day => (
              <div key={day.day} className="rounded-2xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    Day {day.day} · {day.city}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{formatDay(day.date)}</p>
                </div>

                <ul className="space-y-2">
                  {day.places.map((place, i) => (
                    <li
                      key={`${day.day}-${i}`}
                      className="flex gap-3 rounded-xl border border-border/60 bg-background/40 p-3"
                    >
                      <p className="w-12 shrink-0 text-xs font-semibold text-foreground tabular-nums">
                        {place.time ?? '—'}
                      </p>
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="text-sm font-medium text-foreground">{place.name}</p>
                          <Badge className={cn('text-[10px] border', KIND_BADGE[place.kind])}>
                            {KIND_LABEL[place.kind]}
                          </Badge>
                          {place.area && (
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {place.area}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{place.note}</p>
                        {typeof place.priceApprox === 'number' && place.priceApprox > 0 && (
                          <p className="text-[11px] text-muted-foreground">
                            Est. {formatMoney(place.priceApprox, place.currency ?? detail.currency)} — past observation, not a quote or current availability
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}

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
