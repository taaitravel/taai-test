import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Compass, ChevronRight, Sparkles, Star } from 'lucide-react';
import { DISCOVER_ROWS } from '@/lib/social/mock-discover';
import { PublicItineraryStack } from '@/components/social/PublicItineraryStack';

/**
 * Dashboard entry point into Discover. Two stacked decks (taai + featured),
 * matching the Your Trips layout. Card projections only — no extra queries.
 */
export const DiscoverStrip = () => {
  const navigate = useNavigate();
  const taai = DISCOVER_ROWS.find(r => r.id === 'taai')?.cards ?? [];
  const featured = DISCOVER_ROWS.find(r => r.id === 'featured')?.cards ?? [];

  return (
    <section className="space-y-4">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bright-card p-4 sm:p-6 flex flex-col items-center">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center justify-center">
            <Sparkles className="h-5 w-5" />
            <span className="ml-2">Trips by taai</span>
            <span className="ml-2 text-xs text-muted-foreground font-normal">({taai.length})</span>
          </h3>
          <PublicItineraryStack cards={taai} />
        </div>

        <div className="bright-card p-4 sm:p-6 flex flex-col items-center">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center justify-center">
            <Star className="h-5 w-5" />
            <span className="ml-2">Featured</span>
            <span className="ml-2 text-xs text-muted-foreground font-normal">({featured.length})</span>
          </h3>
          <PublicItineraryStack cards={featured} />
        </div>
      </div>
    </section>
  );
};

export default DiscoverStrip;
