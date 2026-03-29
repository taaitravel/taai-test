import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LOGO_URL } from "@/lib/constants";

interface PublicNavigationProps {
  showGetStarted?: boolean;
}

export const PublicNavigation = ({ showGetStarted = true }: PublicNavigationProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <nav className="bg-background/95 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Button 
            variant="ghost" 
            className="text-foreground hover:text-foreground hover:bg-accent"
            onClick={() => navigate('/')}
          >
            ← Back
          </Button>
          
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <img 
              src={LOGO_URL} 
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
                  className="gold-gradient hover:opacity-90 text-primary-foreground font-semibold"
                >
                  Dashboard
                </Button>
              ) : (
                <Button 
                  onClick={() => navigate('/signup')}
                  className="gold-gradient hover:opacity-90 text-primary-foreground font-semibold"
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
