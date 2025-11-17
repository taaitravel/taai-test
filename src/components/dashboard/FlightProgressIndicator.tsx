import { Plane } from "lucide-react";
interface FlightProgressIndicatorProps {
  currentFlights: number;
  currentLevel: string;
}
export const FlightProgressIndicator = ({
  currentFlights,
  currentLevel
}: FlightProgressIndicatorProps) => {
  // Define level thresholds and next level info
  const getLevelInfo = (level: string, flights: number) => {
    switch (level) {
      case 'Wanderer':
        return {
          next: 'Adventurer',
          threshold: 10,
          current: flights
        };
      case 'Adventurer':
        return {
          next: 'Explorer',
          threshold: 25,
          current: flights
        };
      case 'Explorer':
        return {
          next: 'Master Traveler',
          threshold: 50,
          current: flights
        };
      case 'Master Traveler':
        return {
          next: 'Master Traveler',
          threshold: 50,
          current: flights
        };
      default:
        return {
          next: 'Adventurer',
          threshold: 10,
          current: flights
        };
    }
  };
  const levelInfo = getLevelInfo(currentLevel, currentFlights);
  const progress = Math.min(levelInfo.current / levelInfo.threshold * 100, 100);
  const isMaxLevel = currentLevel === 'Master Traveler' && currentFlights >= 50;
  return <div className="flex flex-col space-y-4">
      {/* Header with plane icon */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Plane className="h-5 w-5 text-white/70" />
          <span className="text-sm font-medium text-white/70">Flight Progress</span>
        </div>
        <span className="font-bold text-white text-4xl">{currentFlights}</span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="w-full bg-white/20 rounded-full h-3">
          <div className="h-3 rounded-full transition-all duration-700 ease-out" style={{
          width: `${progress}%`,
          background: 'linear-gradient(90deg, hsl(351, 85%, 75%) 0%, hsl(15, 80%, 70%) 50%, hsl(25, 75%, 65%) 100%)'
        }} />
        </div>
        
        {/* Progress labels */}
        <div className="flex justify-between text-xs text-white/60">
          <span>0</span>
          <span>{levelInfo.threshold}</span>
        </div>
      </div>

      {/* Level and Progress Info */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white">Current Level</span>
          <span className="text-sm font-bold text-white bg-white/20 px-2 py-1 rounded">
            {currentLevel}
          </span>
        </div>
        
        {!isMaxLevel && <div className="text-center">
            <div className="text-sm text-white/70">
              {levelInfo.threshold - levelInfo.current} more flights to reach <span className="font-semibold text-white">{levelInfo.next}</span>
            </div>
          </div>}
        
        {isMaxLevel && <div className="text-center">
            <div className="text-sm text-green-400 font-medium">
              ✨ Maximum level achieved!
            </div>
          </div>}
      </div>
    </div>;
};