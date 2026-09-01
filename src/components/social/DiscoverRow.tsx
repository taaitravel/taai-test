import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DiscoverRow as DiscoverRowType } from '@/lib/social/mock-discover';
import { DISCOVER_PAGE_SIZE } from '@/lib/social/mock-discover';
import { REGION_GROUP_LABELS } from '@/lib/social/types';

/** Netflix-style row. Renders card projections only — no full itinerary JSON. */
export const DiscoverRow = ({ row }: { row: DiscoverRowType }) => {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(row.cards.length / DISCOVER_PAGE_SIZE));
  const visible = row.cards.slice(0, (page + 1) * DISCOVER_PAGE_SIZE);

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">{row.title}</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">{row.subtitle}</p>
        </div>
        {page + 1 < pages && (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full text-primary"
            onClick={() => setPage(p => p + 1)}
          >
            More <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1 snap-x">
        {visible.map(card => (
          <Link
            key={`${row.id}-${card.id}`}
            to={`/t/${card.publicSlug}`}
            className="snap-start shrink-0 w-[68vw] sm:w-64 rounded-2xl overflow-hidden border border-border bg-card shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="h-28 sm:h-32" style={{ background: card.coverGradient }} aria-hidden />
            <div className="p-3 space-y-1">
              <p className="text-sm font-semibold text-foreground line-clamp-1">{card.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{card.summary}</p>
              <p className="text-[11px] text-muted-foreground">
                {card.dayCount} days · {card.destinations.join(' → ')}
              </p>
              <p className="text-[11px] text-muted-foreground/80">
                {REGION_GROUP_LABELS[card.regionGroup].split(' ')[0]} · {card.cloneCount} clones
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default DiscoverRow;
