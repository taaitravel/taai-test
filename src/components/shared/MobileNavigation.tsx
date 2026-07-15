import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Menu, X, LogOut } from "lucide-react";
import { LOGO_URL, AUTHENTICATED_MENU_ITEMS } from "@/lib/constants";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { UserProfileDropdown } from "./UserProfileDropdown";
import { NotificationCenter } from "./NotificationCenter";
import { CartIcon } from "./CartIcon";
import { MobileActionCluster } from "./MobileActionCluster";
import { getRouteChrome } from "@/lib/chrome/route-config";
import { useChromeState } from "@/contexts/ChromeStateContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface MobileNavigationProps {
  travelerLevel?: string;
  showBackButton?: boolean;
  backPath?: string;
  backLabel?: string;
  showProfileButton?: boolean;
  showTripButtons?: boolean;
  customActions?: React.ReactNode;
}

export const MobileNavigation = ({ 
  travelerLevel = "Master Traveler",
  showBackButton = false,
  backPath = "/home",
  backLabel = "Back to Home",
  showProfileButton = true,
  showTripButtons = true,
  customActions
}: MobileNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { signOut, userProfile } = useAuth();
  const { setDrawerOpen } = useChromeState();
  const chrome = getRouteChrome(location.pathname);

  const menuItems = [...AUTHENTICATED_MENU_ITEMS];

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleMenuItemClick = (path: string) => {
    navigate(path);
    handleDrawerChange(false);
  };

  const handleDrawerChange = (open: boolean) => {
    setIsMenuOpen(open);
    setDrawerOpen(open);
  };

  return (
    <nav className="bg-background/95 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={cn(
          "grid items-center relative gap-2",
          isMobile ? "grid-cols-[96px_1fr_96px] h-14" : "grid-cols-[auto_1fr_auto] h-16"
        )}>
          {/* Left cluster */}
          <div className="flex items-center gap-2 min-w-0 justify-self-start">
            {isMobile ? (
              <Drawer open={isMenuOpen} onOpenChange={handleDrawerChange}>
                <DrawerTrigger asChild>
                  <Button 
                    variant="ghost"
                    size="icon"
                    aria-label="Open menu"
                    className="text-foreground hover:bg-accent h-10 w-10 rounded-full"
                  >
                    <Menu className="h-6 w-6" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="h-[100dvh] bg-background/95 backdrop-blur-md border-none">
                  <div className="flex flex-col h-full">
                    {/* Header with close button */}
                    <div className="flex justify-between items-center p-6 border-b border-border">
                      <img 
                        src={LOGO_URL} 
                        alt="TAAI Travel" 
                        className="h-10" 
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Close menu"
                        className="text-foreground hover:bg-accent h-10 w-10 rounded-full"
                        onClick={() => handleDrawerChange(false)}
                      >
                        <X className="h-6 w-6" />
                      </Button>
                    </div>
                    
                    {/* Menu Items */}
                    <div className="flex-1 flex flex-col justify-center gap-1 px-6 py-4 overflow-y-auto">
                      {menuItems.map((item) => (
                        <button
                          key={item.path}
                          onClick={() => handleMenuItemClick(item.path)}
                          className="text-foreground text-xl font-medium tracking-tight text-left hover:text-primary transition-colors duration-200 py-3 border-b border-border/40 last:border-b-0"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                    
                    {/* Footer with traveler level and sign out - always visible */}
                    <div
                      className="px-6 pt-4 border-t border-border space-y-3"
                      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
                    >
                      <Badge className="bg-accent text-foreground border-border text-sm px-3 py-1">
                        {travelerLevel}
                      </Badge>
                      <Button
                        onClick={handleSignOut}
                        variant="destructive"
                        size="sm"
                        className="w-full justify-start text-sm"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  </div>
                </DrawerContent>
              </Drawer>
            ) : (
              showBackButton && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate(backPath)}
                  className="text-foreground hover:bg-accent"
                >
                  {backLabel}
                </Button>
              )
            )}
            {!isMobile && (
              <Badge className="bg-accent text-foreground border-border">
                {travelerLevel}
              </Badge>
            )}
          </div>

          {/* Centered Logo (in-flow so it cannot overlap the action clusters) */}
          <div className="justify-self-center flex items-center">
            <img
              src={LOGO_URL}
              alt="TAAI Travel"
              className={isMobile ? 'h-9' : 'h-[64px]'}
            />
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-1 justify-self-end">
            {!isMobile ? (
              <>
                <CartIcon />
                {showProfileButton && <UserProfileDropdown />}
                <NotificationCenter />
                {showTripButtons && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        className="gold-gradient hover:opacity-90 text-primary-foreground font-semibold p-2 rounded-full w-10 h-10"
                        aria-label="Create trip"
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-card border-border text-card-foreground">
                      <DropdownMenuItem 
                        onClick={() => navigate('/new-itinerary')}
                        className="cursor-pointer hover:bg-accent focus:bg-accent"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        AI Trip
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => navigate('/new-manual-itinerary')}
                        className="cursor-pointer hover:bg-accent focus:bg-accent"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Manual Trip
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                {customActions}
              </>
            ) : (
              <MobileActionCluster
                primary={chrome.primary}
                overflow={chrome.overflow}
              />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};