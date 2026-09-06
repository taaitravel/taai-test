import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Calendar, Copy, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ItineraryCardProjection } from '@/lib/social/types';

interface PublicItineraryCardProps {
  card: ItineraryCardProjection;
  /** 'stack' matches the fixed deck size, 'responsive' matches the owned grid card. */
  size?: 'responsive' | 'stack';
  className?: string;
}

/**
 * Public / not-yet-yours itinerary card.
 *
 * Deliberately skinned like a SEARCH result (dark panel + gold accents) rather
 * than an owned itinerary card (coral/navy trip surface), so travelers can tell
 * at a glance that this is inspiration they have not added yet. Footprint and
 * radius match the established card dimensions.
 */
export const PublicItineraryCard = ({ card, size = 'responsive', className }: PublicItineraryCardProps) => {
  const isStack = size === 'stack';
  const cardSize = isStack
    ? 'w-[255px] h-[375px]'
    : 'w-[165px] h-[243px] sm:w-[191px] sm:h-[281px] lg:w-[255px] lg:h-[375px]';

  return (
    <Link
      to={`/t/${card.publicSlug}`}
      aria-label={`${card.title} — public itinerary`}
      className={cn(
        cardSize,
        'group shrink-0 flex flex-col overflow-hidden rounded-lg border border-rental/40 bg-[#1a1c2e]',
        'shadow-sm hover:shadow-lg hover:shadow-rental/10 transition-all duration-300',
        className
      )}
    >
      {/* Cover — 50% of the card */}
      <div className="relative h-1/2 w-full overflow-hidden" style={{ background: card.coverGradient }}>
        {card.coverImageUrl && (
          <img
            src={card.coverImageUrl}
            alt={`${card.title} cover`}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1c2e] via-[#1a1c2e]/20 to-transparent" aria-hidden />
        <Badge className="absolute top-2 left-2 bg-black/55 text-white/90 border-0 text-[10px] font-semibold px-1.5 py-0.5 max-w-[55%] truncate">
          @{card.author.slug}
        </Badge>
        <Badge className="absolute top-2 right-2 bg-rental text-rental-foreground border-0 text-[10px] font-bold px-1.5 py-0.5">
          {card.curatedBy === 'taai' ? 'taai' : 'creator'}
        </Badge>
        <div className="absolute bottom-2 left-2 right-2">
          <p className="text-white/90 text-[10px] sm:text-xs flex items-center gap-1 truncate">
            <MapPin className="h-3 w-3 shrink-0" />
            {card.destinations.join(' → ')}
          </p>
        </div>
      </div>


      {/* Content — 50% of the card */}
      <div className="h-1/2 p-2 sm:p-3 lg:p-4 flex flex-col justify-between">
        <div className="min-w-0">
          <h4 className="font-bold text-white text-sm sm:text-base leading-tight line-clamp-2">{card.title}</h4>
          <p className="text-white/60 text-[10px] sm:text-xs mt-1 line-clamp-2">{card.summary}</p>
        </div>

        <div className="space-y-1.5">
          <div className="flex flex-wrap gap-1">
            <Badge className="text-[10px] sm:text-xs bg-rental/10 text-rental border border-rental/20 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {card.dayCount} days
            </Badge>
            <Badge className="text-[10px] sm:text-xs bg-white/5 text-white/50 border border-white/10 flex items-center gap-1">
              <Copy className="h-3 w-3" />
              {card.cloneCount}
            </Badge>
          </div>
          <p className="text-white/40 text-[10px] sm:text-xs truncate">
            Add to your trips · {card.author.displayName}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default PublicItineraryCard;
