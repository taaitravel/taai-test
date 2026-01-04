import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, List, Plane, MessageCircle, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { icon: BarChart3, label: 'Analytics', path: '/dashboard' },
  { icon: List, label: 'Itineraries', path: '/my-itineraries' },
  { icon: Plane, label: 'Search', path: '/search' },
  { icon: MessageCircle, label: 'Messages', path: '/create-itinerary' },
  { icon: Settings, label: 'Settings', path: '/profile-setup' },
];

const HIDDEN_ROUTES = ['/signup', '/login', '/terms'];

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Don't render if not authenticated or on hidden routes
  if (!user || HIDDEN_ROUTES.includes(location.pathname)) {
    return null;
  }

  const handleNavClick = (path: string) => {
    navigate(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[9999] bg-[#171821] border-t border-white/20 flex md:hidden">
      <div className="flex items-center justify-around w-full h-14 px-2">
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          
          return (
            <button
              key={path}
              onClick={() => handleNavClick(path)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors duration-200",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                isActive 
                  ? "text-[#ffce87]" 
                  : "text-white/70 hover:text-white"
              )}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon 
                className={cn(
                  "h-5 w-5 mb-0.5 transition-transform duration-200",
                  isActive && "scale-110"
                )} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={cn(
                "text-[10px] font-medium transition-opacity duration-200",
                isActive ? "opacity-100" : "opacity-70"
              )}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
