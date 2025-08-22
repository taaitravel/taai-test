import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { User, Settings, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const UserProfileDropdown = () => {
  const navigate = useNavigate();
  const { signOut, userProfile } = useAuth();
  const { toast } = useToast();

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

  const handleEditProfile = () => {
    navigate("/profile-setup");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10 p-2 rounded-full transition-all duration-200 hover:scale-105"
        >
          <User className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-56 bg-[#171821]/95 backdrop-blur-md border-white/20 text-white" 
        align="end"
        sideOffset={5}
      >
        <div className="px-3 py-2">
          <p className="text-sm font-medium">
            {userProfile?.first_name || userProfile?.username || "User"}
          </p>
          <p className="text-xs text-white/60">
            {userProfile?.email}
          </p>
        </div>
        <DropdownMenuSeparator className="bg-white/20" />
        <DropdownMenuItem 
          onClick={handleEditProfile}
          className="cursor-pointer hover:bg-white/10 focus:bg-white/10 transition-colors"
        >
          <Settings className="h-4 w-4 mr-2" />
          Edit Profile
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleSignOut}
          className="cursor-pointer hover:bg-white/10 focus:bg-white/10 transition-colors text-red-300 hover:text-red-200"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};