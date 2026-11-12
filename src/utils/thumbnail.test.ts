import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  THUMB_QUALITY,
  canDownscaleLocally,
  clearThumbnailCache,
  downscaleDataUrl,
  fittedSize,
  thumbnailKey
} from './thumbnail';

afterEach(() => {
  clearThumbnailCache();
  vi.unstubAllGlobals();
});

describe('thumbnail sizing', () => {
  it('fits the long edge and refuses a remote address', () => {
    expect(fittedSize(0, 10, 64)).toEqual({ width: 1, height: 1 });
    expect(fittedSize(10, -1, 64)).toEqual({ width: 1, height: 1 });
    expect(fittedSize(10, 10, 0)).toEqual({ width: 1, height: 1 });
    expect(fittedSize(40, 20, 64)).toEqual({ width: 40, height: 20 });
    expect(fittedSize(320, 80, 64)).toEqual({ width: 64, height: 16 });
    expect(fittedSize(80, 320, 64)).toEqual({ width: 16, height: 64 });
    expect(fittedSize(40, 100, 64)).toEqual({ width: 26, height: 64 });
    expect(fittedSize(10000, 1, 64)).toEqual({ width: 64, height: 1 });
    expect(fittedSize(1, 10000, 64)).toEqual({ width: 1, height: 64 });
    expect(canDownscaleLocally('data:image/jpeg;base64,aa')).toBe(true);
    expect(canDownscaleLocally('data:text/plain,aa')).toBe(false);
    expect(canDownscaleLocally('https://example.test/a.jpg')).toBe(false);
  });

  it('keys the memory cache by the pixels, not a second stored file', () => {
    expect(thumbnailKey('', 64)).toBe(thumbnailKey('', 64));
    expect(thumbnailKey('data:image/jpeg;base64,a', 64)).not.toBe(thumbnailKey('data:image/jpeg;base64,b', 64));
    expect(thumbnailKey('data:image/jpeg;base64,a', 32)).not.toBe(thumbnailKey('data:image/jpeg;base64,a', 64));
  });
});

describe('downscaleDataUrl', () => {
  const source = `data:image/jpeg;base64,${'A'.repeat(400)}`;

  function installDom(options: {
    width?: number;
    height?: number;
    context?: boolean;
    encoded?: string;
    fail?: 'load' | 'draw';
  }) {
    const encoded = options.encoded ?? 'data:image/jpeg;base64,tiny';
    const toDataURL = vi.fn(() => encoded);
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => (options.context === false ? null : { drawImage }),
      toDataURL
    };
    function drawImage() {
      if (options.fail === 'draw') throw new Error('draw');
    }
    class FakeImage {
      width = options.width ?? 320;
      height = options.height ?? 80;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) {
        if (options.fail === 'load') this.onerror?.();
        else this.onload?.();
      }
    }
    vi.stubGlobal('Image', FakeImage);
    vi.stubGlobal('document', { createElement: () => canvas });
    return { canvas, toDataURL };
  }

  it('returns remote and uncached local URLs unchanged when there is no document', async () => {
    expect(await downscaleDataUrl('https://example.test/a.jpg')).toBe('https://example.test/a.jpg');
    expect(await downscaleDataUrl(source)).toBe(source);
  });

  it('caches a smaller jpeg and reuses it', async () => {
    const dom = installDom({ width: 320, height: 80 });
    const first = await downscaleDataUrl(source, 32);
    expect(first).toBe('data:image/jpeg;base64,tiny');
    expect(dom.canvas).toMatchObject({ width: 32, height: 8 });
    expect(dom.toDataURL).toHaveBeenCalledWith('image/jpeg', THUMB_QUALITY);
    vi.unstubAllGlobals();
    expect(await downscaleDataUrl(source, 32)).toBe(first);
    expect(dom.toDataURL).toHaveBeenCalledTimes(1);
  });

  it('keeps the original when shrinking does not produce a smaller jpeg', async () => {
    installDom({ encoded: `${source}EXTRA` });
    expect(await downscaleDataUrl(source)).toBe(source);
    installDom({ context: false });
    expect(await downscaleDataUrl(`${source}B`)).toBe(`${source}B`);
    installDom({ fail: 'load', encoded: 'data:image/jpeg;base64,tiny' });
    expect(await downscaleDataUrl(`${source}C`)).toBe(`${source}C`);
    installDom({ fail: 'draw' });
    expect(await downscaleDataUrl(`${source}D`)).toBe(`${source}D`);
    installDom({ encoded: 'blob:nope' });
    expect(await downscaleDataUrl(`${source}E`)).toBe(`${source}E`);
  });
});
