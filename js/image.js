/**
 * Bildverarbeitung im Browser: Kamerafoto verkleinern, Thumbnail erzeugen,
 * Base64 für die API.
 *
 * Warum verkleinern? Die Bildkosten der API hängen an der Pixelzahl
 * (grob Breite × Höhe / 750 Tokens). 1024 px lange Kante kostet rund
 * 1.000 Tokens statt ~1.600 bei voller Auflösung — bei gleicher
 * Erkennungsqualität für Essen. Nebenbei bleibt die Datenbank klein.
 */

export const MAX_EDGE = 1024;
export const THUMB_EDGE = 256;
const JPEG_QUALITY = 0.82;

/** Lädt eine Bilddatei als Bitmap, mit Rücksicht auf die EXIF-Drehung. */
async function loadBitmap(source) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(source, { imageOrientation: 'from-image' });
    } catch {
      // Ältere Browser kennen die Option nicht — unten geht es ohne weiter.
    }
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(source);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Das Bild konnte nicht gelesen werden.'));
    };
    img.src = url;
  });
}

function targetSize(width, height, maxEdge) {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) return { width, height };
  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Bild konnte nicht kodiert werden.'))),
      'image/jpeg',
      quality
    );
  });
}

/** Zeichnet ein Bitmap auf eine verkleinerte Canvas und gibt ein JPEG zurück. */
async function encodeScaled(bitmap, maxEdge, quality = JPEG_QUALITY) {
  const width = bitmap.width || bitmap.naturalWidth;
  const height = bitmap.height || bitmap.naturalHeight;
  const size = targetSize(width, height, maxEdge);

  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;

  const context = canvas.getContext('2d');
  context.imageSmoothingQuality = 'high';
  context.drawImage(bitmap, 0, 0, size.width, size.height);

  const blob = await canvasToBlob(canvas, quality);
  return { blob, width: size.width, height: size.height };
}

/**
 * Verarbeitet ein Kamerafoto zu Speicherbild und Thumbnail.
 * @returns {Promise<{photo: Blob, thumb: Blob, width: number, height: number}>}
 */
export async function processPhoto(file) {
  if (!(file instanceof Blob)) throw new Error('Keine Bilddatei erhalten.');
  if (file.type && !file.type.startsWith('image/')) {
    throw new Error('Das ist keine Bilddatei.');
  }

  const bitmap = await loadBitmap(file);
  const photo = await encodeScaled(bitmap, MAX_EDGE);
  const thumb = await encodeScaled(bitmap, THUMB_EDGE, 0.7);

  if (typeof bitmap.close === 'function') bitmap.close();

  return {
    photo: photo.blob,
    thumb: thumb.blob,
    width: photo.width,
    height: photo.height,
  };
}

/** Base64 ohne 'data:'-Präfix — genau das erwartet die Anthropic-API. */
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error('Das Bild konnte nicht gelesen werden.'));
    reader.readAsDataURL(blob);
  });
}
