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
    <div className="grid grid-cols-2 gap-8 mb-8">
      {/* Dynamic Welcome Bubble */}
      <div className="relative">
        <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent p-8 rounded-3xl border border-white/30 h-64 flex flex-col justify-center backdrop-blur-md">
          <h1 className="text-4xl font-bold text-white mb-4 animate-fade-in">
            Welcome back, {userProfile?.first_name || 'Traveler'}! ✈️
          </h1>
          <p className="text-xl text-white/70 animate-fade-in">
            Ready to plan your next adventure?
          </p>
          <div className="mt-4 flex space-x-2">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-white/60 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
            <div className="w-3 h-3 bg-white/30 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
          </div>
        </div>
      </div>

      {/* Upcoming Travel */}
      <div className="relative">
        <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent p-8 rounded-3xl border border-white/30 h-64 flex flex-col justify-center backdrop-blur-md">
          <p className="text-lg text-white/70 mb-4">Upcoming Travel</p>
          <div className="flex items-center justify-between">
            <div className="text-6xl font-bold text-white mb-2">
              Aug 15
            </div>
            <div 
              ref={planeRef}
              className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center transition-transform duration-300 ease-out"
              style={{
                transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`
              }}
            >
              <Plane className="h-8 w-8 text-white" />
            </div>
          </div>
          <p className="text-lg text-white/70">Business Trip to NYC</p>
          <div className="mt-4">
            <Badge className="bg-white/20 text-white border-white/30">3 days away</Badge>
          </div>
        </div>
      </div>
    </div>
  );
};