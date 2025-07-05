import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, X } from "lucide-react";
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
      navigate('/dashboard');
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
      <div className="min-h-screen bg-[#171821] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#171821]">
      {/* Header - Matching home page navigation */}
      <nav className="bg-[#171821]/95 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleDiscard}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Itinerary
            </Button>
            
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <img src="/lovable-uploads/1c94ff06-05c4-46fe-b015-481744bc6ce1.png" alt="TAAI Travel" className="h-[70px]" />
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleDiscard}
                className="bg-white text-[#171821] border-white hover:bg-gradient-to-r hover:from-[hsl(351,85%,75%)] hover:via-[hsl(15,80%,70%)] hover:to-[hsl(25,75%,65%)] hover:text-white active:bg-gradient-to-r active:from-[hsl(351,85%,75%)] active:via-[hsl(15,80%,70%)] active:to-[hsl(25,75%,65%)] active:text-white transition-all duration-300"
              >
                <X className="h-4 w-4 mr-1" />
                Discard
              </Button>
              <Button 
                onClick={handleSave}
                disabled={saving}
                className="gold-gradient hover:opacity-90 text-[#171821] font-semibold"
              >
                <Save className="h-4 w-4 mr-1" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Similar to home page */}
      <section className="relative overflow-hidden py-12 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5"></div>
        <div className="max-w-4xl mx-auto text-center relative">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Edit Your
            <span className="luxury-text-gradient block">
              Travel Itinerary
            </span>
          </h1>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed">
            Update your travel plans and preferences with our intuitive editing interface
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 pb-12 space-y-6">
        {/* Basic Info */}
        <Card className="group hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 bg-[#171821]/80 border-white/30 hover:border-white/40">
          <CardHeader>
            <CardTitle className="text-white">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Itinerary Name</label>
              <Input
                value={formData.itin_name}
                onChange={(e) => setFormData(prev => ({ ...prev, itin_name: e.target.value }))}
                placeholder="Enter itinerary name"
                className="bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-white/50 focus:bg-white/15 transition-all duration-200"
              />
            </div>
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Description</label>
              <Textarea
                value={formData.itin_desc}
                onChange={(e) => setFormData(prev => ({ ...prev, itin_desc: e.target.value }))}
                placeholder="Describe your trip"
                className="bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-white/50 focus:bg-white/15 transition-all duration-200 min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Dates & Budget */}
        <Card className="group hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 bg-[#171821]/80 border-white/30 hover:border-white/40">
          <CardHeader>
            <CardTitle className="text-white">Dates & Budget</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Start Date</label>
              <Input
                type="date"
                value={formData.itin_date_start}
                onChange={(e) => setFormData(prev => ({ ...prev, itin_date_start: e.target.value }))}
                className="bg-white/10 border-white/30 text-white focus:border-white/50 focus:bg-white/15 transition-all duration-200"
              />
            </div>
            <div>
              <label className="text-white text-sm font-medium mb-2 block">End Date</label>
              <Input
                type="date"
                value={formData.itin_date_end}
                onChange={(e) => setFormData(prev => ({ ...prev, itin_date_end: e.target.value }))}
                className="bg-white/10 border-white/30 text-white focus:border-white/50 focus:bg-white/15 transition-all duration-200"
              />
            </div>
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Budget ($)</label>
              <Input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                placeholder="0"
                className="bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-white/50 focus:bg-white/15 transition-all duration-200"
              />
            </div>
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Spending ($)</label>
              <Input
                type="number"
                value={formData.spending}
                onChange={(e) => setFormData(prev => ({ ...prev, spending: e.target.value }))}
                placeholder="0"
                className="bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-white/50 focus:bg-white/15 transition-all duration-200"
              />
            </div>
          </CardContent>
        </Card>

        {/* Locations */}
        <Card className="group hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 bg-[#171821]/80 border-white/30 hover:border-white/40">
          <CardHeader>
            <CardTitle className="text-white flex justify-between items-center">
              Locations
              <Button 
                onClick={addLocation} 
                size="sm" 
                className="gold-gradient hover:opacity-90 text-[#171821] font-semibold"
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
                  className="bg-white/20 text-white hover:bg-white/30 cursor-pointer border-white/30 transition-all duration-200"
                  onClick={() => removeLocation(index)}
                >
                  {location} ×
                </Badge>
              ))}
              {formData.itin_locations.length === 0 && (
                <p className="text-white/70">No locations added yet. Click "Add Location" to get started.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Travel Type */}
        <Card className="group hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 bg-[#171821]/80 border-white/30 hover:border-white/40">
          <CardHeader>
            <CardTitle className="text-white">Travel Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button
                variant={formData.user_type === 'individual' ? 'default' : 'outline'}
                onClick={() => setFormData(prev => ({ ...prev, user_type: 'individual' }))}
                className={formData.user_type === 'individual' 
                  ? "gold-gradient hover:opacity-90 text-[#171821] font-semibold" 
                  : "bg-white/10 border-white/30 text-white hover:bg-white/20 transition-all duration-200"
                }
              >
                Individual
              </Button>
              <Button
                variant={formData.user_type === 'business' ? 'default' : 'outline'}
                onClick={() => setFormData(prev => ({ ...prev, user_type: 'business' }))}
                className={formData.user_type === 'business' 
                  ? "gold-gradient hover:opacity-90 text-[#171821] font-semibold" 
                  : "bg-white/10 border-white/30 text-white hover:bg-white/20 transition-all duration-200"
                }
              >
                Business
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Budget Efficiency (Additional Fields) */}
        <Card className="group hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 bg-[#171821]/80 border-white/30 hover:border-white/40">
          <CardHeader>
            <CardTitle className="text-white">Budget Analysis</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Budget Rate</label>
              <Input
                type="number"
                step="0.01"
                value={formData.budget_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, budget_rate: e.target.value }))}
                placeholder="0.00"
                className="bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-white/50 focus:bg-white/15 transition-all duration-200"
              />
            </div>
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Budget Efficiency Rate</label>
              <Input
                type="number"
                step="0.01"
                value={formData.b_efficiency_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, b_efficiency_rate: e.target.value }))}
                placeholder="0.00"
                className="bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-white/50 focus:bg-white/15 transition-all duration-200"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditItinerary;