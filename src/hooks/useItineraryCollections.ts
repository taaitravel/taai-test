import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Collection {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  itinerary_count?: number;
}

export interface CollectionItinerary {
  id: string;
  collection_id: string;
  itinerary_id: number;
  added_at: string;
}

export const useItineraryCollections = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCollections = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch collections
      const { data: collectionsData, error: collectionsError } = await supabase
        .from('itinerary_collections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (collectionsError) throw collectionsError;

      // Fetch counts for each collection
      const { data: countData, error: countError } = await supabase
        .from('collection_itineraries')
        .select('collection_id');

      if (countError) throw countError;

      // Calculate counts
      const countMap = (countData || []).reduce((acc, item) => {
        acc[item.collection_id] = (acc[item.collection_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const collectionsWithCounts = (collectionsData || []).map(c => ({
        ...c,
        itinerary_count: countMap[c.id] || 0
      }));

      setCollections(collectionsWithCounts);
    } catch (error) {
      console.error('Error fetching collections:', error);
      toast({
        title: 'Error',
        description: 'Failed to load collections',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const createCollection = async (name: string, description?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('itinerary_collections')
        .insert({
          user_id: user.id,
          name,
          description: description || null
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Collection created',
        description: `"${name}" has been created`
      });

      await fetchCollections();
      return data;
    } catch (error) {
      console.error('Error creating collection:', error);
      toast({
        title: 'Error',
        description: 'Failed to create collection',
        variant: 'destructive'
      });
      return null;
    }
  };

  const updateCollection = async (id: string, name: string, description?: string) => {
    try {
      const { error } = await supabase
        .from('itinerary_collections')
        .update({ name, description: description || null })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Collection updated',
        description: 'Changes have been saved'
      });

      await fetchCollections();
      return true;
    } catch (error) {
      console.error('Error updating collection:', error);
      toast({
        title: 'Error',
        description: 'Failed to update collection',
        variant: 'destructive'
      });
      return false;
    }
  };

  const deleteCollection = async (id: string, deleteItineraries: boolean = false) => {
    try {
      if (deleteItineraries) {
        // Get itinerary IDs in this collection
        const { data: items, error: fetchError } = await supabase
          .from('collection_itineraries')
          .select('itinerary_id')
          .eq('collection_id', id);

        if (fetchError) throw fetchError;

        // Delete the itineraries
        if (items && items.length > 0) {
          const itineraryIds = items.map(i => i.itinerary_id);
          const { error: deleteItinError } = await supabase
            .from('itinerary')
            .delete()
            .in('id', itineraryIds);

          if (deleteItinError) throw deleteItinError;
        }
      }

      // Delete the collection (cascade will handle junction table)
      const { error } = await supabase
        .from('itinerary_collections')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Collection deleted',
        description: deleteItineraries 
          ? 'Collection and its itineraries have been deleted'
          : 'Collection has been deleted'
      });

      await fetchCollections();
      return true;
    } catch (error) {
      console.error('Error deleting collection:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete collection',
        variant: 'destructive'
      });
      return false;
    }
  };

  const addToCollection = async (collectionId: string, itineraryIds: number[]) => {
    try {
      const inserts = itineraryIds.map(itineraryId => ({
        collection_id: collectionId,
        itinerary_id: itineraryId
      }));

      const { error } = await supabase
        .from('collection_itineraries')
        .upsert(inserts, { onConflict: 'collection_id,itinerary_id' });

      if (error) throw error;

      toast({
        title: 'Added to collection',
        description: `${itineraryIds.length} itinerary(s) added`
      });

      await fetchCollections();
      return true;
    } catch (error) {
      console.error('Error adding to collection:', error);
      toast({
        title: 'Error',
        description: 'Failed to add to collection',
        variant: 'destructive'
      });
      return false;
    }
  };

  const removeFromCollection = async (collectionId: string, itineraryId: number) => {
    try {
      const { error } = await supabase
        .from('collection_itineraries')
        .delete()
        .eq('collection_id', collectionId)
        .eq('itinerary_id', itineraryId);

      if (error) throw error;

      toast({
        title: 'Removed from collection',
        description: 'Itinerary removed from collection'
      });

      await fetchCollections();
      return true;
    } catch (error) {
      console.error('Error removing from collection:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove from collection',
        variant: 'destructive'
      });
      return false;
    }
  };

  const getCollectionItineraries = async (collectionId: string): Promise<number[]> => {
    try {
      const { data, error } = await supabase
        .from('collection_itineraries')
        .select('itinerary_id')
        .eq('collection_id', collectionId);

      if (error) throw error;

      return (data || []).map(i => i.itinerary_id);
    } catch (error) {
      console.error('Error fetching collection itineraries:', error);
      return [];
    }
  };

  return {
    collections,
    loading,
    fetchCollections,
    createCollection,
    updateCollection,
    deleteCollection,
    addToCollection,
    removeFromCollection,
    getCollectionItineraries
  };
};
