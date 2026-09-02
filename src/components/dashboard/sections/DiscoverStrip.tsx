import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Compass, ChevronRight } from 'lucide-react';
import { DISCOVER_ROWS } from '@/lib/social/mock-discover';
import { PublicItineraryCard } from '@/components/social/PublicItineraryCard';

/**
 * Dashboard entry point into Discover. Renders card projections only —
 * no extra queries and no itinerary payloads.
 */
export const DiscoverStrip = () => {
  const navigate = useNavigate();
  const previews = DISCOVER_ROWS.flatMap(row => row.cards).slice(0, 4);

  return (
    <section className="bright-card p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono-label">Discover</p>
          <h3 className="font-display text-base sm:text-xl font-semibold text-foreground leading-tight">
            Trips you can make your own
          </h3>
          <p className="text-[11px] sm:text-sm text-muted-foreground">
            Curated by taai and featured travelers — clone one into an editable trip.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => navigate('/discover')}
          className="bright-btn-grad rounded-full h-9 px-4 text-xs shrink-0 gap-1"
        >
          <Compass className="h-3.5 w-3.5" />
          Browse
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1 snap-x">
        {previews.map(card => (
          <PublicItineraryCard key={card.id} card={card} className="snap-start" />
        ))}
      </div>
    </section>
  );
};

export default DiscoverStrip;
