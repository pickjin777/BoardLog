export interface CompressionResult {
  dataUrl: string;
  sizeBytes: number;
  width: number;
  height: number;
}

const RASTER_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

export type ImageKind = 'ok' | 'heic' | 'unsupported';

/**
 * Some Android pickers send an empty type or application/octet-stream.
 * The extension is then the only hint. HEIC is rejected with its own message.
 */
export function imageKind(file: { type?: string; name?: string }): ImageKind {
  const type = (file.type ?? '').toLowerCase();
  const name = (file.name ?? '').toLowerCase();
  if (type === 'image/heic' || type === 'image/heif' || name.endsWith('.heic') || name.endsWith('.heif')) return 'heic';
  if (RASTER_TYPES.includes(type)) return 'ok';
  if ((!type || type === 'application/octet-stream') && /\.(jpe?g|png|webp)$/.test(name)) return 'ok';
  return 'unsupported';
}

function assertImageKind(file: { type?: string; name?: string }): void {
  const kind = imageKind(file);
  if (kind === 'heic') {
    throw new Error('이 사진은 HEIC 형식입니다. JPG 또는 PNG로 바꾼 뒤 다시 올려 주세요.');
  }
  if (kind !== 'ok') {
    throw new Error('지원되지 않는 이미지 형식입니다. (JPG, PNG, WebP 형식만 지원)');
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('이미지 데이터를 파싱할 수 없습니다.'));
    img.src = src;
  });
}

function releaseImage(img: HTMLImageElement): void {
  img.onload = null;
  img.onerror = null;
  img.src = '';
}

function releaseCanvas(canvas: HTMLCanvasElement): void {
  canvas.width = 0;
  canvas.height = 0;
}

function jpegBytes(dataUrl: string): number {
  const head = 'data:image/jpeg;base64,';
  return Math.round(((dataUrl.length - head.length) * 3) / 4);
}

/**
 * Compresses an image file using HTML Canvas:
 * - Max dimension: 1600px
 * - Format: JPEG (quality 0.7)
 * - Supported formats: jpg, jpeg, png, webp
 * - Max output size: 2MB check
 * The object URL is revoked when the draw finishes or fails.
 */
export async function compressImage(file: File, rotationDeg: number = 0): Promise<CompressionResult> {
  assertImageKind(file);
  const url = URL.createObjectURL(file);
  let img: HTMLImageElement | null = null;
  const canvas = document.createElement('canvas');
  try {
    img = await loadImage(url);
    const maxDim = 1600;
    let { width, height } = img;

    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('브라우저 Canvas를 초기화할 수 없습니다.');
    }

    const isRotatedQuarter = rotationDeg === 90 || rotationDeg === 270;
    canvas.width = isRotatedQuarter ? height : width;
    canvas.height = isRotatedQuarter ? width : height;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotationDeg * Math.PI) / 180);
    ctx.drawImage(img, -width / 2, -height / 2, width, height);
    ctx.restore();

    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    const sizeBytes = jpegBytes(dataUrl);
    const MAX_SIZE = 2 * 1024 * 1024;
    if (sizeBytes > MAX_SIZE) {
      throw new Error(
        `이미지 압축 후 용량(${Math.round(sizeBytes / 1024)}KB)이 2MB를 초과하여 등록할 수 없습니다. 더 작은 사진을 사용해주세요.`
      );
    }

    return {
      dataUrl,
      sizeBytes,
      width: canvas.width,
      height: canvas.height
    };
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error('이미지 처리 중 오류가 발생했습니다.');
  } finally {
    if (img) releaseImage(img);
    URL.revokeObjectURL(url);
    releaseCanvas(canvas);
  }
}

/** Re-rotates an existing dataUrl */
export async function rotateDataUrl(dataUrl: string, rotationDegDelta: number = 90): Promise<string> {
  let img: HTMLImageElement | null = null;
  const canvas = document.createElement('canvas');
  try {
    img = await loadImage(dataUrl);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 에러');

    canvas.width = img.height;
    canvas.height = img.width;

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotationDegDelta * Math.PI) / 180);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    return canvas.toDataURL('image/jpeg', 0.75);
  } finally {
    if (img) releaseImage(img);
    releaseCanvas(canvas);
  }
}
