import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, UserPen, Compass, Settings, CreditCard, HelpCircle, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const UserProfileDropdown = () => {
  const navigate = useNavigate();
  const { signOut, userProfile } = useAuth();
  const { toast } = useToast();

  const avatarUrl = (userProfile as any)?.avatar_url;

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "There was a problem signing you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost"
          size="sm"
          className="text-foreground hover:bg-accent p-1 rounded-full transition-all duration-200 hover:scale-105"
        >
          <Avatar className="h-8 w-8">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt="Profile" /> : null}
            <AvatarFallback className="bg-muted text-muted-foreground text-xs">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-56 bg-card/95 backdrop-blur-md border-border text-card-foreground" 
        align="end"
        sideOffset={5}
      >
        <div className="px-3 py-2">
          <p className="text-sm font-medium">
            {userProfile?.first_name || userProfile?.username || "User"}
          </p>
          <p className="text-xs text-muted-foreground">
            {userProfile?.email}
          </p>
        </div>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem 
          onClick={() => navigate("/profile?tab=edit")}
          className="cursor-pointer hover:bg-accent focus:bg-accent transition-colors"
        >
          <UserPen className="h-4 w-4 mr-2" />
          Edit Profile
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => navigate("/profile-setup")}
          className="cursor-pointer hover:bg-accent focus:bg-accent transition-colors"
        >
          <Compass className="h-4 w-4 mr-2" />
          Profile Setup
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => navigate("/profile?tab=preferences")}
          className="cursor-pointer hover:bg-accent focus:bg-accent transition-colors"
        >
          <Settings className="h-4 w-4 mr-2" />
          Preferences
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => navigate("/subscription")}
          className="cursor-pointer hover:bg-accent focus:bg-accent transition-colors"
        >
          <CreditCard className="h-4 w-4 mr-2" />
          Subscription & Payment
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => navigate("/contact")}
          className="cursor-pointer hover:bg-accent focus:bg-accent transition-colors"
        >
          <HelpCircle className="h-4 w-4 mr-2" />
          Help
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem 
          onClick={handleSignOut}
          className="cursor-pointer hover:bg-accent focus:bg-accent transition-colors text-destructive hover:text-destructive"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
