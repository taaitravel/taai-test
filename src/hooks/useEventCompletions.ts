import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface CompletionRecord {
  id: string;
  event_type: string;
  event_index: number;
  completed: boolean;
  completed_at: string | null;
}

export const useEventCompletions = (itineraryId: number | undefined) => {
  const { user } = useAuth();
  const [completions, setCompletions] = useState<Map<string, CompletionRecord>>(new Map());
  const [loading, setLoading] = useState(true);

  const makeKey = (eventType: string, eventIndex: number) => `${eventType}-${eventIndex}`;

  const fetchCompletions = useCallback(async () => {
    if (!user || !itineraryId) return;
    const { data, error } = await supabase
      .from('itinerary_event_completions')
      .select('id, event_type, event_index, completed, completed_at')
      .eq('itinerary_id', itineraryId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching completions:', error);
      setLoading(false);
      return;
    }

    const map = new Map<string, CompletionRecord>();
    (data || []).forEach((r: any) => {
      map.set(makeKey(r.event_type, r.event_index), r);
    });
    setCompletions(map);
    setLoading(false);
  }, [user, itineraryId]);

  useEffect(() => {
    fetchCompletions();
  }, [fetchCompletions]);

  const isCompleted = (eventType: string, eventIndex: number): boolean => {
    return completions.get(makeKey(eventType, eventIndex))?.completed ?? false;
  };

  const toggleCompletion = async (eventType: string, eventIndex: number, eventDate?: string) => {
    if (!user || !itineraryId) return;

    const key = makeKey(eventType, eventIndex);
    const existing = completions.get(key);
    const newCompleted = !(existing?.completed ?? false);

    // Optimistic update
    setCompletions(prev => {
      const next = new Map(prev);
      if (existing) {
        next.set(key, { ...existing, completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null });
      } else {
        next.set(key, { id: 'temp', event_type: eventType, event_index: eventIndex, completed: true, completed_at: new Date().toISOString() });
      }
      return next;
    });

    if (existing) {
      const { error } = await supabase
        .from('itinerary_event_completions')
        .update({
          completed: newCompleted,
          completed_at: newCompleted ? new Date().toISOString() : null,
        })
        .eq('id', existing.id);

      if (error) {
        console.error('Error updating completion:', error);
        fetchCompletions(); // rollback
        return;
      }
    } else {
      const { data, error } = await supabase
        .from('itinerary_event_completions')
        .insert({
          itinerary_id: itineraryId,
          user_id: user.id,
          event_type: eventType,
          event_index: eventIndex,
          event_date: eventDate || null,
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error inserting completion:', error);
        fetchCompletions();
        return;
      }

      // Update with real ID
      setCompletions(prev => {
        const next = new Map(prev);
        const cur = next.get(key);
        if (cur && data) next.set(key, { ...cur, id: data.id });
        return next;
      });
    }

    toast({
      title: newCompleted ? '✅ Marked complete' : 'Unmarked',
      description: newCompleted ? 'Great job! Event completed.' : 'Event marked as incomplete.',
    });
  };

  const getCompletedCount = (events: Array<{ type: string; index: number }>): number => {
    return events.filter(e => isCompleted(e.type, e.index)).length;
  };

  return { isCompleted, toggleCompletion, getCompletedCount, loading };
};
