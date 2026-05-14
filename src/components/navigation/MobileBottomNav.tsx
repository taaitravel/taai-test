import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Briefcase, Search, Sparkles, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import taaiTMark from '@/assets/taai-t-mark.png';

const NAV_ITEMS = [
  { icon: Home, label: 'Home', path: '/home' },
  { icon: Briefcase, label: 'Itineraries', path: '/itineraries' },
  { icon: Search, label: 'Search', path: '/search' },
  { icon: Sparkles, label: 'New Trip', path: '/new-itinerary' },
  { icon: User, label: 'Profile', path: '/profile' },
];

const HIDDEN_ROUTES = ['/signup', '/login', '/terms', '/'];
const IDLE_MS = 4500;

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const timerRef = useRef<number | null>(null);

  const hidden = !user || HIDDEN_ROUTES.includes(location.pathname);

  // Idle-timer manager
  useEffect(() => {
    if (hidden) return;

    const resetTimer = () => {
      setCollapsed(false);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setCollapsed(true), IDLE_MS);
    };

    resetTimer();
    const events: (keyof WindowEventMap)[] = ['pointerdown', 'touchstart', 'keydown'];
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [hidden, location.pathname]);

  if (hidden) return null;

  const activeItem = NAV_ITEMS.find((i) => i.path === location.pathname);

  const handleNavClick = (path: string) => {
    navigate(path);
  };

  return (
    <div
      className="fixed left-0 right-0 z-[9999] flex md:hidden justify-center px-4"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
    >
      <nav
        aria-label="Primary"
        className={cn(
          'relative bg-card/80 backdrop-blur-2xl border border-border/40 shadow-lg shadow-black/10',
          'transition-[width,height,border-radius,padding] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
          'overflow-hidden flex items-center',
          collapsed
            ? 'w-14 h-14 rounded-full justify-center px-0'
            : 'w-full max-w-md h-[64px] rounded-2xl justify-around px-1'
        )}
      >
        {/* Iridescent sheen — only when collapsed */}
        <span
          aria-hidden
          className={cn(
            'glass-orb-sheen transition-opacity duration-300',
            collapsed ? 'opacity-100' : 'opacity-0'
          )}
        />

        {/* Collapsed orb button */}
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          aria-label="Open navigation"
          aria-expanded={!collapsed}
          className={cn(
            'absolute inset-0 flex items-center justify-center rounded-full',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
            'transition-opacity duration-200',
            collapsed ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          )}
        >
          <img
            src={taaiTMark}
            alt=""
            aria-hidden
            className="h-7 w-7 object-contain drop-shadow-sm"
          />
        </button>

        {/* Expanded pill */}
        <div
          className={cn(
            'flex items-center justify-around w-full h-full transition-opacity duration-200',
            collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto delay-150'
          )}
        >
          {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => handleNavClick(path)}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full py-1.5 px-0.5 min-w-0',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  className={cn('h-5 w-5 mb-1 shrink-0 transition-transform duration-200', isActive && 'scale-110')}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span
                  className={cn(
                    'text-[10px] leading-tight font-medium whitespace-nowrap',
                    isActive ? 'opacity-100 font-semibold' : 'opacity-70'
                  )}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
