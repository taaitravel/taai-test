import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, MapPin, Calendar, DollarSign, Users } from "lucide-react";
import { MobileNavigation } from "@/components/shared/MobileNavigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const CreateManualItinerary = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dateStart: '',
    dateEnd: '',
    locations: '',
    budget: '',
    attendeeCount: '1'
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateItinerary = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create an itinerary.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.name || !formData.dateStart || !formData.dateEnd || !formData.locations) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    // Validate dates
    const startDate = new Date(formData.dateStart);
    const endDate = new Date(formData.dateEnd);
    if (startDate >= endDate) {
      toast({
        title: "Invalid Dates",
        description: "End date must be after start date.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Convert locations string to array
      const locationsArray = formData.locations.split(',').map(loc => loc.trim()).filter(loc => loc);
      
      // Create attendees array based on count
      const attendeesArray = Array.from({ length: parseInt(formData.attendeeCount) }, (_, i) => ({
        id: i + 1,
        name: i === 0 ? `${userProfile?.first_name || 'You'}` : `Guest ${i}`,
        email: i === 0 ? userProfile?.email || '' : ''
      }));

      const { data, error } = await supabase
        .from('itinerary')
        .insert({
          userid: user.id,
          itin_name: formData.name,
          itin_desc: formData.description || null,
          itin_date_start: formData.dateStart,
          itin_date_end: formData.dateEnd,
          itin_locations: locationsArray,
          budget: formData.budget ? parseFloat(formData.budget) : null,
          user_type: userProfile?.user_type || 'individual',
          attendees: attendeesArray,
          flights: [],
          hotels: [],
          activities: [],
          reservations: []
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Itinerary Created Successfully!",
        description: "Your manual itinerary has been saved.",
        variant: "success"
      });
      
      navigate(`/itinerary?id=${data.id}`);
    } catch (error) {
      console.error('Error creating itinerary:', error);
      toast({
        title: "Creation Failed",
        description: "Failed to create itinerary. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#171821] flex flex-col">
      {/* Navigation - Mobile Responsive */}
      <MobileNavigation 
        travelerLevel="Master Traveler"
        showBackButton={true}
        backPath="/dashboard"
        backLabel="Back to Dashboard"
        showProfileButton={true}
        showTripButtons={false}
      />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5"></div>
        <Card className="w-full max-w-2xl shadow-2xl shadow-white/20 border-white/30 bg-[#171821]/95 backdrop-blur-md relative">
          <CardHeader className="text-center space-y-2">
            <div className="flex items-center justify-center">
              <img src="/lovable-uploads/1c94ff06-05c4-46fe-b015-481744bc6ce1.png" alt="TAAI Travel" className="h-[120px] w-auto" />
            </div>
            
            <div className="space-y-2">
              <CardTitle className="text-2xl text-white">Create Manual Itinerary</CardTitle>
              <CardDescription className="text-white/70">
                Plan your trip manually when the AI assistant isn't available
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Trip Name *
              </Label>
              <Input
                id="name"
                placeholder="Summer Vacation to Europe"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="bg-[#1f1f27] border-white/30 text-white placeholder:text-white/50 focus:border-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-white">Trip Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your trip plans, preferences, or special requirements..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="bg-[#1f1f27] border-white/30 text-white placeholder:text-white/50 focus:border-white min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateStart" className="text-white flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Start Date *
                </Label>
                <Input
                  id="dateStart"
                  type="date"
                  value={formData.dateStart}
                  onChange={(e) => handleInputChange('dateStart', e.target.value)}
                  className="bg-[#1f1f27] border-white/30 text-white placeholder:text-white/50 focus:border-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateEnd" className="text-white flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  End Date *
                </Label>
                <Input
                  id="dateEnd"
                  type="date"
                  value={formData.dateEnd}
                  onChange={(e) => handleInputChange('dateEnd', e.target.value)}
                  className="bg-[#1f1f27] border-white/30 text-white placeholder:text-white/50 focus:border-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="locations" className="text-white flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Destinations *
              </Label>
              <Input
                id="locations"
                placeholder="Paris, London, Rome (separate with commas)"
                value={formData.locations}
                onChange={(e) => handleInputChange('locations', e.target.value)}
                className="bg-[#1f1f27] border-white/30 text-white placeholder:text-white/50 focus:border-white"
              />
              <p className="text-xs text-white/50">Enter multiple destinations separated by commas</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget" className="text-white flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Budget (USD)
                </Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="5000"
                  value={formData.budget}
                  onChange={(e) => handleInputChange('budget', e.target.value)}
                  className="bg-[#1f1f27] border-white/30 text-white placeholder:text-white/50 focus:border-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="attendeeCount" className="text-white flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Number of Travelers
                </Label>
                <Input
                  id="attendeeCount"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.attendeeCount}
                  onChange={(e) => handleInputChange('attendeeCount', e.target.value)}
                  className="bg-[#1f1f27] border-white/30 text-white placeholder:text-white/50 focus:border-white"
                />
              </div>
            </div>

            <Separator className="bg-white/30" />

            <Button 
              className="w-full gold-gradient hover:opacity-90 text-[#171821] font-semibold"
              onClick={handleCreateItinerary}
              disabled={loading}
            >
              {loading ? "Creating Itinerary..." : "Create Itinerary"}
            </Button>

            <div className="text-center text-sm text-white/70">
              Need help planning? Try our{" "}
              <Button variant="link" className="p-0 h-auto font-normal text-white hover:text-white" onClick={() => navigate('/create-itinerary')}>
                AI Assistant
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateManualItinerary;