/**
 * Calendar cells must not decode a full play photo.
 * The small JPEG lives only in memory for this page view. It is not stored and not uploaded.
 */

export const THUMB_EDGE = 64;
export const THUMB_QUALITY = 0.6;

const cache = new Map<string, string>();

export function clearThumbnailCache(): void {
  cache.clear();
}

export function canDownscaleLocally(url: string): boolean {
  return url.startsWith('data:image/');
}

export function thumbnailKey(url: string, maxEdge: number): string {
  let hash = 2166136261;
  for (let i = 0; i < url.length; i += 1) {
    hash ^= url.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `${maxEdge}:${url.length}:${hash >>> 0}`;
}

export function fittedSize(width: number, height: number, maxEdge: number): { width: number; height: number } {
  if (width <= 0 || height <= 0 || maxEdge <= 0) return { width: 1, height: 1 };
  if (width <= maxEdge && height <= maxEdge) return { width, height };
  if (width >= height) return { width: maxEdge, height: Math.max(1, Math.round((height * maxEdge) / width)) };
  return { width: Math.max(1, Math.round((width * maxEdge) / height)), height: maxEdge };
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('image'));
    image.src = url;
  });
}

async function renderThumbnail(url: string, maxEdge: number): Promise<string> {
  const image = await loadImage(url);
  const size = fittedSize(image.width, image.height, maxEdge);
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  ctx.drawImage(image, 0, 0, size.width, size.height);
  const encoded = canvas.toDataURL('image/jpeg', THUMB_QUALITY);
  if (!encoded.startsWith('data:image/jpeg')) throw new Error('encode');
  if (encoded.length >= url.length) throw new Error('larger');
  return encoded;
}

/** Returns the original URL when the image is remote, the canvas is missing, or shrinking would not help. */
export async function downscaleDataUrl(url: string, maxEdge = THUMB_EDGE): Promise<string> {
  if (!canDownscaleLocally(url)) return url;
  const key = thumbnailKey(url, maxEdge);
  const cached = cache.get(key);
  if (cached) return cached;
  if (typeof document === 'undefined') return url;
  try {
    const encoded = await renderThumbnail(url, maxEdge);
    cache.set(key, encoded);
    return encoded;
  } catch {
    return url;
  }
}
