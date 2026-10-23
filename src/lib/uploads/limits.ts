export const UPLOAD_LIMITS = {
  avatar: {
    maxBytes: 2 * 1024 * 1024,
    maxCount: 1,
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    label: 'JPG, PNG, or WEBP up to 2 MB',
  },
  chat: {
    maxBytes: 5 * 1024 * 1024,
    maxCount: 20,
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'],
    label: 'JPG, PNG, WEBP, GIF, or PDF up to 5 MB',
  },
  document: {
    maxBytes: 10 * 1024 * 1024,
    maxCount: 10,
    mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    label: 'PDF, JPG, or PNG up to 10 MB',
  },
} as const;

export type UploadKind = keyof typeof UPLOAD_LIMITS;

export const validateUpload = (
  kind: UploadKind,
  file: { size: number; type: string },
  existingCount = 0,
): string | null => {
  const rule = UPLOAD_LIMITS[kind];
  if (!rule.mimeTypes.includes(file.type as never)) return `That file type is not allowed. Use ${rule.label}.`;
  if (file.size > rule.maxBytes) return `That file is too large. ${rule.label}.`;
  if (existingCount >= rule.maxCount) return `You can upload ${rule.maxCount} file${rule.maxCount === 1 ? '' : 's'} here.`;
  return null;
};
