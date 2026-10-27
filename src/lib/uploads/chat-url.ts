import { supabase } from '@/integrations/supabase/client';
import { CHAT_ATTACHMENT_URL_TTL_SECONDS } from './paths';

type CacheEntry = { url: string; expiresAt: number };
const cache = new Map<string, CacheEntry>();

export const __resetChatAttachmentUrlCache = (): void => {
  cache.clear();
};

/**
 * Signs a chat attachment for the current member. The URL is not stored on the
 * message. Storage select policy requires a current accepted attendee, so a
 * removed member cannot mint a new one. Already-issued year-long URLs from
 * before this change stay valid until they expire; views no longer use them.
 */
export const getChatAttachmentUrl = async (path: string): Promise<string | null> => {
  const now = Date.now();
  const hit = cache.get(path);
  if (hit && hit.expiresAt - now > 30_000) return hit.url;

  const { data, error } = await supabase.storage
    .from('chat-attachments')
    .createSignedUrl(path, CHAT_ATTACHMENT_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    cache.delete(path);
    return null;
  }

  cache.set(path, {
    url: data.signedUrl,
    expiresAt: now + CHAT_ATTACHMENT_URL_TTL_SECONDS * 1000,
  });
  return data.signedUrl;
};
