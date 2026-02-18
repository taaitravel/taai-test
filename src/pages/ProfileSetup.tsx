import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plane, Users, MapPin, Calendar, ArrowRight, ArrowLeft, Globe, Plus, Minus, Car, Hotel, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MobileNavigation } from "@/components/shared/MobileNavigation";

const ProfileSetup = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { userType, formData } = location.state || {};
  
  const [currentStep, setCurrentStep] = useState(1);
  const [profileData, setProfileData] = useState({
    lastName: '',
    address: '',
    nationality: '',
    countriesVisited: [] as string[],
    monthlyFlights: {} as Record<number, number>,
    selectedAirlines: [] as string[],
    selectedHotels: [] as string[],
    selectedCarRentals: [] as string[],
    dateFormat: 'MM/DD/YY' as string
  });

  const [selectedContinent, setSelectedContinent] = useState<string | null>(null);

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  const continents = {
    'North America': ['United States', 'Canada', 'Mexico', 'Costa Rica', 'Panama'],
    'Europe': ['United Kingdom', 'France', 'Germany', 'Italy', 'Spain', 'Netherlands', 'Switzerland', 'Austria', 'Norway'],
    'Asia': ['Japan', 'China', 'Thailand', 'Singapore', 'South Korea', 'India', 'Indonesia', 'Malaysia', 'Philippines'],
    'South America': ['Brazil', 'Argentina', 'Chile', 'Peru', 'Colombia', 'Ecuador', 'Uruguay'],
    'Africa': ['South Africa', 'Morocco', 'Egypt', 'Kenya', 'Tanzania', 'Ghana', 'Nigeria'],
    'Oceania': ['Australia', 'New Zealand', 'Fiji', 'Tahiti', 'Samoa']
  };

  const airlines = [
    'Delta', 'American Airlines', 'United', 'Southwest', 'JetBlue', 'Alaska Airlines',
    'British Airways', 'Lufthansa', 'Air France', 'KLM', 'Emirates', 'Qatar Airways',
    'Singapore Airlines', 'Cathay Pacific', 'ANA', 'JAL', 'Turkish Airlines'
  ];

  const hotels = [
    'Marriott', 'Hilton', 'Hyatt', 'IHG', 'Accor', 'Wyndham', 'Best Western',
    'Four Seasons', 'Ritz-Carlton', 'St. Regis', 'W Hotels', 'Edition',
    'Aman', 'Mandarin Oriental', 'Park Hyatt', 'Conrad', 'Le Labo'
  ];

  const carRentals = [
    'Hertz', 'Avis', 'Enterprise', 'Budget', 'Alamo', 'National',
    'Zipcar', 'Turo', 'Sixt', 'Europcar', 'Thrifty'
  ];

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const handleInputChange = (field: string, value: string | number) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleCountrySelect = (country: string) => {
    setProfileData(prev => ({
      ...prev,
      countriesVisited: prev.countriesVisited.includes(country)
        ? prev.countriesVisited.filter(c => c !== country)
        : [...prev.countriesVisited, country]
    }));
  };

  const handleMonthClick = (monthIndex: number) => {
    setProfileData(prev => ({
      ...prev,
      monthlyFlights: {
        ...prev.monthlyFlights,
        [monthIndex]: Math.min((prev.monthlyFlights[monthIndex] || 0) + 1, 10)
      }
    }));
  };

  const handleMonthDecrease = (monthIndex: number) => {
    setProfileData(prev => ({
      ...prev,
      monthlyFlights: {
        ...prev.monthlyFlights,
        [monthIndex]: Math.max((prev.monthlyFlights[monthIndex] || 0) - 1, 0)
      }
    }));
  };

  const handlePreferenceSelect = (type: 'selectedAirlines' | 'selectedHotels' | 'selectedCarRentals', item: string) => {
    setProfileData(prev => ({
      ...prev,
      [type]: prev[type].includes(item)
        ? prev[type].filter(i => i !== item)
        : [...prev[type], item]
    }));
  };

  const getTravelerLevel = () => {
    const countryCount = profileData.countriesVisited.length;
    const totalFlights = Object.values(profileData.monthlyFlights).reduce((sum, flights) => sum + flights, 0);
    
    if (countryCount >= 20 || totalFlights >= 50) return { level: 'Globetrotter', icon: '🌍', color: 'text-yellow-400' };
    if (countryCount >= 10 || totalFlights >= 25) return { level: 'Explorer', icon: '✈️', color: 'text-blue-400' };
    if (countryCount >= 5 || totalFlights >= 10) return { level: 'Traveler', icon: '🎒', color: 'text-green-400' };
    return { level: 'Wanderer', icon: '🚶', color: 'text-gray-400' };
  };

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      try {
        const { error } = await supabase
          .from('users')
          .update({
            last_name: profileData.lastName,
            address: profileData.address,
            country: profileData.nationality,
            countries_visited: profileData.countriesVisited,
            flight_freq: profileData.monthlyFlights,
            p_airlines: profileData.selectedAirlines,
            p_hotels: profileData.selectedHotels,
            p_car_rentals: profileData.selectedCarRentals,
            date_format: profileData.dateFormat
          } as any)
          .eq('userid', user?.id);

        if (error) {
          console.error('Error saving profile:', error);
          toast({
            title: "Error saving profile",
            description: "Please try again.",
            variant: "destructive"
          });
          return;
        }

        const travelerLevel = getTravelerLevel();
        toast({
          title: `Welcome aboard, ${travelerLevel.level}!`,
          description: "Your adventure begins now. Let's plan your next trip!",
          variant: "success"
        });
        navigate('/home');
      } catch (error) {
        console.error('Error saving profile:', error);
        toast({
          title: "Error saving profile",
          description: "Please try again.",
          variant: "destructive"
        });
      }
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
              <h3 className="text-xl font-semibold text-foreground mb-2">Personal Information</h3>
              <p className="text-muted-foreground">Let's complete your basic profile</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-foreground">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Smith"
                value={profileData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address" className="text-foreground">Address</Label>
              <Input
                id="address"
                placeholder="123 Main St, City, State 12345"
                value={profileData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nationality" className="text-foreground">Nationality</Label>
              <Input
                id="nationality"
                placeholder="United States"
                value={profileData.nationality}
                onChange={(e) => handleInputChange('nationality', e.target.value)}
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Date Format Preference</Label>
              <div className="flex gap-2">
                {['MM/DD/YY', 'DD/MM/YY'].map(fmt => (
                  <Button
                    key={fmt}
                    variant={profileData.dateFormat === fmt ? "default" : "outline"}
                    size="sm"
                    onClick={() => setProfileData(prev => ({ ...prev, dateFormat: fmt }))}
                    className={profileData.dateFormat === fmt
                      ? 'gold-gradient text-primary-foreground'
                      : 'bg-secondary border-border hover:bg-accent text-foreground'}
                  >
                    {fmt}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Globe className="h-12 w-12 text-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Countries Visited</h3>
              <p className="text-muted-foreground">Pop the bubbles to select countries you've visited!</p>
              <Badge variant="secondary" className="mt-2 bg-accent text-foreground border-border">
                {profileData.countriesVisited.length} countries visited
              </Badge>
            </div>
            
            {!selectedContinent ? (
              <div className="space-y-4">
                <p className="text-center text-foreground">Select a continent to explore:</p>
                <div className="grid grid-cols-2 gap-3">
                  {Object.keys(continents).map((continent) => (
                    <Button
                      key={continent}
                      variant="outline"
                      onClick={() => setSelectedContinent(continent)}
                      className="h-16 text-sm font-medium bg-secondary border-border hover:bg-accent hover:border-primary animate-pulse text-foreground"
                    >
                      {continent}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground">{selectedContinent}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedContinent(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Back to continents
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {continents[selectedContinent].map((country) => (
                    <Button
                      key={country}
                      variant={profileData.countriesVisited.includes(country) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleCountrySelect(country)}
                      className={`text-xs transition-all duration-200 ${
                        profileData.countriesVisited.includes(country)
                          ? 'gold-gradient text-primary-foreground scale-95'
                          : 'bg-secondary border-border hover:bg-accent hover:scale-105 text-foreground'
                      }`}
                    >
                      {country}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Calendar className="h-12 w-12 text-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Flight Frequency</h3>
              <p className="text-muted-foreground">Click months to add flights (max 10 per month)</p>
              <Badge variant="secondary" className="mt-2 bg-accent text-foreground border-border">
                {Object.values(profileData.monthlyFlights).reduce((sum, flights) => sum + flights, 0)} total flights/year
              </Badge>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {months.map((month, index) => {
                const flightCount = profileData.monthlyFlights[index] || 0;
                return (
                  <div key={month} className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">{month}</div>
                    <div className={`border rounded-lg p-3 transition-colors ${
                      flightCount > 0 
                        ? 'border-primary hover:border-primary' 
                        : 'border-border hover:border-muted-foreground'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMonthDecrease(index)}
                          disabled={flightCount === 0}
                          className="h-6 w-6 p-0 text-foreground hover:text-foreground"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="font-semibold text-foreground">{flightCount}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMonthClick(index)}
                          disabled={flightCount >= 10}
                          className="h-6 w-6 p-0 text-foreground hover:text-foreground"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground">flights</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="flex justify-center space-x-4 mb-4">
                <Plane className="h-8 w-8 text-foreground" />
                <Hotel className="h-8 w-8 text-foreground" />
                <Car className="h-8 w-8 text-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Travel Preferences</h3>
              <p className="text-muted-foreground">Select your preferred airlines, hotels, and car rentals</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-foreground mb-2">Preferred Airlines</h4>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {airlines.map((airline) => (
                    <Button
                      key={airline}
                      variant={profileData.selectedAirlines.includes(airline) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePreferenceSelect('selectedAirlines', airline)}
                      className={`text-xs transition-all duration-200 ${
                        profileData.selectedAirlines.includes(airline)
                          ? 'gold-gradient text-primary-foreground'
                          : 'bg-secondary border-border hover:bg-accent text-foreground'
                      }`}
                    >
                      {airline}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-foreground mb-2">Preferred Hotels</h4>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {hotels.map((hotel) => (
                    <Button
                      key={hotel}
                      variant={profileData.selectedHotels.includes(hotel) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePreferenceSelect('selectedHotels', hotel)}
                      className={`text-xs transition-all duration-200 ${
                        profileData.selectedHotels.includes(hotel)
                          ? 'gold-gradient text-primary-foreground'
                          : 'bg-secondary border-border hover:bg-accent text-foreground'
                      }`}
                    >
                      {hotel}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-foreground mb-2">Preferred Car Rentals</h4>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {carRentals.map((rental) => (
                    <Button
                      key={rental}
                      variant={profileData.selectedCarRentals.includes(rental) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePreferenceSelect('selectedCarRentals', rental)}
                      className={`text-xs transition-all duration-200 ${
                        profileData.selectedCarRentals.includes(rental)
                          ? 'gold-gradient text-primary-foreground'
                          : 'bg-secondary border-border hover:bg-accent text-foreground'
                      }`}
                    >
                      {rental}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        const travelerLevel = getTravelerLevel();
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">🎉</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Profile Complete!</h3>
              <p className="text-muted-foreground">You're all set to start your journey</p>
            </div>

            <div className="bg-gradient-to-br from-accent/50 to-accent/10 p-6 rounded-lg border border-border text-center">
              <div className="text-4xl mb-3">{travelerLevel.icon}</div>
              <h4 className="text-xl font-bold text-foreground mb-2">
                Welcome, {travelerLevel.level}!
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                {profileData.countriesVisited.length} countries explored • {Object.values(profileData.monthlyFlights).reduce((sum, flights) => sum + flights, 0)} flights per year
              </p>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-background/50 p-3 rounded-lg">
                  <div className="font-semibold text-foreground">{profileData.selectedAirlines.length}</div>
                  <div className="text-muted-foreground">Preferred Airlines</div>
                </div>
                <div className="bg-background/50 p-3 rounded-lg">
                  <div className="font-semibold text-foreground">{profileData.selectedHotels.length}</div>
                  <div className="text-muted-foreground">Preferred Hotels</div>
                </div>
              </div>
            </div>

            <div className="bg-secondary/30 p-4 rounded-lg border border-border text-center">
              <h5 className="font-semibold text-foreground mb-2">Ready for Your Next Adventure?</h5>
              <p className="text-sm text-muted-foreground mb-3">
                Your personalized travel profile is ready. Let's start planning your next unforgettable trip!
              </p>
              <div className="flex items-center justify-center space-x-2 text-foreground">
                <MapPin className="h-4 w-4" />
                <span className="text-sm font-medium">Dashboard → Create Itinerary → Book Trip</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Based on your profile, we'll recommend personalized destinations, 
                optimize your loyalty programs, and find the best deals.
              </p>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MobileNavigation 
        showBackButton={true}
        backPath={currentStep > 1 ? undefined : "/signup"}
        backLabel="← Back"
        showTripButtons={false}
        showProfileButton={false}
      />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-accent/5 pointer-events-none"></div>
        <Card className="w-full max-w-lg shadow-2xl border-border bg-card/95 backdrop-blur-md relative">
          
        <CardHeader className="text-center space-y-4">
            <div className="flex items-center justify-center">
              <img src="/lovable-uploads/1c94ff06-05c4-46fe-b015-481744bc6ce1.png" alt="TAAI Travel" className="h-[70px] w-auto" />
            </div>
            
            <div className="space-y-2">
              <Badge variant="secondary" className="bg-accent text-foreground border-border">
                Step {currentStep} of {totalSteps}
              </Badge>
              <CardTitle className="text-2xl text-foreground">Profile Setup</CardTitle>
              <CardDescription className="text-muted-foreground">
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
                className="flex items-center space-x-2 bg-card border-border text-foreground hover:bg-accent"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              
              <Button 
                onClick={handleNext}
                className="gold-gradient hover:opacity-90 text-primary-foreground font-semibold flex items-center space-x-2"
              >
                <span>{currentStep === totalSteps ? 'Complete Setup' : 'Next'}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSetup;
