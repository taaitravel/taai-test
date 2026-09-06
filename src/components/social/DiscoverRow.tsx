import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PublicItineraryCard } from '@/components/social/PublicItineraryCard';
import type { DiscoverRow as DiscoverRowType } from '@/lib/social/mock-discover';

/**
 * Dashboard-style Browse section.
 *
 * Card projections only — no full itinerary JSON, attendees, bookings or prices.
 * Layout: 3 columns desktop, 2 tablet, 1 mobile; equal card footprints.
 * Navigation lives in its own reserved gutter so the arrows can never be
 * clipped by, or overlap, card content.
 */
const PER_PAGE = 3;

export const DiscoverRow = ({ row }: { row: DiscoverRowType }) => {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(row.cards.length / PER_PAGE));
  const visible = row.cards.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
  const showNav = pages > 1;

  return (
    <section className="bright-card p-4 sm:p-6 space-y-5">
      <header className="space-y-1">
        <h2 className="font-display text-lg sm:text-xl font-semibold text-foreground">{row.title}</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">{row.subtitle}</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 justify-items-center">
        {visible.map(card => (
          <PublicItineraryCard key={`${row.id}-${card.id}`} card={card} size="stack" className="w-full max-w-[255px]" />
        ))}
      </div>

      {showNav && (
        <div className="flex items-center justify-center gap-5 pt-1">
          <Button
            variant="outline"
            size="icon"
            aria-label={`Previous ${row.title} trips`}
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="h-11 w-11 rounded-full disabled:opacity-40"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm font-medium text-muted-foreground min-w-[56px] text-center">
            {page + 1} / {pages}
          </span>
          <Button
            variant="outline"
            size="icon"
            aria-label={`Next ${row.title} trips`}
            onClick={() => setPage(p => Math.min(pages - 1, p + 1))}
            disabled={page + 1 >= pages}
            className="h-11 w-11 rounded-full disabled:opacity-40"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      )}
    </section>
  );
};

export default DiscoverRow;
