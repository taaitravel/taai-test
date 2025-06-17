
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plane, Users, MapPin, Calendar, ArrowRight, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ProfileSetup = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userType, formData } = location.state || {};
  
  const [currentStep, setCurrentStep] = useState(1);
  const [profileData, setProfileData] = useState({
    lastName: '',
    address: '',
    nationality: '',
    birthday: '',
    flightFrequency: '',
    preferredAirlines: '',
    preferredHotels: '',
    countriesVisited: 0,
    loyaltyPrograms: ''
  });

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  const handleInputChange = (field: string, value: string | number) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      toast({
        title: "Profile Setup Complete!",
        description: "Welcome to TAAI Travel. Let's start planning your first trip.",
      });
      navigate('/dashboard');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/signup', { state: { userType } });
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-yellow-200 mb-2">Personal Information</h3>
              <p className="text-yellow-300/70">Let's complete your basic profile</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-yellow-300">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Smith"
                value={profileData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className="bg-[#2d2a1f] border-yellow-500/30 text-yellow-200 placeholder:text-yellow-300/50 focus:border-yellow-400"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address" className="text-yellow-300">Address</Label>
              <Input
                id="address"
                placeholder="123 Main St, City, State 12345"
                value={profileData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="bg-[#2d2a1f] border-yellow-500/30 text-yellow-200 placeholder:text-yellow-300/50 focus:border-yellow-400"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nationality" className="text-yellow-300">Nationality</Label>
                <Input
                  id="nationality"
                  placeholder="United States"
                  value={profileData.nationality}
                  onChange={(e) => handleInputChange('nationality', e.target.value)}
                  className="bg-[#2d2a1f] border-yellow-500/30 text-yellow-200 placeholder:text-yellow-300/50 focus:border-yellow-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthday" className="text-yellow-300">Birthday</Label>
                <Input
                  id="birthday"
                  type="date"
                  value={profileData.birthday}
                  onChange={(e) => handleInputChange('birthday', e.target.value)}
                  className="bg-[#2d2a1f] border-yellow-500/30 text-yellow-200 placeholder:text-yellow-300/50 focus:border-yellow-400"
                />
              </div>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Plane className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-yellow-200 mb-2">Travel Preferences</h3>
              <p className="text-yellow-300/70">Help us understand your travel style</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="flightFrequency" className="text-yellow-300">How often do you fly per year?</Label>
              <select 
                className="w-full p-2 bg-[#2d2a1f] border border-yellow-500/30 text-yellow-200 rounded-md focus:border-yellow-400"
                value={profileData.flightFrequency}
                onChange={(e) => handleInputChange('flightFrequency', e.target.value)}
              >
                <option value="">Select frequency</option>
                <option value="0-5">0-5 flights (Occasional Traveler)</option>
                <option value="5-20">5-20 flights (Frequent Traveler)</option>
                <option value="20+">20+ flights (Road Warrior)</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="countriesVisited" className="text-yellow-300">Countries Visited</Label>
              <Input
                id="countriesVisited"
                type="number"
                placeholder="15"
                value={profileData.countriesVisited}
                onChange={(e) => handleInputChange('countriesVisited', parseInt(e.target.value) || 0)}
                className="bg-[#2d2a1f] border-yellow-500/30 text-yellow-200 placeholder:text-yellow-300/50 focus:border-yellow-400"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="preferredAirlines" className="text-yellow-300">Preferred Airlines (comma separated)</Label>
              <Input
                id="preferredAirlines"
                placeholder="Delta, American Airlines, United"
                value={profileData.preferredAirlines}
                onChange={(e) => handleInputChange('preferredAirlines', e.target.value)}
                className="bg-[#2d2a1f] border-yellow-500/30 text-yellow-200 placeholder:text-yellow-300/50 focus:border-yellow-400"
              />
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <MapPin className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-yellow-200 mb-2">Loyalty & Preferences</h3>
              <p className="text-yellow-300/70">Almost done! Final details for personalization</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="preferredHotels" className="text-yellow-300">Preferred Hotel Brands (comma separated)</Label>
              <Input
                id="preferredHotels"
                placeholder="Marriott, Hilton, Hyatt"
                value={profileData.preferredHotels}
                onChange={(e) => handleInputChange('preferredHotels', e.target.value)}
                className="bg-[#2d2a1f] border-yellow-500/30 text-yellow-200 placeholder:text-yellow-300/50 focus:border-yellow-400"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="loyaltyPrograms" className="text-yellow-300">Loyalty Program Numbers (optional)</Label>
              <Input
                id="loyaltyPrograms"
                placeholder="Delta SkyMiles: 123456789"
                value={profileData.loyaltyPrograms}
                onChange={(e) => handleInputChange('loyaltyPrograms', e.target.value)}
                className="bg-[#2d2a1f] border-yellow-500/30 text-yellow-200 placeholder:text-yellow-300/50 focus:border-yellow-400"
              />
            </div>
            
            {/* Travel Profile Summary */}
            <div className="bg-[#2d2a1f]/60 p-4 rounded-lg border border-yellow-500/20">
              <h4 className="font-semibold text-yellow-200 mb-2">Your Travel Profile</h4>
              <div className="space-y-1 text-sm text-yellow-300/70">
                <p>Flight Frequency: {profileData.flightFrequency || 'Not specified'}</p>
                <p>Countries Visited: {profileData.countriesVisited}</p>
                <p>Preferred Airlines: {profileData.preferredAirlines || 'Not specified'}</p>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#171821] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/10 via-transparent to-yellow-800/10"></div>
      <Card className="w-full max-w-lg shadow-2xl shadow-yellow-500/20 border-yellow-500/30 bg-[#171821]/95 backdrop-blur-md relative">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <Plane className="h-8 w-8 text-yellow-400" />
            <span className="text-2xl font-bold luxury-text-gradient">
              TAAI Travel
            </span>
          </div>
          
          <div className="space-y-2">
            <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
              Step {currentStep} of {totalSteps}
            </Badge>
            <CardTitle className="text-2xl text-yellow-200">Profile Setup</CardTitle>
            <CardDescription className="text-yellow-300/70">
              Help us personalize your travel experience
            </CardDescription>
          </div>
          
          <Progress value={progress} className="w-full" />
        </CardHeader>

        <CardContent className="space-y-6">
          {renderStepContent()}
          
          <div className="flex justify-between pt-4">
            <Button 
              variant="outline" 
              onClick={handleBack}
              className="flex items-center space-x-2 border-yellow-500/50 text-yellow-400 hover:bg-yellow-400/10 hover:border-yellow-400"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            
            <Button 
              onClick={handleNext}
              className="gold-gradient hover:opacity-90 text-[#171821] font-semibold flex items-center space-x-2"
            >
              <span>{currentStep === totalSteps ? 'Complete Setup' : 'Next'}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSetup;
