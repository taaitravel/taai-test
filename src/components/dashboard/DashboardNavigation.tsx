import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DashboardNavigationProps {
  travelerLevel: string;
}

export const DashboardNavigation = ({ travelerLevel }: DashboardNavigationProps) => {
  const navigate = useNavigate();

  return (
    <nav className="bg-[#171821]/95 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
          </div>
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <img src="/lovable-uploads/1c94ff06-05c4-46fe-b015-481744bc6ce1.png" alt="TAAI Travel" className="h-[70px]" />
          </div>
          <div className="flex items-center space-x-4">
            <Badge className="bg-white/20 text-white border-white/30">
              {travelerLevel}
            </Badge>
            <Button 
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 p-2 rounded-full"
              onClick={() => navigate('/profile-setup')}
            >
              <User className="h-5 w-5" />
            </Button>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={() => navigate('/create-itinerary')}
                className="gold-gradient hover:opacity-90 text-[#171821] font-semibold"
              >
                <Plus className="h-4 w-4 mr-2" />
                AI Trip
              </Button>
              <Button 
                onClick={() => navigate('/create-manual-itinerary')}
                className="bg-[#1f1f27] border-white/30 text-white hover:bg-white/10 border"
              >
                <Plus className="h-4 w-4 mr-2" />
                Manual
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};