
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plane, Calendar, Users, MapPin, DollarSign, ArrowLeft, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CreateItinerary = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [itineraryData, setItineraryData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    people: 1,
    budget: '',
    destinations: '',
    description: '',
    travelerTypes: [] as string[]
  });

  const travelerTypeOptions = [
    { id: 'solo', label: 'Solo Traveler', icon: '🧳' },
    { id: 'couple', label: 'Couple', icon: '💑' },
    { id: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
    { id: 'friends', label: 'Friends', icon: '👥' },
    { id: 'business', label: 'Business', icon: '💼' }
  ];

  const handleInputChange = (field: string, value: string | number | string[]) => {
    setItineraryData(prev => ({ ...prev, [field]: value }));
  };

  const toggleTravelerType = (type: string) => {
    setItineraryData(prev => ({
      ...prev,
      travelerTypes: prev.travelerTypes.includes(type)
        ? prev.travelerTypes.filter(t => t !== type)
        : [...prev.travelerTypes, type]
    }));
  };

  const handleCreateItinerary = () => {
    toast({
      title: "Itinerary Created!",
      description: "Your travel plan has been created successfully. Let's start adding details.",
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/dashboard')}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Plane className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                TAAI Travel
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Create New Itinerary</h1>
          <p className="text-xl text-gray-600">Let's plan your perfect trip with AI assistance</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Main Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span>Trip Details</span>
                </CardTitle>
                <CardDescription>Basic information about your trip</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Trip Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Summer Europe Adventure"
                    value={itineraryData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={itineraryData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={itineraryData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="people">Number of Travelers</Label>
                    <Input
                      id="people"
                      type="number"
                      min="1"
                      value={itineraryData.people}
                      onChange={(e) => handleInputChange('people', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget (USD)</Label>
                    <Input
                      id="budget"
                      placeholder="5000"
                      value={itineraryData.budget}
                      onChange={(e) => handleInputChange('budget', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                  <span>Destinations</span>
                </CardTitle>
                <CardDescription>Where would you like to go?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="destinations">Destinations</Label>
                  <Input
                    id="destinations"
                    placeholder="e.g., Paris, Rome, Barcelona"
                    value={itineraryData.destinations}
                    onChange={(e) => handleInputChange('destinations', e.target.value)}
                  />
                  <p className="text-sm text-gray-500">Separate multiple destinations with commas</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Trip Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Tell us about your ideal trip..."
                    value={itineraryData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <span>Travel Style</span>
                </CardTitle>
                <CardDescription>What type of trip is this?</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  {travelerTypeOptions.map((option) => (
                    <div
                      key={option.id}
                      onClick={() => toggleTravelerType(option.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                        itineraryData.travelerTypes.includes(option.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{option.icon}</span>
                        <span className="font-medium text-gray-900">{option.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Recommendations</CardTitle>
                <CardDescription>Based on your preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-900">🎯 Smart Tip</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Based on your profile, we recommend booking flights 6-8 weeks in advance for better deals.
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-sm font-medium text-emerald-900">💰 Budget Insight</p>
                    <p className="text-sm text-emerald-700 mt-1">
                      Similar trips to Europe typically cost $150-250 per day per person including accommodation.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trip Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">
                      {itineraryData.startDate && itineraryData.endDate 
                        ? `${Math.ceil((new Date(itineraryData.endDate).getTime() - new Date(itineraryData.startDate).getTime()) / (1000 * 60 * 60 * 24))} days`
                        : 'Not set'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Travelers:</span>
                    <span className="font-medium">{itineraryData.people}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Budget:</span>
                    <span className="font-medium">
                      {itineraryData.budget ? `$${Number(itineraryData.budget).toLocaleString()}` : 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Per Person:</span>
                    <span className="font-medium">
                      {itineraryData.budget ? `$${Math.round(Number(itineraryData.budget) / itineraryData.people).toLocaleString()}` : 'Not set'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={handleCreateItinerary}
              size="lg"
              className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white"
            >
              Create Itinerary
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateItinerary;
