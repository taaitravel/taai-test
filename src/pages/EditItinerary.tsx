import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, X } from "lucide-react";
import { MobileNavigation } from "@/components/shared/MobileNavigation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const EditItinerary = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const itineraryId = searchParams.get('id');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalData, setOriginalData] = useState<any>(null);
  const [formData, setFormData] = useState({
    itin_name: '',
    itin_desc: '',
    itin_date_start: '',
    itin_date_end: '',
    budget: '',
    user_type: 'individual',
    itin_locations: [] as string[],
    attendees: [] as any[],
    spending: '',
    budget_rate: '',
    b_efficiency_rate: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (itineraryId) {
      loadItinerary();
    }
  }, [user, itineraryId]);

  const loadItinerary = async () => {
    try {
      const { data, error } = await supabase
        .from('itinerary')
        .select('*')
        .eq('id', parseInt(itineraryId!))
        .eq('userid', user?.id)
        .single();

      if (error) throw error;
      
      setOriginalData(data);
      setFormData({
        itin_name: data.itin_name || '',
        itin_desc: data.itin_desc || '',
        itin_date_start: data.itin_date_start || '',
        itin_date_end: data.itin_date_end || '',
        budget: data.budget?.toString() || '',
        user_type: data.user_type || 'individual',
        itin_locations: Array.isArray(data.itin_locations) ? data.itin_locations.map(String) : [],
        attendees: Array.isArray(data.attendees) ? data.attendees : [],
        spending: data.spending?.toString() || '',
        budget_rate: data.budget_rate?.toString() || '',
        b_efficiency_rate: data.b_efficiency_rate?.toString() || ''
      });
    } catch (error) {
      console.error('Error loading itinerary:', error);
      toast.error('Failed to load itinerary');
      navigate('/home');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('itinerary')
        .update({
          itin_name: formData.itin_name,
          itin_desc: formData.itin_desc,
          itin_date_start: formData.itin_date_start,
          itin_date_end: formData.itin_date_end,
          budget: formData.budget ? parseFloat(formData.budget) : null,
          user_type: formData.user_type,
          itin_locations: formData.itin_locations,
          attendees: formData.attendees,
          spending: formData.spending ? parseFloat(formData.spending) : null,
          budget_rate: formData.budget_rate ? parseFloat(formData.budget_rate) : null,
          b_efficiency_rate: formData.b_efficiency_rate ? parseFloat(formData.b_efficiency_rate) : null
        })
        .eq('id', parseInt(itineraryId!))
        .eq('userid', user?.id);

      if (error) throw error;
      
      toast.success('Itinerary updated successfully!');
      navigate(`/itinerary?id=${itineraryId}`);
    } catch (error) {
      console.error('Error saving itinerary:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    navigate(`/itinerary?id=${itineraryId}`);
  };

  const addLocation = () => {
    const location = prompt('Enter location:');
    if (location) {
      setFormData(prev => ({
        ...prev,
        itin_locations: [...prev.itin_locations, location]
      }));
    }
  };

  const removeLocation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      itin_locations: prev.itin_locations.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation - Mobile Responsive */}
      <MobileNavigation 
        travelerLevel="Master Traveler"
        showBackButton={true}
        backPath={`/itinerary?id=${itineraryId}`}
        backLabel="Back to Itinerary"
        showProfileButton={false}
        showTripButtons={false}
        customActions={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleDiscard}
              className="border-border text-foreground hover:bg-destructive hover:text-destructive-foreground transition-all duration-300"
            >
              <X className="h-4 w-4 mr-1" />
              Discard
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="gold-gradient hover:opacity-90 text-primary-foreground font-semibold"
            >
              <Save className="h-4 w-4 mr-1" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        }
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5"></div>
        <div className="max-w-4xl mx-auto text-center relative">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
            Edit Your
            <span className="luxury-text-gradient block">
              Travel Itinerary
            </span>
          </h1>
          <p className="text-xl text-foreground/80 mb-8 max-w-2xl mx-auto leading-relaxed">
            Update your travel plans and preferences with our intuitive editing interface
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 pb-12 space-y-6">
        {/* Basic Info */}
        <Card className="group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 bg-card/80 border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-foreground text-sm font-medium mb-2 block">Itinerary Name</label>
              <Input
                value={formData.itin_name}
                onChange={(e) => setFormData(prev => ({ ...prev, itin_name: e.target.value }))}
                placeholder="Enter itinerary name"
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-primary transition-all duration-200"
              />
            </div>
            <div>
              <label className="text-foreground text-sm font-medium mb-2 block">Description</label>
              <Textarea
                value={formData.itin_desc}
                onChange={(e) => setFormData(prev => ({ ...prev, itin_desc: e.target.value }))}
                placeholder="Describe your trip"
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-primary transition-all duration-200 min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Dates & Budget */}
        <Card className="group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 bg-card/80 border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Dates & Budget</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-foreground text-sm font-medium mb-2 block">Start Date</label>
              <Input
                type="date"
                value={formData.itin_date_start}
                onChange={(e) => setFormData(prev => ({ ...prev, itin_date_start: e.target.value }))}
                className="bg-secondary border-border text-foreground focus:border-primary transition-all duration-200"
              />
            </div>
            <div>
              <label className="text-foreground text-sm font-medium mb-2 block">End Date</label>
              <Input
                type="date"
                value={formData.itin_date_end}
                onChange={(e) => setFormData(prev => ({ ...prev, itin_date_end: e.target.value }))}
                className="bg-secondary border-border text-foreground focus:border-primary transition-all duration-200"
              />
            </div>
            <div>
              <label className="text-foreground text-sm font-medium mb-2 block">Budget ($)</label>
              <Input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                placeholder="0"
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-primary transition-all duration-200"
              />
            </div>
            <div>
              <label className="text-foreground text-sm font-medium mb-2 block">Spending ($)</label>
              <Input
                type="number"
                value={formData.spending}
                onChange={(e) => setFormData(prev => ({ ...prev, spending: e.target.value }))}
                placeholder="0"
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-primary transition-all duration-200"
              />
            </div>
          </CardContent>
        </Card>

        {/* Transportation */}
        <Card className="group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 bg-card/80 border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex justify-between items-center">
              Transportation
              <Button 
                onClick={addLocation} 
                size="sm" 
                className="gold-gradient hover:opacity-90 text-primary-foreground font-semibold"
              >
                Add Location
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {formData.itin_locations.map((location, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="bg-secondary text-foreground hover:bg-secondary/80 cursor-pointer border-border transition-all duration-200"
                  onClick={() => removeLocation(index)}
                >
                  {location} ×
                </Badge>
              ))}
              {formData.itin_locations.length === 0 && (
                <p className="text-foreground/60">No locations added yet. Click "Add Location" to get started.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Travel Type */}
        <Card className="group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 bg-card/80 border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Travel Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button
                variant={formData.user_type === 'individual' ? 'default' : 'outline'}
                onClick={() => setFormData(prev => ({ ...prev, user_type: 'individual' }))}
                className={formData.user_type === 'individual' 
                  ? "gold-gradient hover:opacity-90 text-primary-foreground font-semibold" 
                  : "bg-secondary border-border text-foreground hover:bg-secondary/80 transition-all duration-200"
                }
              >
                Individual
              </Button>
              <Button
                variant={formData.user_type === 'business' ? 'default' : 'outline'}
                onClick={() => setFormData(prev => ({ ...prev, user_type: 'business' }))}
                className={formData.user_type === 'business' 
                  ? "gold-gradient hover:opacity-90 text-primary-foreground font-semibold" 
                  : "bg-secondary border-border text-foreground hover:bg-secondary/80 transition-all duration-200"
                }
              >
                Business
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Budget Efficiency */}
        <Card className="group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 bg-card/80 border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Budget Analysis</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-foreground text-sm font-medium mb-2 block">Budget Rate</label>
              <Input
                type="number"
                step="0.01"
                value={formData.budget_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, budget_rate: e.target.value }))}
                placeholder="0.00"
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-primary transition-all duration-200"
              />
            </div>
            <div>
              <label className="text-foreground text-sm font-medium mb-2 block">Budget Efficiency Rate</label>
              <Input
                type="number"
                step="0.01"
                value={formData.b_efficiency_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, b_efficiency_rate: e.target.value }))}
                placeholder="0.00"
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-primary transition-all duration-200"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditItinerary;
