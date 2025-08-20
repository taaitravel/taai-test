import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar, MapPin, Plus, Check } from 'lucide-react';

interface ItineraryOption {
  id: number;
  itin_name: string;
  itin_desc?: string;
  itin_date_start?: string;
  itin_date_end?: string;
  itin_locations?: any[];
}

interface ItinerarySelectorProps {
  onItinerarySelected: (itineraryId: string) => void;
  onBack: () => void;
  itemType: 'hotel' | 'flight' | 'activity' | 'restaurant';
  selectedItems: any[];
}

export const ItinerarySelector: React.FC<ItinerarySelectorProps> = ({
  onItinerarySelected,
  onBack,
  itemType,
  selectedItems
}) => {
  const [itineraries, setItineraries] = useState<ItineraryOption[]>([]);
  const [selectedItineraryId, setSelectedItineraryId] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newItinerary, setNewItinerary] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    location: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserItineraries();
  }, []);

  const fetchUserItineraries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('itinerary')
        .select('id, itin_name, itin_desc, itin_date_start, itin_date_end, itin_locations')
        .eq('userid', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItineraries((data || []).map(item => ({
        ...item,
        itin_locations: Array.isArray(item.itin_locations) ? item.itin_locations : []
      })));
    } catch (error) {
      console.error('Error fetching itineraries:', error);
      toast({
        title: "Error",
        description: "Failed to fetch your itineraries",
        variant: "destructive",
      });
    }
  };

  const handleCreateItinerary = async () => {
    if (!newItinerary.name.trim()) {
      toast({
        title: "Error",
        description: "Please provide a name for your itinerary",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('itinerary')
        .insert({
          userid: user.id,
          itin_name: newItinerary.name,
          itin_desc: newItinerary.description,
          itin_date_start: newItinerary.startDate || null,
          itin_date_end: newItinerary.endDate || null,
          itin_locations: newItinerary.location ? [{ name: newItinerary.location }] : [],
          hotels: itemType === 'hotel' ? selectedItems : [],
          flights: itemType === 'flight' ? selectedItems : [],
          activities: itemType === 'activity' ? selectedItems : [],
          reservations: itemType === 'restaurant' ? selectedItems : []
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: `New itinerary "${newItinerary.name}" created and items added!`,
      });

      onItinerarySelected(data.id.toString());
    } catch (error) {
      console.error('Error creating itinerary:', error);
      toast({
        title: "Error",
        description: "Failed to create new itinerary",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToExisting = async () => {
    if (!selectedItineraryId) {
      toast({
        title: "Error",
        description: "Please select an itinerary",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Fetch current itinerary data
      const { data: currentItinerary, error: fetchError } = await supabase
        .from('itinerary')
        .select('*')
        .eq('id', parseInt(selectedItineraryId))
        .eq('userid', user.id)
        .single();

      if (fetchError) throw fetchError;

      // Merge with existing items
      const fieldName = itemType === 'restaurant' ? 'reservations' : `${itemType}s`;
      const currentItems = currentItinerary[fieldName] || [];
      const updatedItems = [...currentItems, ...selectedItems];

      const { error: updateError } = await supabase
        .from('itinerary')
        .update({ [fieldName]: updatedItems })
        .eq('id', parseInt(selectedItineraryId))
        .eq('userid', user.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: `${selectedItems.length} ${itemType}(s) added to your itinerary!`,
      });

      onItinerarySelected(selectedItineraryId);
    } catch (error) {
      console.error('Error adding to itinerary:', error);
      toast({
        title: "Error",
        description: "Failed to add items to itinerary",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <Card className="max-w-2xl mx-auto bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white text-center">
            Add {selectedItems.length} {itemType}(s) to Itinerary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Existing Itineraries */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Choose Existing Itinerary</h3>
            
            {itineraries.length > 0 ? (
              <div className="space-y-2">
                <Select value={selectedItineraryId} onValueChange={setSelectedItineraryId}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select an itinerary" />
                  </SelectTrigger>
                  <SelectContent>
                    {itineraries.map((itinerary) => (
                      <SelectItem key={itinerary.id} value={itinerary.id.toString()}>
                        <div className="flex flex-col">
                          <span className="font-medium">{itinerary.itin_name}</span>
                          {itinerary.itin_date_start && (
                            <span className="text-sm text-muted-foreground">
                              {itinerary.itin_date_start} to {itinerary.itin_date_end}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button
                  onClick={handleAddToExisting}
                  disabled={!selectedItineraryId || isLoading}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Add to Selected Itinerary
                </Button>
              </div>
            ) : (
              <p className="text-white/60 text-center py-4">
                No existing itineraries found. Create a new one below.
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-2 text-white/60">Or</span>
            </div>
          </div>

          {/* Create New Itinerary */}
          <div className="space-y-4">
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Itinerary
            </Button>

            {showCreateForm && (
              <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/20">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">Itinerary Name *</Label>
                  <Input
                    id="name"
                    value={newItinerary.name}
                    onChange={(e) => setNewItinerary(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="My Amazing Trip"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white">Description</Label>
                  <Textarea
                    id="description"
                    value={newItinerary.description}
                    onChange={(e) => setNewItinerary(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of your trip..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-white">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={newItinerary.startDate}
                      onChange={(e) => setNewItinerary(prev => ({ ...prev, startDate: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate" className="text-white">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={newItinerary.endDate}
                      onChange={(e) => setNewItinerary(prev => ({ ...prev, endDate: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-white">Primary Location</Label>
                  <Input
                    id="location"
                    value={newItinerary.location}
                    onChange={(e) => setNewItinerary(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Paris, France"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                  />
                </div>

                <Button
                  onClick={handleCreateItinerary}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Itinerary & Add Items
                </Button>
              </div>
            )}
          </div>

          <Button
            onClick={onBack}
            variant="ghost"
            className="w-full text-white hover:bg-white/10"
          >
            Back to Chat
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
