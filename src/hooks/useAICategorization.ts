import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SearchType } from '@/components/search/AdaptiveSearchForm';

export interface Category {
  name: string;
  icon: string;
  results: any[];
}

export const useAICategorization = (results: any[], searchType: SearchType) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!results || results.length === 0) {
      setCategories([]);
      return;
    }

    const categorize = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: functionError } = await supabase.functions.invoke(
          'categorize-search-results',
          {
            body: { results, searchType }
          }
        );

        if (functionError) throw functionError;

        if (data?.categories) {
          setCategories(data.categories);
          console.log(`Loaded ${data.categories.length} AI-generated categories`);
        }
      } catch (err: any) {
        console.error('Error categorizing results:', err);
        setError(err.message);
        toast.error('Failed to categorize results');
        
        // Fallback to showing all results in one category
        setCategories([{
          name: 'All Results',
          icon: '📋',
          results: results
        }]);
      } finally {
        setLoading(false);
      }
    };

    categorize();
  }, [results, searchType]);

  return { categories, loading, error };
};
