import {
  AVATAR_MAX_BYTES,
  AVATAR_MAX_COUNT,
  CHAT_MAX_BYTES,
  CHAT_MAX_COUNT,
  DOCUMENT_MAX_BYTES,
  DOCUMENT_MAX_COUNT,
} from '../../../supabase/functions/_shared/upload-limits';

export const UPLOAD_LIMITS = {
  avatar: {
    maxBytes: AVATAR_MAX_BYTES,
    maxCount: AVATAR_MAX_COUNT,
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    label: 'JPG, PNG, or WEBP up to 2 MB',
  },
  chat: {
    maxBytes: CHAT_MAX_BYTES,
    maxCount: CHAT_MAX_COUNT,
    mimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/heic',
      'image/heif',
      'application/pdf',
    ],
    label: 'JPG, PNG, WEBP, GIF, HEIC, or PDF up to 5 MB',
  },
  document: {
    maxBytes: DOCUMENT_MAX_BYTES,
    maxCount: DOCUMENT_MAX_COUNT,
    mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    label: 'PDF, JPG, or PNG up to 10 MB',
  },
} as const;

export type UploadKind = keyof typeof UPLOAD_LIMITS;
export type UploadViolation = 'type' | 'size' | 'count';

const HEIC_INPUT = ['image/heic', 'image/heif', '.heic', '.heif'] as const;

const extensionForMime = (mime: string): string | null => {
  switch (mime) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'image/gif':
      return '.gif';
    case 'image/heic':
      return '.heic';
    case 'image/heif':
      return '.heif';
    case 'application/pdf':
      return '.pdf';
    default:
      return null;
  }
};

/**
 * File-picker accept list for a kind. Includes every validated MIME type,
 * plus HEIC for surfaces that convert iPhone photos before the type check.
 */
export const acceptFor = (kind: UploadKind): string => {
  const mimes: string[] = [...UPLOAD_LIMITS[kind].mimeTypes];
  const extensions = mimes.map((mime) => extensionForMime(mime)).filter((ext): ext is string => Boolean(ext));
  const heic = kind === 'document' ? [] : [...HEIC_INPUT];
  return [...new Set([...mimes, ...extensions, ...heic])].join(',');
};

export const validateUpload = (
  kind: UploadKind,
  file: { size: number; type: string },
  existingCount = 0,
): UploadViolation | null => {
  const rule = UPLOAD_LIMITS[kind];
  const type = file.type.toLowerCase().split(';')[0].trim();
  if (!rule.mimeTypes.includes(type as never)) return 'type';
  if (file.size > rule.maxBytes) return 'size';
  if (existingCount >= rule.maxCount) return 'count';
  return null;
};
