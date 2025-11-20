import { Badge } from '@/components/ui/badge';
import { ImageGallery } from '@/components/ui/image-gallery';
import { Star, MapPin, Clock, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActivitySearchCardProps {
  activity: any;
  onExpand: () => void;
}

export const ActivitySearchCard = ({ activity, onExpand }: ActivitySearchCardProps) => {
  const images = activity.images || (activity.image ? [activity.image] : []);
  const pricePerPerson = activity.price || activity.cost || 75;

  return (
    <div className="space-y-4 bg-[#1a1c2e] p-6 rounded-lg shadow-[0_4px_12px_rgba(192,192,192,0.15)]">
      {/* Image */}
      <div className="relative h-64 bg-white/5 rounded-lg mb-4 overflow-hidden">
        {images[0] ? (
          <img 
            src={images[0]} 
            alt={activity.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/40">
            No image available
          </div>
        )}
        {activity.rating && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-primary text-white">
              {activity.rating} <Star className="ml-1 h-3 w-3 fill-current" />
            </Badge>
          </div>
        )}
      </div>

      {/* Activity info */}
      <div className="space-y-3">
        <div>
          <h3 className="text-2xl font-bold text-white line-clamp-2">{activity.name}</h3>
          <p className="text-white/60 flex items-center gap-1 mt-1">
            <MapPin className="h-4 w-4" />
            {activity.location || activity.city}
          </p>
        </div>

        {/* Details */}
        <div className="flex flex-wrap gap-2">
          {activity.duration && (
            <Badge variant="outline" className="bg-white/5 border-white/20 text-white text-xs">
              <Clock className="mr-1 h-3 w-3" />
              {activity.duration}
            </Badge>
          )}
          {activity.groupSize && (
            <Badge variant="outline" className="bg-white/5 border-white/20 text-white text-xs">
              <Users className="mr-1 h-3 w-3" />
              {activity.groupSize}
            </Badge>
          )}
          {activity.category && (
            <Badge variant="outline" className="bg-white/5 border-white/20 text-white text-xs">
              {activity.category}
            </Badge>
          )}
        </div>

        {/* Price */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-white/60 text-sm">From</p>
              <p className="text-2xl font-bold" style={{ color: '#ff849c' }}>
                ${pricePerPerson}
              </p>
              <p className="text-white/50 text-xs">per person</p>
            </div>
            <Button
              onClick={onExpand}
              className="bg-gradient-to-r from-[#9b87f5] to-[#7E69AB] hover:opacity-90 text-white"
            >
              view deal
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
