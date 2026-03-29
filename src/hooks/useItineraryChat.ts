import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

  const fetchParticipants = useCallback(async () => {
    if (!itineraryId) return;
    const { data } = await supabase
      .from('itinerary_chat_participants')
      .select('*')
      .eq('itinerary_id', itineraryId);

    if (!data) return;

    const withUsers = await Promise.all(
      data.map(async (p: any) => {
        const { data: u } = await supabase
          .from('users')
          .select('first_name, last_name, username, avatar_url')
          .eq('userid', p.user_id)
          .single();
        return { ...p, user: u };
      })
    );
    setParticipants(withUsers);
  }, [itineraryId]);

  const fetchMessages = useCallback(async () => {
    if (!itineraryId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('itinerary_chat_messages')
      .select('*')
      .eq('itinerary_id', itineraryId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      setLoading(false);
      return;
    }

    // Fetch reactions for all messages
    const messageIds = (data || []).map((m: any) => m.id);
    let reactions: ChatReaction[] = [];
    if (messageIds.length > 0) {
      const { data: reactData } = await supabase
        .from('itinerary_chat_reactions')
        .select('*')
        .in('message_id', messageIds);
      reactions = (reactData || []) as ChatReaction[];
    }

    // Fetch sender info
    const senderIds = [...new Set((data || []).map((m: any) => m.sender_id))];
    const senderMap: Record<string, any> = {};
    await Promise.all(
      senderIds.map(async (sid) => {
        const { data: u } = await supabase
          .from('users')
          .select('first_name, last_name, username, avatar_url')
          .eq('userid', sid)
          .single();
        senderMap[sid as string] = u;
      })
    );

    // Build reply references (only 1 level deep)
    const msgMap: Record<string, any> = {};
    (data || []).forEach((m: any) => { msgMap[m.id] = m; });

    const enriched: ChatMessage[] = (data || []).map((m: any) => ({
      ...m,
      sender: senderMap[m.sender_id] || null,
      reply_to: m.reply_to_id ? msgMap[m.reply_to_id] || null : null,
      reactions: reactions.filter((r) => r.message_id === m.id),
    }));

    setMessages(enriched);
    setLoading(false);
  }, [itineraryId]);

  // Realtime subscription
  useEffect(() => {
    if (!itineraryId) return;

    fetchMessages();
    fetchParticipants();

    const channel = supabase
      .channel(`chat-${itineraryId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'itinerary_chat_messages',
        filter: `itinerary_id=eq.${itineraryId}`,
      }, () => { fetchMessages(); })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'itinerary_chat_reactions',
      }, () => { fetchMessages(); })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [itineraryId, fetchMessages, fetchParticipants]);

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

    const { data: urlData } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(path);

    return urlData.publicUrl;
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
    refresh: fetchMessages,
  };
};
