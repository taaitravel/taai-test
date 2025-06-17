
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
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Personal Information</h3>
              <p className="text-gray-600">Let's complete your basic profile</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Smith"
                value={profileData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="123 Main St, City, State 12345"
                value={profileData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nationality">Nationality</Label>
                <Input
                  id="nationality"
                  placeholder="United States"
                  value={profileData.nationality}
                  onChange={(e) => handleInputChange('nationality', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthday">Birthday</Label>
                <Input
                  id="birthday"
                  type="date"
                  value={profileData.birthday}
                  onChange={(e) => handleInputChange('birthday', e.target.value)}
                />
              </div>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Plane className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Travel Preferences</h3>
              <p className="text-gray-600">Help us understand your travel style</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="flightFrequency">How often do you fly per year?</Label>
              <select 
                className="w-full p-2 border border-gray-300 rounded-md"
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
              <Label htmlFor="countriesVisited">Countries Visited</Label>
              <Input
                id="countriesVisited"
                type="number"
                placeholder="15"
                value={profileData.countriesVisited}
                onChange={(e) => handleInputChange('countriesVisited', parseInt(e.target.value) || 0)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="preferredAirlines">Preferred Airlines (comma separated)</Label>
              <Input
                id="preferredAirlines"
                placeholder="Delta, American Airlines, United"
                value={profileData.preferredAirlines}
                onChange={(e) => handleInputChange('preferredAirlines', e.target.value)}
              />
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <MapPin className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Loyalty & Preferences</h3>
              <p className="text-gray-600">Almost done! Final details for personalization</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="preferredHotels">Preferred Hotel Brands (comma separated)</Label>
              <Input
                id="preferredHotels"
                placeholder="Marriott, Hilton, Hyatt"
                value={profileData.preferredHotels}
                onChange={(e) => handleInputChange('preferredHotels', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="loyaltyPrograms">Loyalty Program Numbers (optional)</Label>
              <Input
                id="loyaltyPrograms"
                placeholder="Delta SkyMiles: 123456789"
                value={profileData.loyaltyPrograms}
                onChange={(e) => handleInputChange('loyaltyPrograms', e.target.value)}
              />
            </div>
            
            {/* Travel Profile Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Your Travel Profile</h4>
              <div className="space-y-1 text-sm text-gray-600">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl border-0">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <Plane className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              TAAI Travel
            </span>
          </div>
          
          <div className="space-y-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              Step {currentStep} of {totalSteps}
            </Badge>
            <CardTitle className="text-2xl">Profile Setup</CardTitle>
            <CardDescription>
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
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            
            <Button 
              onClick={handleNext}
              className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white flex items-center space-x-2"
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
