import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Briefcase, Search, Sparkles, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { icon: Home, label: 'Home', path: '/home' },
  { icon: Briefcase, label: 'Itineraries', path: '/itineraries' },
  { icon: Search, label: 'Search', path: '/search' },
  { icon: Sparkles, label: 'New Itinerary', path: '/new-itinerary' },
  { icon: User, label: 'Profile', path: '/profile' },
];

const HIDDEN_ROUTES = ['/signup', '/login', '/terms', '/'];

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
    <div className="fixed bottom-4 left-4 right-4 z-[9999] flex md:hidden justify-center">
      <nav className="bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg shadow-black/10 flex items-center justify-around w-full max-w-md h-[60px] px-1">
        {NAV_ITEMS.map(({ icon: Icon, label, path }, index) => {
          const isActive = location.pathname === path;
          const isCenterAction = index === Math.floor(NAV_ITEMS.length / 2);
          
          if (isCenterAction) {
            return (
              <button
                key={path}
                onClick={() => handleNavClick(path)}
                className={cn(
                  "flex items-center justify-center -mt-6 w-12 h-12 rounded-full shadow-md transition-all duration-300",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                  isActive
                    ? "gold-gradient text-primary-foreground scale-110"
                    : "bg-primary text-primary-foreground hover:scale-105"
                )}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-5 w-5" strokeWidth={2.5} />
              </button>
            );
          }

          return (
            <button
              key={path}
              onClick={() => handleNavClick(path)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
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
                isActive ? "opacity-100 font-semibold" : "opacity-70"
              )}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
