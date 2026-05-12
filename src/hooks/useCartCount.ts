import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useCartCount = () => {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const fetchCount = async (userId: string) => {
    const { count: c } = await supabase
      .from('cart_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .neq('booking_status', 'booked');
    setCount(c || 0);
  };

  useEffect(() => {
    if (!user?.id) {
      setCount(0);
      return;
    }
    fetchCount(user.id);

    const channel = supabase
      .channel(`cart_items_${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cart_items', filter: `user_id=eq.${user.id}` },
        () => fetchCount(user.id)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return { count };
};
