import { useRef, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Plane } from "lucide-react";

interface HeroSectionProps {
  userProfile: any;
}

export const HeroSection = ({ userProfile }: HeroSectionProps) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const planeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (planeRef.current) {
        const rect = planeRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const deltaX = (e.clientX - centerX) * 0.1;
        const deltaY = (e.clientY - centerY) * 0.1;
        
        setMousePosition({ x: deltaX, y: deltaY });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="mb-6">
      {/* Combined Welcome and Upcoming Travel */}
      <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 rounded-2xl border border-white/30 backdrop-blur-md">
        <div className="flex items-center">
          {/* Welcome Section - 66% */}
          <div className="flex-1 pr-8" style={{ flexBasis: '66%' }}>
            <h1 className="text-2xl font-bold text-white mb-2">
              Welcome back, {userProfile?.first_name || 'Traveler'}!
            </h1>
            <p className="text-white/70">
              Ready to plan your next adventure?
            </p>
            <div className="mt-3 flex space-x-1">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
              <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
            </div>
          </div>

          {/* Upcoming Travel - 33% */}
          <div className="flex items-center justify-between" style={{ flexBasis: '33%' }}>
            <div className="text-center">
              <p className="text-sm text-white/70 mb-1">Upcoming Travel</p>
              <div className="text-3xl font-bold text-white mb-1">Aug 15</div>
              <p className="text-xs text-white/70 mb-2">Business Trip to NYC</p>
              <Badge className="bg-white/20 text-white border-white/30 text-xs">3 days away</Badge>
            </div>
            <div 
              ref={planeRef}
              className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center transition-transform duration-300 ease-out ml-4"
              style={{
                transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`
              }}
            >
              <Plane className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};