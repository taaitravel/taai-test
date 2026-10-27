import { convertHeicToJpeg, isHeicFile, withHeicType, type HeicDecoder } from './heic';
import { validateUpload, type UploadKind } from './limits';
import { describeHeicFailure, describeUploadViolation, type UploadNotice } from './notices';

export type PreparedUpload =
  | { ok: true; file: File }
  | { ok: false; title: string; message: string };

/**
 * Normalizes an iPhone HEIC photo, then applies the size, type, and count
 * rules for that upload surface. Chat keeps an unconverted HEIC so the photo
 * still uploads. Avatar and document uploads need a JPEG the app can show.
 */
export const prepareAndValidate = async (
  kind: UploadKind,
  file: File,
  existingCount = 0,
  decode?: HeicDecoder,
): Promise<PreparedUpload> => {
  let prepared = file;
  if (isHeicFile(file)) {
    try {
      prepared = await convertHeicToJpeg(file, decode);
    } catch {
      if (kind !== 'chat') return { ok: false, ...describeHeicFailure() };
      prepared = withHeicType(file);
    }
  }

  const violation = validateUpload(kind, prepared, existingCount);
  if (violation) return { ok: false, ...describeUploadViolation(kind, violation) };
  return { ok: true, file: prepared };
};
