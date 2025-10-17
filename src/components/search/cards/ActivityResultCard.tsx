import { MapPin, Clock, Star, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ActivityResultCardProps {
  activity: any;
}

export const ActivityResultCard = ({ activity }: ActivityResultCardProps) => {
  return (
    <div className="p-6">
      {/* Image */}
      <div className="relative h-64 bg-white/5 rounded-lg mb-4 overflow-hidden">
        {activity.images?.[0] ? (
          <img 
            src={activity.images[0]} 
            alt={activity.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/40">
            No image available
          </div>
        )}
        <div className="absolute top-4 right-4">
          <Badge className="bg-primary text-white">
            {activity.rating || 4.7} <Star className="ml-1 h-3 w-3 fill-current" />
          </Badge>
        </div>
      </div>

      {/* Activity info */}
      <div className="space-y-3">
        <div>
          <h3 className="text-2xl font-bold text-white">{activity.name}</h3>
          <p className="text-white/60 flex items-center gap-1 mt-1">
            <MapPin className="h-4 w-4" />
            {activity.location || activity.address}
          </p>
        </div>

        {/* Details */}
        <div className="flex flex-wrap gap-3 text-sm">
          {activity.duration && (
            <div className="flex items-center gap-1 text-white/70">
              <Clock className="h-4 w-4" />
              {activity.duration}
            </div>
          )}
          {activity.groupSize && (
            <div className="flex items-center gap-1 text-white/70">
              <Users className="h-4 w-4" />
              Max {activity.groupSize} people
            </div>
          )}
        </div>

        {/* Category badges */}
        <div className="flex flex-wrap gap-2">
          {activity.category && (
            <Badge variant="outline" className="bg-white/5 border-white/20 text-white">
              {activity.category}
            </Badge>
          )}
          {activity.type && (
            <Badge variant="outline" className="bg-white/5 border-white/20 text-white">
              {activity.type}
            </Badge>
          )}
        </div>

        {/* Description */}
        {activity.description && (
          <p className="text-white/70 text-sm line-clamp-3">{activity.description}</p>
        )}

        {/* Price */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-white/60 text-sm">From</p>
              <p className="text-3xl font-bold text-white">
                ${activity.price || activity.cost || '75'}
              </p>
              <p className="text-white/60 text-xs">per person</p>
            </div>
            {activity.availability && (
              <Badge variant="outline" className="bg-green-500/20 border-green-500/50 text-green-500">
                {activity.availability}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
