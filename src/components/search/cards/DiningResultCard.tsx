import { Badge } from '@/components/ui/badge';
import { Star, MapPin, ExternalLink, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DiningResultCardProps {
  restaurant: any;
}

export const DiningResultCard = ({ restaurant }: DiningResultCardProps) => {
  if (!restaurant || typeof restaurant !== 'object') return null;

  const image = restaurant.image || '';
  const priceLevel = restaurant.priceLevel || '';
  const categories = restaurant.categories || [];

  return (
    <div className="w-[270px] h-[385px] flex flex-col overflow-hidden rounded-lg border border-white/20 bg-[#1a1c2e] pb-[20px] hover:shadow-lg hover:shadow-gray-500/10 transition-all duration-300">
      {/* Image */}
      {image ? (
        <div className="h-28 flex-shrink-0 overflow-hidden">
          <img src={image} alt={restaurant.name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="h-28 flex-shrink-0 bg-white/5 flex items-center justify-center">
          <UtensilsCrossed className="h-10 w-10 text-white/20" />
        </div>
      )}

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xl opacity-60">🍽️</div>
            <Badge variant="secondary" className="text-xs bg-white/5 text-white/40 border-white/10">
              {priceLevel || 'Dining'}
            </Badge>
          </div>
          <h4 className="font-bold text-white text-sm mb-1 line-clamp-1">
            {restaurant.name}
          </h4>
          {categories.length > 0 && (
            <p className="text-white/60 text-xs mb-1 line-clamp-1">
              {categories.join(' · ')}
            </p>
          )}
          <div className="flex items-center gap-1 text-xs text-white/50 mb-2">
            <MapPin className="h-3 w-3" />
            <span className="line-clamp-1">{restaurant.address || 'Address unavailable'}</span>
          </div>
          {restaurant.rating && (
            <Badge className="text-xs bg-white/10 text-white/60 border-white/20 flex items-center gap-1 w-fit">
              <Star className="h-3 w-3 fill-current" />
              {restaurant.rating} {restaurant.reviewCount ? `(${restaurant.reviewCount})` : ''}
            </Badge>
          )}
        </div>

        {/* Reservation Links */}
        <div className="space-y-1.5 pt-2 border-t border-white/10">
          {restaurant.openTableUrl && (
            <a href={restaurant.openTableUrl} target="_blank" rel="noopener noreferrer" className="block">
              <Button size="sm" className="w-full h-7 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-xs text-white">
                <ExternalLink className="mr-1 h-3 w-3" />
                Reserve on OpenTable
              </Button>
            </a>
          )}
          {restaurant.resyUrl && (
            <a href={restaurant.resyUrl} target="_blank" rel="noopener noreferrer" className="block">
              <Button size="sm" variant="outline" className="w-full h-7 border-white/20 text-white/70 hover:bg-white/10 text-xs">
                <ExternalLink className="mr-1 h-3 w-3" />
                Reserve on Resy
              </Button>
            </a>
          )}
          {restaurant.googleMapsUrl && (
            <a href={restaurant.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="block">
              <Button size="sm" variant="ghost" className="w-full h-7 text-white/50 hover:text-white/70 text-xs">
                <MapPin className="mr-1 h-3 w-3" />
                View on Google Maps
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
