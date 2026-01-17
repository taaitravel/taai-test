import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface PublicNavigationProps {
  showGetStarted?: boolean;
}

export const PublicNavigation = ({ showGetStarted = true }: PublicNavigationProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <nav className="bg-[#171821]/95 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Button 
            variant="ghost" 
            className="text-white hover:text-white hover:bg-white/10"
            onClick={() => navigate('/')}
          >
            ← Back
          </Button>
          
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <img 
              src="/lovable-uploads/1c94ff06-05c4-46fe-b015-481744bc6ce1.png" 
              alt="TAAI Travel" 
              className="h-[70px] cursor-pointer" 
              onClick={() => navigate('/')}
            />
          </div>
          
          <div className="flex items-center space-x-4">
            {showGetStarted && (
              user ? (
                <Button 
                  onClick={() => navigate('/home')}
                  className="gold-gradient hover:opacity-90 text-[#171821] font-semibold"
                >
                  Dashboard
                </Button>
              ) : (
                <Button 
                  onClick={() => navigate('/signup')}
                  className="gold-gradient hover:opacity-90 text-[#171821] font-semibold"
                >
                  Get Started
                </Button>
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
