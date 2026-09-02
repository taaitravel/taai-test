import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PublicItineraryCard } from '@/components/social/PublicItineraryCard';
import type { DiscoverRow as DiscoverRowType } from '@/lib/social/mock-discover';
import { DISCOVER_PAGE_SIZE } from '@/lib/social/mock-discover';

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
          <PublicItineraryCard key={`${row.id}-${card.id}`} card={card} className="snap-start" />
        ))}
      </div>
    </section>
  );
};

export default DiscoverRow;
