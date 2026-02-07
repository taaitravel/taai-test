import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, X, Plus } from "lucide-react";

interface TripOverviewSectionProps {
  duration: number;
  budget: number;
  peopleCount: number;
  destinations: string[];
  description?: string;
  onRemoveDestination?: (destination: string) => void;
  onAddDestination?: () => void;
  isUpcoming?: boolean;
}

export const TripOverviewSection = ({ 
  duration, 
  budget, 
  peopleCount, 
  destinations, 
  description,
  onRemoveDestination,
  onAddDestination,
  isUpcoming = false
}: TripOverviewSectionProps) => {
  return (
      <Card className="bg-card/80 border-border backdrop-blur-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-foreground" />
              <span>Trip Overview</span>
            </CardTitle>
            {isUpcoming && onAddDestination && (
              <Button
                size="sm"
                onClick={onAddDestination}
                className="gold-gradient hover:opacity-90 text-background font-semibold h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Duration:</span>
              <p className="text-foreground font-medium">{duration} days</p>
            </div>
            <div>
              <span className="text-muted-foreground">Budget per person:</span>
              <p className="text-foreground font-medium">${Math.round(budget / peopleCount).toLocaleString()}</p>
            </div>
          </div>
          
          <div>
            <span className="text-muted-foreground text-sm">Destinations:</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {destinations.map((destination, index) => (
                <Badge key={index} className="bg-muted text-foreground border-border text-xs flex items-center gap-1 pr-1">
                  <span>{destination}</span>
                  {isUpcoming && onRemoveDestination && (
                    <button
                      onClick={() => onRemoveDestination(destination)}
                      className="ml-1 hover:bg-accent rounded-full p-0.5 transition-colors"
                      aria-label={`Remove ${destination}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {description && (
            <div>
              <span className="text-muted-foreground text-sm">Description:</span>
              <p className="text-foreground mt-1 text-xs">{description}</p>
            </div>
          )}
        </CardContent>
      </Card>
  );
};