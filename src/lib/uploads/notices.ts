import { UPLOAD_LIMITS, type UploadKind, type UploadViolation } from './limits';

/** Title plus a full sentence, in the style of an iOS alert. */
export type UploadNotice = {
  title: string;
  message: string;
};

const GUIDANCE: Record<UploadKind, string> = {
  avatar: 'Choose a JPG, PNG, or WEBP photo up to 2 MB.',
  chat: 'Choose a JPG, PNG, WEBP, GIF, HEIC photo, or PDF up to 5 MB.',
  document: 'Choose a PDF, JPG, or PNG up to 10 MB.',
};

const guidance = (kind: UploadKind): string => GUIDANCE[kind];

export const describeUploadViolation = (kind: UploadKind, violation: UploadViolation): UploadNotice => {
  if (violation === 'size') {
    return {
      title: 'File Is Too Large',
      message: `This file is over the limit. ${guidance(kind)}`,
    };
  }
  if (violation === 'count') {
    if (kind === 'chat') {
      return {
        title: 'This Chat Is Full',
        message: `A trip chat can hold ${UPLOAD_LIMITS.chat.maxCount} photos and files. Remove one, then try again.`,
      };
    }
    if (kind === 'document') {
      return {
        title: 'Document Limit Reached',
        message: `You can keep ${UPLOAD_LIMITS.document.maxCount} documents. Remove one, then try again.`,
      };
    }
    return {
      title: 'One Profile Photo',
      message: 'A profile keeps a single photo. Remove the extra photo, then try again.',
    };
  }
  return {
    title: kind === 'avatar' ? 'Choose a Different Photo' : 'Choose a Different File',
    message: `That file type isn't supported. ${guidance(kind)}`,
  };
};

export const describeHeicFailure = (): UploadNotice => ({
  title: "Couldn't Read This Photo",
  message: "This iPhone photo is in HEIC format and couldn't be converted. Try again, or choose a JPEG.",
});

export const describeUnreadableFile = (kind: UploadKind): UploadNotice => ({
  title: kind === 'avatar' ? "Couldn't Use That Photo" : "Couldn't Read That File",
  message: kind === 'avatar'
    ? 'Choose a JPG, PNG, or WEBP photo up to 2 MB and try again.'
    : 'Choose a different file and try again.',
});

export const describeUploadFailure = (kind: UploadKind): UploadNotice => ({
  title: kind === 'avatar' ? "Couldn't Update Profile Photo" : "Couldn't Add That File",
  message: kind === 'avatar'
    ? "The photo didn't upload. Check your connection and try again."
    : "The file didn't upload. Check your connection and try again.",
});

export const describeUploadDenied = (kind: UploadKind): UploadNotice => ({
  title: kind === 'avatar' ? "Couldn't Update Profile Photo" : "Couldn't Add That File",
  message: kind === 'avatar'
    ? 'Sign in again, then retry the photo.'
    : 'You can add files only while you are on this trip. If you were removed, ask the owner to invite you again.',
});

export const describeSendFailure = (): UploadNotice => ({
  title: "Couldn't Send",
  message: "The message didn't send. Check your connection and try again.",
});

const errorText = (error: unknown): string => {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && 'message' in error) return String((error as { message?: unknown }).message ?? '');
  return '';
};

/** Maps a storage or database failure onto a traveler-facing alert. Never returns an empty notice. */
export const describeStorageFailure = (kind: UploadKind, error: unknown): UploadNotice => {
  const text = errorText(error);
  if (/CHAT_ATTACHMENT_LIMIT/i.test(text)) return describeUploadViolation('chat', 'count');
  if (/DOCUMENT_LIMIT/i.test(text)) return describeUploadViolation('document', 'count');
  if (/AVATAR_LIMIT/i.test(text)) return describeUploadViolation('avatar', 'count');
  if (/mime|content.type|invalid_mime|invalid mime|not allowed/i.test(text)) return describeUploadViolation(kind, 'type');
  if (/too large|payload|entity too large|maximum allowed size|file size/i.test(text)) return describeUploadViolation(kind, 'size');
  if (/row-level security|permission|not authorized|unauthorized|jwt|403/i.test(text)) return describeUploadDenied(kind);
  return describeUploadFailure(kind);
};
