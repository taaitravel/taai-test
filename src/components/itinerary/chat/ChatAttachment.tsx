import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import type { ChatMessage } from '@/hooks/useItineraryChat';
import { getChatAttachmentUrl } from '@/lib/uploads/chat-url';
import { chatAttachmentPath } from '@/lib/uploads/paths';

interface ChatAttachmentProps {
  message: ChatMessage;
}

/**
 * Loads a fresh short-lived signed URL when the message is shown.
 * Stored year-long URLs are not used as the image source.
 */
export const ChatAttachment = ({ message }: ChatAttachmentProps) => {
  const path = chatAttachmentPath(message.attachment_data);
  const [url, setUrl] = useState<string | null>(null);
  const [broken, setBroken] = useState(false);
  const [state, setState] = useState<'loading' | 'ready' | 'unavailable'>(path ? 'loading' : 'unavailable');

  useEffect(() => {
    if (!path) {
      setState('unavailable');
      setUrl(null);
      return;
    }
    let cancelled = false;
    setState('loading');
    setBroken(false);
    getChatAttachmentUrl(path).then((signed) => {
      if (cancelled) return;
      if (!signed) {
        setUrl(null);
        setState('unavailable');
        return;
      }
      setUrl(signed);
      setState('ready');
    });
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (state === 'unavailable') {
    return <p className="mt-1 text-xs opacity-80">This attachment isn't available.</p>;
  }
  if (state !== 'ready' || !url) {
    return <p className="mt-1 text-xs opacity-70">Loading attachment…</p>;
  }

  const rawName = message.attachment_data?.name;
  const name = typeof rawName === 'string' && rawName.trim() ? rawName : 'Attachment';
  const isDocument = message.attachment_type === 'document' || path?.toLowerCase().endsWith('.pdf');

  if (isDocument || broken) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="mt-1 inline-flex items-center gap-1.5 text-xs underline underline-offset-2"
      >
        <FileText className="h-3.5 w-3.5" />
        {broken ? `Open ${name}` : name}
      </a>
    );
  }

  return (
    <img
      src={url}
      alt={name === 'Attachment' ? 'Shared photo' : name}
      className="mt-1 max-h-60 max-w-full rounded-lg object-cover"
      onError={() => setBroken(true)}
    />
  );
};
