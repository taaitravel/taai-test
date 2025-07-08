import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Plane } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";

interface HeroSectionProps {
  userProfile: any;
  activeItineraries?: any[];
}

export const HeroSection = ({ userProfile, activeItineraries = [] }: HeroSectionProps) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();
  const planeRef = useRef<HTMLDivElement>(null);

  // Calculate next upcoming trip
  const getNextTrip = () => {
    const today = new Date();
    const upcomingTrips = activeItineraries
      .filter(trip => trip.itin_date_start && new Date(trip.itin_date_start) > today)
      .sort((a, b) => new Date(a.itin_date_start).getTime() - new Date(b.itin_date_start).getTime());
    
    return upcomingTrips[0] || null;
  };

  const nextTrip = getNextTrip();
  const daysAway = nextTrip ? differenceInDays(new Date(nextTrip.itin_date_start), new Date()) : null;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (planeRef.current) {
        const rect = planeRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Much more subtle mouse tracking
        const deltaX = (e.clientX - centerX) * 0.02;
        const deltaY = (e.clientY - centerY) * 0.02;
        
        setMousePosition({ x: deltaX, y: deltaY });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handlePlaneTripClick = () => {
    // Navigate to create itinerary with pre-filled "surprise me" message
    navigate('/create-itinerary', { state: { prefilledMessage: 'surprise me' } });
  };

  return (
    <div className="mb-6">
      {/* Combined Welcome and Upcoming Travel */}
      <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent p-4 sm:p-6 rounded-2xl border border-white/30 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-0">
          {/* Welcome Section */}
          <div className="flex-1 lg:pr-8">
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Welcome back, {userProfile?.first_name || 'Traveler'}!
            </h1>
          </div>

          {/* Upcoming Travel */}
          <div className="flex items-center justify-center lg:justify-center lg:flex-col lg:text-center gap-4" style={{ flexBasis: '33%' }}>
            {nextTrip ? (
              <div className="text-left lg:text-center">
                <p className="text-sm text-white/70 mb-1">Upcoming Travel</p>
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                  {format(new Date(nextTrip.itin_date_start), 'MMM d')}
                </div>
                <p className="text-xs text-white/70 mb-2">{nextTrip.itin_name}</p>
                <div className="lg:hidden">
                  <Badge className="bg-white/20 text-white border-white/30 text-xs">
                    {daysAway === 1 ? '1 day away' : `${daysAway} days away`}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="text-left lg:text-center">
                <p className="text-sm text-white/70 mb-1">No Upcoming Trips</p>
                <div className="text-lg sm:text-xl font-bold text-white mb-1">Plan One!</div>
                <p className="text-xs text-white/70 mb-2">Create your next adventure</p>
              </div>
            )}
            <div 
              ref={planeRef}
              onClick={handlePlaneTripClick}
              className="w-20 h-20 lg:w-36 lg:h-36 gold-gradient-flowing rounded-full flex items-center justify-center transition-all duration-300 ease-out cursor-pointer hover:scale-110 animate-pulse"
              style={{
                transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
                animationDuration: '3s'
              }}
              title="Surprise me with a new trip!"
            >
              <Plane className="h-10 w-10 lg:h-16 lg:w-16 text-[#171821]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};