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
    <div className="space-y-4 bg-[#1a1c2e] p-6 rounded-lg shadow-[0_4px_12px_rgba(192,192,192,0.15)] h-full flex flex-col">
      {/* Image */}
      <div className="relative h-48 bg-white/5 rounded-lg overflow-hidden">
        {images[0] ? (
          <img 
            src={images[0]} 
            alt={activity.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/40 text-sm">
            No image
          </div>
        )}
        {activity.rating && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-primary text-white text-xs">
              {activity.rating} <Star className="ml-1 h-3 w-3 fill-current" />
            </Badge>
          </div>
        )}
      </div>

      {/* Activity info */}
      <div className="flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h3 className="text-lg font-bold text-white line-clamp-2">{activity.name}</h3>
          <p className="text-white/50 flex items-center gap-1 text-sm mt-1">
            <MapPin className="h-3.5 w-3.5" />
            {activity.location || activity.city}
          </p>
        </div>

        {/* Price */}
        <div className="pt-3 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold" style={{ color: '#ff849c' }}>
                ${pricePerPerson}
              </p>
            </div>
            <Button
              onClick={onExpand}
              className="bg-gradient-to-r from-[#9b87f5] to-[#7E69AB] hover:opacity-90 text-white text-sm"
            >
              view deal
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
