import { Plane } from "lucide-react";

interface FlightProgressIndicatorProps {
  currentFlights: number;
  currentLevel: string;
}

export const FlightProgressIndicator = ({ currentFlights, currentLevel }: FlightProgressIndicatorProps) => {
  // Define level thresholds and next level info
  const getLevelInfo = (level: string, flights: number) => {
    switch (level) {
      case 'Wanderer':
        return { next: 'Adventurer', threshold: 10, current: flights };
      case 'Adventurer':
        return { next: 'Explorer', threshold: 25, current: flights };
      case 'Explorer':
        return { next: 'Master Traveler', threshold: 50, current: flights };
      case 'Master Traveler':
        return { next: 'Master Traveler', threshold: 50, current: flights };
      default:
        return { next: 'Adventurer', threshold: 10, current: flights };
    }
  };

  const levelInfo = getLevelInfo(currentLevel, currentFlights);
  const progress = Math.min((levelInfo.current / levelInfo.threshold) * 100, 100);
  const isMaxLevel = currentLevel === 'Master Traveler' && currentFlights >= 50;

  return (
    <div className="flex flex-col items-center space-y-3">
      {/* Plane Icon with Progress Fill */}
      <div className="relative w-16 h-16 flex items-center justify-center">
        <svg width="56" height="56" viewBox="0 0 24 24" className="relative">
          <defs>
            <linearGradient id="planeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(351, 85%, 75%)" />
              <stop offset="50%" stopColor="hsl(15, 80%, 70%)" />
              <stop offset="100%" stopColor="hsl(25, 75%, 65%)" />
            </linearGradient>
            <mask id="progressMask">
              <rect 
                width="24" 
                height={24 * (progress / 100)} 
                y={24 * (1 - progress / 100)} 
                fill="white" 
              />
            </mask>
          </defs>
          
          {/* Background plane outline */}
          <path 
            d="M2 16h2.5l3.5-4H16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H8L4.5 2H2l2 5.5L2 13z" 
            fill="none" 
            stroke="white" 
            strokeWidth="2"
          />
          
          {/* Filled plane with gradient and mask */}
          <path 
            d="M2 16h2.5l3.5-4H16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H8L4.5 2H2l2 5.5L2 13z" 
            fill="url(#planeGradient)" 
            stroke="white" 
            strokeWidth="2"
            mask="url(#progressMask)"
          />
        </svg>
      </div>

      {/* Progress Text */}
      <div className="text-center">
        <div className="text-lg font-bold text-white">
          {currentFlights} flights
        </div>
        {!isMaxLevel && (
          <div className="text-sm text-white/70">
            {levelInfo.threshold - levelInfo.current} more to {levelInfo.next}
          </div>
        )}
        {isMaxLevel && (
          <div className="text-sm text-white/70">
            Maximum level achieved!
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-[120px] bg-white/20 rounded-full h-2">
        <div 
          className="h-2 rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, hsl(351, 85%, 75%) 0%, hsl(15, 80%, 70%) 50%, hsl(25, 75%, 65%) 100%)'
          }}
        />
      </div>

      {/* Level indicator */}
      <div className="text-xs text-white/60 font-medium">
        {currentLevel}
      </div>
    </div>
  );
};