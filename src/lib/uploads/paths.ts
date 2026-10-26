/** Ten minutes: long enough to paint the open chat, short enough that a removed member's link dies quickly. */
export const CHAT_ATTACHMENT_URL_TTL_SECONDS = 10 * 60;

export const extensionForMime = (mime: string): string | null => {
  switch (mime.toLowerCase().split(';')[0].trim()) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    case 'image/heic':
    case 'image/heic-sequence':
      return 'heic';
    case 'image/heif':
    case 'image/heif-sequence':
      return 'heif';
    case 'application/pdf':
      return 'pdf';
    default:
      return null;
  }
};

export const isSafeStoragePath = (path: string): boolean => {
  if (!path || path.length > 512) return false;
  if (path.startsWith('/') || path.includes('..') || path.includes('\\') || path.includes('://') || path.includes('\0')) {
    return false;
  }
  const parts = path.split('/');
  return parts.length >= 2 && parts.every((part) => part.length > 0 && part !== '.');
};

/** Pulls the object path out of a previously stored signed or public URL. */
export const pathFromStoredUrl = (url: string): string | null => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const markers = [
      '/object/sign/chat-attachments/',
      '/object/public/chat-attachments/',
      '/object/authenticated/chat-attachments/',
    ];
    for (const marker of markers) {
      const index = parsed.pathname.indexOf(marker);
      if (index === -1) continue;
      const path = decodeURIComponent(parsed.pathname.slice(index + marker.length));
      return isSafeStoragePath(path) ? path : null;
    }
    return null;
  } catch {
    return null;
  }
};

export const chatAttachmentPath = (data: unknown): string | null => {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;
  if (typeof record.path === 'string' && isSafeStoragePath(record.path)) return record.path;
  if (typeof record.url === 'string') return pathFromStoredUrl(record.url);
  return null;
};
