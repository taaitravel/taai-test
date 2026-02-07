import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Menu, X, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { UserProfileDropdown } from "./UserProfileDropdown";
import { NotificationCenter } from "./NotificationCenter";
import { useAuth } from "@/contexts/AuthContext";

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
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { signOut, userProfile } = useAuth();

  const menuItems = [
    { label: "Home", path: "/home" },
    { label: "Itineraries", path: "/itineraries" },
    { label: "New Itinerary", path: "/new-itinerary" },
    { label: "Manual Itinerary", path: "/new-manual-itinerary" },
    { label: "Subscription", path: "/subscription" },
    { label: "Profile & Settings", path: "/profile-setup" },
  ];

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
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-background/95 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Side - Mobile Menu or Back Button */}
          <div className="flex items-center space-x-4">
            {isMobile ? (
              <Drawer open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <DrawerTrigger asChild>
                  <Button 
                    variant="ghost"
                    size="sm"
                    className="text-foreground hover:bg-accent p-2 rounded-full"
                  >
                    <Menu className="h-6 w-6" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="h-screen bg-background/95 backdrop-blur-md border-none">
                  <div className="flex flex-col h-full">
                    {/* Header with close button */}
                    <div className="flex justify-between items-center p-6 border-b border-border">
                      <img 
                        src="/lovable-uploads/1c94ff06-05c4-46fe-b015-481744bc6ce1.png" 
                        alt="TAAI Travel" 
                        className="h-12" 
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/10 p-2 rounded-full"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <X className="h-6 w-6" />
                      </Button>
                    </div>
                    
                    {/* Menu Items */}
                    <div className="flex-1 flex flex-col justify-center space-y-8 px-6">
                      {menuItems.map((item) => (
                        <button
                          key={item.path}
                          onClick={() => handleMenuItemClick(item.path)}
                          className="text-white text-2xl font-bold text-left hover:text-primary transition-colors duration-200 py-4"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                    
                    {/* Footer with traveler level and sign out */}
                    <div className="p-6 border-t border-white/10 space-y-4">
                      <Badge className="bg-white/20 text-white border-white/30 text-lg px-4 py-2">
                        {travelerLevel}
                      </Badge>
                      <Button
                        onClick={handleSignOut}
                        variant="ghost"
                        className="w-full text-white hover:bg-white/10 justify-start"
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
                  className="text-white hover:bg-white/10"
                >
                  {backLabel}
                </Button>
              )
            )}
          </div>

          {/* Centered Logo */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <img src="/lovable-uploads/1c94ff06-05c4-46fe-b015-481744bc6ce1.png" alt="TAAI Travel" className="h-[70px]" />
          </div>

          {/* Right Side - Desktop or Custom Actions */}
          <div className="flex items-center space-x-4">
            {!isMobile ? (
              <>
                <Badge className="bg-white/20 text-white border-white/30">
                  {travelerLevel}
                </Badge>
                {showTripButtons && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        className="gold-gradient hover:opacity-90 text-[#171821] font-semibold p-2 rounded-full w-10 h-10"
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#171821] border-white/30 text-white">
                      <DropdownMenuItem 
                        onClick={() => navigate('/new-itinerary')}
                        className="cursor-pointer hover:bg-white/10 focus:bg-white/10"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        AI Trip
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => navigate('/new-manual-itinerary')}
                        className="cursor-pointer hover:bg-white/10 focus:bg-white/10"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Manual Trip
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                {showProfileButton && <UserProfileDropdown />}
                <NotificationCenter />
                {customActions}
              </>
            ) : (
              customActions && <div>{customActions}</div>
            )}
          </div>

          {/* Mobile Right Space (for symmetry) */}
          {isMobile && !customActions && <div className="w-10"></div>}
        </div>
      </div>
    </nav>
  );
};