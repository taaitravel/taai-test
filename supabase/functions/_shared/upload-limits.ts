/**
 * Byte and count ceilings for traveler uploads.
 * Keep these equal to src/lib/uploads/limits.ts and to
 * private.claim_storage_folder_slot() in the storage migration.
 * Receipt PDFs are the document upload surface (receipts bucket).
 */
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_MAX_COUNT = 1;

export const CHAT_MAX_BYTES = 5 * 1024 * 1024;
export const CHAT_MAX_COUNT = 20;

export const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;
export const DOCUMENT_MAX_COUNT = 10;

export type DocumentUploadBlock = 'DOCUMENT_TOO_LARGE' | 'DOCUMENT_LIMIT';

/** Fast size check before a receipt is written. The folder cap is reserve_storage_upload. */
export const documentUploadBlock = (bytes: number, existingCount: number): DocumentUploadBlock | null => {
  if (bytes > DOCUMENT_MAX_BYTES) return 'DOCUMENT_TOO_LARGE';
  if (existingCount >= DOCUMENT_MAX_COUNT) return 'DOCUMENT_LIMIT';
  return null;
};
