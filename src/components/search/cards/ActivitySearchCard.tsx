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
  const travelers = activity.travelers || 2;
  const totalPrice = pricePerPerson * travelers;

  return (
    <div className="space-y-4">
      {/* Image Gallery */}
      {images.length > 0 && (
        <ImageGallery
          images={images}
          alt={activity.name}
          aspectRatio="wide"
          className="rounded-lg overflow-hidden"
        />
      )}

      {/* Activity Header */}
      <div>
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-white mb-1">{activity.name}</h3>
            <p className="text-white/70 flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {activity.location || activity.city}
            </p>
          </div>
          {activity.rating && (
            <div className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-white font-semibold">{activity.rating}</span>
            </div>
          )}
        </div>

        {/* Activity Details */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Badge className="bg-white/10 text-white/80 border-white/20 flex items-center gap-1 justify-center py-2">
            <Clock className="h-4 w-4" />
            {activity.duration || '3 hours'}
          </Badge>
          <Badge className="bg-white/10 text-white/80 border-white/20 flex items-center gap-1 justify-center py-2">
            <Users className="h-4 w-4" />
            {activity.groupSize || 'Small group'}
          </Badge>
        </div>

        {/* Category */}
        {activity.category && (
          <Badge className="bg-primary/20 text-primary border-primary/30 mb-4">
            {activity.category}
          </Badge>
        )}

        {/* Description */}
        {activity.description && (
          <p className="text-white/70 text-sm mb-4 line-clamp-3">
            {activity.description}
          </p>
        )}

        {/* Date */}
        {activity.date && (
          <div className="flex items-center gap-2 text-white/60 mb-4">
            <Calendar className="h-4 w-4" />
            {new Date(activity.date).toLocaleDateString()}
          </div>
        )}

        {/* Price */}
        <div className="bg-white/5 p-4 rounded-lg border border-white/20">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold text-white">${pricePerPerson}</p>
              <p className="text-white/60 text-sm">per person</p>
            </div>
            <div className="text-right">
              <p className="text-white/70 text-sm">Total for {travelers} people</p>
              <p className="text-2xl font-semibold text-primary">${totalPrice}</p>
            </div>
          </div>
        </div>

        {/* View Details Button */}
        <Button
          onClick={onExpand}
          variant="outline"
          className="w-full mt-4 bg-white/5 border-white/20 text-white hover:bg-white/10"
        >
          View Full Details
        </Button>
      </div>
    </div>
  );
};
