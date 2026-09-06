import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  CHAT_MESSAGE_FIELDS,
  CHAT_PARTICIPANT_FIELDS,
  CHAT_REACTION_FIELDS,
  PAGE_SIZES,
} from '@/lib/data/projections';

export interface ChatMessage {
  id: string;
  itinerary_id: number;
  sender_id: string;
  content: string | null;
  attachment_type: string | null;
  attachment_data: any;
  reply_to_id: string | null;
  edited_at: string | null;
  deleted: boolean;
  created_at: string;
  sender?: {
    first_name: string | null;
    last_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  reply_to?: ChatMessage | null;
  reactions: ChatReaction[];
}

export interface ChatReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction: string;
}

export interface ChatParticipant {
  id: string;
  itinerary_id: number;
  user_id: string;
  joined_at: string;
  user?: {
    first_name: string | null;
    last_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

type FilterType = 'all' | 'media' | 'docs';

export const useItineraryChat = (itineraryId: number | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [participantFilter, setParticipantFilter] = useState<string | null>(null);
  const channelRef = useRef<any>(null);
  const subscribedKeyRef = useRef<string | null>(null);
  const oldestCursorRef = useRef<string | null>(null);
  const newestCursorRef = useRef<string | null>(null);
  const profileMapRef = useRef<Record<string, any> | null>(null);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);

  const fetchParticipants = useCallback(async () => {
    if (!itineraryId) return;
    const { data } = await supabase
      .from('itinerary_chat_participants')
      .select(CHAT_PARTICIPANT_FIELDS)
      .eq('itinerary_id', itineraryId);

    if (!data) return;

    // Use safe RPC for profiles instead of direct users table query
    const { data: profiles } = await supabase.rpc('get_itinerary_participant_profiles', {
      p_itinerary_id: itineraryId
    });

    const profileMap: Record<string, any> = {};
    (profiles || []).forEach((p: any) => {
      profileMap[p.user_id] = {
        first_name: p.first_name,
        last_name: p.last_name,
        username: p.username,
        avatar_url: p.avatar_url,
      };
    });

    const withUsers = data.map((p: any) => ({
      ...p,
      user: profileMap[p.user_id] || null,
    }));
    setParticipants(withUsers);
  }, [itineraryId]);

  /**
   * Cursor pagination (egress containment): the initial load is bounded to
   * PAGE_SIZES.chatInitial newest messages. Realtime deltas fetch only rows
   * newer than the last known cursor instead of the whole conversation.
   */
  const loadMessages = useCallback(
    async (mode: 'initial' | 'newer' | 'older') => {
      if (!itineraryId) return;
      if (mode === 'initial') setLoading(true);

      let query = supabase
        .from('itinerary_chat_messages')
        .select(CHAT_MESSAGE_FIELDS)
        .eq('itinerary_id', itineraryId);

      if (mode === 'newer' && newestCursorRef.current) {
        query = query.gt('created_at', newestCursorRef.current).order('created_at', { ascending: true });
      } else if (mode === 'older' && oldestCursorRef.current) {
        query = query.lt('created_at', oldestCursorRef.current).order('created_at', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query.limit(PAGE_SIZES.chatPage);

      if (error) {
        console.error('Error fetching messages:', error.message);
        if (mode === 'initial') setLoading(false);
        return;
      }

      const page = ((data ?? []) as any[]).slice();
      // Normalise every page to ascending order.
      page.sort((a, b) => (a.created_at < b.created_at ? -1 : 1));

      if (page.length === 0) {
        if (mode === 'older') setHasMoreOlder(false);
        if (mode === 'initial') setLoading(false);
        return;
      }

      const ids = page.map((m) => m.id);
      let reactions: ChatReaction[] = [];
      if (ids.length > 0) {
        const { data: reactData } = await supabase
          .from('itinerary_chat_reactions')
          .select(CHAT_REACTION_FIELDS)
          .in('message_id', ids);
        reactions = (reactData || []) as unknown as ChatReaction[];
      }

      // Profiles are fetched once per mounted conversation, not per page.
      if (!profileMapRef.current) {
        const { data: profiles } = await supabase.rpc('get_itinerary_participant_profiles', {
          p_itinerary_id: itineraryId,
        });
        const map: Record<string, any> = {};
        (profiles || []).forEach((p: any) => {
          map[p.user_id] = {
            first_name: p.first_name,
            last_name: p.last_name,
            username: p.username,
            avatar_url: p.avatar_url,
          };
        });
        profileMapRef.current = map;
      }
      const senderMap = profileMapRef.current ?? {};

      setMessages((prev) => {
        const merged: Record<string, any> = {};
        for (const m of prev) merged[m.id] = m;
        for (const m of page) {
          merged[m.id] = {
            ...m,
            sender: senderMap[m.sender_id] || null,
            reactions: reactions.filter((r) => r.message_id === m.id),
          };
        }
        const all = Object.values(merged).sort((a: any, b: any) => (a.created_at < b.created_at ? -1 : 1));
        return all.map((m: any) => ({
          ...m,
          reply_to: m.reply_to_id ? merged[m.reply_to_id] || null : null,
        })) as ChatMessage[];
      });

      const first = page[0].created_at as string;
      const last = page[page.length - 1].created_at as string;
      if (!oldestCursorRef.current || first < oldestCursorRef.current) oldestCursorRef.current = first;
      if (!newestCursorRef.current || last > newestCursorRef.current) newestCursorRef.current = last;
      if (mode === 'initial' && page.length < PAGE_SIZES.chatPage) setHasMoreOlder(false);
      if (mode === 'initial') setLoading(false);
    },
    [itineraryId]
  );

  const loadOlderMessages = useCallback(() => loadMessages('older'), [loadMessages]);

  const resetPagination = useCallback(() => {
    oldestCursorRef.current = null;
    newestCursorRef.current = null;
    profileMapRef.current = null;
    setHasMoreOlder(true);
    setMessages([]);
  }, []);

  // Realtime subscription — exactly one channel per conversation/account.
  useEffect(() => {
    if (!itineraryId || !user?.id) return;
    const key = `chat-${itineraryId}-${user.id}`;
    if (subscribedKeyRef.current === key && channelRef.current) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    resetPagination();
    void loadMessages('initial');
    void fetchParticipants();

    const channel = supabase
      .channel(key)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'itinerary_chat_messages',
          filter: `itinerary_id=eq.${itineraryId}`,
        },
        (payload: any) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
            const row = payload.new ?? payload.old;
            if (row?.id) {
              setMessages((prev) =>
                prev
                  .map((m) => (m.id === row.id ? ({ ...m, ...payload.new } as ChatMessage) : m))
                  .filter((m) => (payload.eventType === 'DELETE' ? m.id !== row.id : true))
              );
              return;
            }
          }
          // New message: fetch only rows newer than the cursor.
          void loadMessages('newer');
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'itinerary_chat_reactions',
          filter: `itinerary_id=eq.${itineraryId}`,
        },
        (payload: any) => {
          const row = payload.new ?? payload.old;
          if (!row?.message_id) return;
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== row.message_id) return m;
              const others = m.reactions.filter((r) => r.id !== row.id);
              return {
                ...m,
                reactions: payload.eventType === 'DELETE' ? others : [...others, row as ChatReaction],
              };
            })
          );
        }
      )
      .subscribe();

    channelRef.current = channel;
    subscribedKeyRef.current = key;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      subscribedKeyRef.current = null;
    };
  }, [itineraryId, user?.id, loadMessages, fetchParticipants, resetPagination]);

  const sendMessage = async (
    content: string,
    attachmentType?: string | null,
    attachmentData?: any,
    replyToId?: string | null,
  ) => {
    if (!itineraryId || !user) return;

    const { error } = await supabase
      .from('itinerary_chat_messages')
      .insert({
        itinerary_id: itineraryId,
        sender_id: user.id,
        content: content || null,
        attachment_type: attachmentType || null,
        attachment_data: attachmentData || null,
        reply_to_id: replyToId || null,
      });

    if (error) console.error('Error sending message:', error);
  };

  const editMessage = async (messageId: string, newContent: string) => {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg || msg.sender_id !== user?.id) return;

    const created = new Date(msg.created_at).getTime();
    const tenMin = 10 * 60 * 1000;
    if (Date.now() - created > tenMin) return;

    const { error } = await supabase
      .from('itinerary_chat_messages')
      .update({ content: newContent, edited_at: new Date().toISOString() })
      .eq('id', messageId);

    if (error) console.error('Error editing message:', error);
  };

  const deleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from('itinerary_chat_messages')
      .update({ deleted: true, content: null, attachment_type: null, attachment_data: null })
      .eq('id', messageId);

    if (error) console.error('Error deleting message:', error);
  };

  const toggleReaction = async (messageId: string) => {
    if (!user) return;

    const existing = messages
      .find((m) => m.id === messageId)
      ?.reactions.find((r) => r.user_id === user.id && r.reaction === 'like');

    if (existing) {
      await supabase.from('itinerary_chat_reactions').delete().eq('id', existing.id);
    } else {
      await supabase.from('itinerary_chat_reactions').insert({
        message_id: messageId,
        user_id: user.id,
        reaction: 'like',
      });
    }
  };

  const uploadAttachment = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${itineraryId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('chat-attachments')
      .upload(path, file);

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    // Bucket is private — generate a long-lived signed URL (1 year)
    const { data: signed, error: signErr } = await supabase.storage
      .from('chat-attachments')
      .createSignedUrl(path, 60 * 60 * 24 * 365);
    if (signErr) {
      console.error('Sign URL error:', signErr);
      return null;
    }
    return signed?.signedUrl ?? null;
  };

  // Filtered messages
  const filteredMessages = messages.filter((m) => {
    if (participantFilter && m.sender_id !== participantFilter) return false;
    if (filter === 'media' && m.attachment_type !== 'image') return false;
    if (filter === 'docs' && m.attachment_type !== 'calendar_event' && m.attachment_type !== 'itinerary_card') return false;
    return true;
  });

  return {
    messages: filteredMessages,
    allMessages: messages,
    participants,
    loading,
    filter,
    setFilter,
    participantFilter,
    setParticipantFilter,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    uploadAttachment,
    hasMoreOlder,
    loadOlderMessages,
    refresh: () => loadMessages('newer'),
  };
};
