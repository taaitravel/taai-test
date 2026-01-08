import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BreadcrumbData {
  collectionId: string | null;
  collectionName: string | null;
  loading: boolean;
}

export const useItineraryBreadcrumb = (itineraryId: number | null): BreadcrumbData => {
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [collectionName, setCollectionName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollectionInfo = async () => {
      if (!itineraryId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('collection_itineraries')
          .select(`
            collection_id,
            itinerary_collections!inner(name)
          `)
          .eq('itinerary_id', itineraryId)
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error fetching collection info:', error);
        } else if (data) {
          setCollectionId(data.collection_id);
          setCollectionName((data.itinerary_collections as any)?.name || null);
        }
      } catch (err) {
        console.error('Error in useItineraryBreadcrumb:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCollectionInfo();
  }, [itineraryId]);

  return { collectionId, collectionName, loading };
};
