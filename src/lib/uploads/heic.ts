const HEIC_TYPES = new Set([
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
]);

export type HeicDecoder = (file: Blob) => Promise<Blob>;

/** True for iPhone HEIC/HEIF photos, including the empty MIME type iOS sometimes reports. */
export const isHeicFile = (file: { name?: string; type?: string }): boolean => {
  const type = (file.type || '').toLowerCase().split(';')[0].trim();
  if (HEIC_TYPES.has(type)) return true;
  if (!/\.hei[cf]$/i.test(file.name || '')) return false;
  return type === '' || type === 'application/octet-stream';
};

const blobFromCanvas = (canvas: HTMLCanvasElement): Promise<Blob> => new Promise((resolve, reject) => {
  canvas.toBlob((blob) => {
    if (blob) resolve(blob);
    else reject(new Error('HEIC conversion produced no image'));
  }, 'image/jpeg', 0.92);
});

const drawToJpeg = async (source: CanvasImageSource, width: number, height: number): Promise<Blob> => {
  if (!width || !height) throw new Error('HEIC photo has no dimensions');
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable');
  ctx.drawImage(source, 0, 0, width, height);
  return blobFromCanvas(canvas);
};

/** Safari on iPhone can decode HEIC. Other browsers throw and the caller decides what to do. */
export const defaultHeicDecoder: HeicDecoder = async (file) => {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      try {
        return await drawToJpeg(bitmap, bitmap.width, bitmap.height);
      } finally {
        bitmap.close?.();
      }
    } catch {
      // Fall through to the image element, which also decodes HEIC on iOS.
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('This browser could not read the HEIC photo'));
      img.src = url;
    });
    return await drawToJpeg(img, img.naturalWidth, img.naturalHeight);
  } finally {
    URL.revokeObjectURL(url);
  }
};

export const convertHeicToJpeg = async (file: File, decode: HeicDecoder = defaultHeicDecoder): Promise<File> => {
  const blob = await decode(file);
  const base = (file.name || 'photo').replace(/\.hei[cf]$/i, '') || 'photo';
  return new File([blob], `${base}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
};

export const withHeicType = (file: File): File => {
  const type = (file.type || '').toLowerCase();
  const normalized = type.includes('heif') ? 'image/heif' : 'image/heic';
  if (file.type === normalized) return file;
  return new File([file], file.name || (normalized === 'image/heif' ? 'photo.heif' : 'photo.heic'), {
    type: normalized,
    lastModified: file.lastModified,
  });
};
